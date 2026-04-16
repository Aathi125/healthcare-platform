/**
 * Authentication Middleware
 * Dual-mode: JWT (OAuth2 RS256) verification + API Gateway header fallback
 *
 * Priority:
 *   1. If Authorization: Bearer <token> is present → verify with OAUTH2_PUBLIC_KEY (RS256)
 *   2. Else if x-user-id / x-user-role headers exist → trust API Gateway headers
 *   3. Otherwise → 401
 */

const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

// ────────────────────────────────────────────────────────────────────
//  OAuth2 / JWT helpers (aligned with auth-service)
// ────────────────────────────────────────────────────────────────────

/**
 * Build PEM-formatted public key from the raw base-64 env var
 */
function getOAuth2PublicKey() {
  const raw = (process.env.OAUTH2_PUBLIC_KEY || '').trim();
  if (!raw) return null; // JWT mode unavailable
  if (raw.includes('BEGIN PUBLIC KEY')) {
    return raw.replace(/\\n/g, '\n');
  }
  return `-----BEGIN PUBLIC KEY-----\n${raw.replace(/\\n/g, '\n')}\n-----END PUBLIC KEY-----`;
}

/**
 * Extract Bearer token from Authorization header
 */
function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Normalize a raw role string to one of the app roles
 */
function toAppRole(rawRole) {
  if (!rawRole) return null;
  const normalized = String(rawRole).toUpperCase();
  // Map to lowercase to match patient-service convention
  const map = { ADMIN: 'admin', DOCTOR: 'doctor', PATIENT: 'patient' };
  return map[normalized] || null;
}

/**
 * Walk the Keycloak / OAuth2 token payload and pick the first known role
 */
function extractRoleFromOAuthPayload(payload) {
  const candidates = [];

  // Realm-level roles
  const realmRoles = Array.isArray(payload?.realm_access?.roles)
    ? payload.realm_access.roles
    : [];
  candidates.push(...realmRoles);

  // Client-level roles
  const clientId = (process.env.OAUTH2_CLIENT_ID || '').trim();
  if (clientId) {
    const clientRoles = Array.isArray(payload?.resource_access?.[clientId]?.roles)
      ? payload.resource_access[clientId].roles
      : [];
    candidates.push(...clientRoles);
  }

  // Any other resource_access entries
  const resourceAccess = payload?.resource_access || {};
  for (const key of Object.keys(resourceAccess)) {
    const roles = Array.isArray(resourceAccess[key]?.roles)
      ? resourceAccess[key].roles
      : [];
    candidates.push(...roles);
  }

  // Direct role claim
  candidates.push(payload?.role);

  for (const role of candidates) {
    const mapped = toAppRole(role);
    if (mapped) return mapped;
  }
  return null;
}

/**
 * Verify an RS256 OAuth2 access token
 */
function verifyOAuthAccessToken(token) {
  const publicKey = getOAuth2PublicKey();
  if (!publicKey) {
    throw new Error('OAUTH2_PUBLIC_KEY not configured');
  }
  const issuer = (process.env.OAUTH2_ISSUER_URL || '').trim() || undefined;
  const audience = (process.env.OAUTH2_AUDIENCE || '').trim() || undefined;
  const options = { algorithms: ['RS256'], issuer };
  if (audience) options.audience = audience;
  return jwt.verify(token, publicKey, options);
}

// ────────────────────────────────────────────────────────────────────
//  Middleware
// ────────────────────────────────────────────────────────────────────

/**
 * Primary auth middleware (dual-mode)
 * Sets req.user = { userId, email, role }
 */
const authMiddleware = async (req, res, next) => {
  try {
    const bearerToken = getBearerToken(req);

    // ── Mode 1: JWT verification ──────────────────────────────────
    if (bearerToken) {
      let payload;
      try {
        payload = verifyOAuthAccessToken(bearerToken);
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired access token'
        });
      }

      const role = extractRoleFromOAuthPayload(payload);
      const email = (payload?.email || payload?.preferred_username || '').toLowerCase().trim();
      const userId = payload?.sub || null;

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'No valid role found in access token'
        });
      }

      req.user = { userId, email, role };

      // If the caller is a patient, resolve patientId
      if (role === 'patient') {
        const patient = await Patient.findOne({
          $or: [
            { userId: userId },
            ...(email ? [{ email: email }] : [])
          ],
          isDeleted: { $ne: true }
        }).select('patientId');

        if (patient) {
          req.user.patientId = patient.patientId;
        }
      }

      return next();
    }

    // ── Mode 2: API Gateway headers fallback ──────────────────────
    const headerUserId = req.headers['x-user-id'];
    const headerEmail = req.headers['x-user-email'];
    const headerRole = req.headers['x-user-role'];

    if (headerUserId && headerRole) {
      req.user = {
        userId: headerUserId,
        email: headerEmail,
        role: headerRole
      };

      // For patient role, fetch patientId
      if (headerRole === 'patient') {
        const patient = await Patient.findOne({
          userId: headerUserId,
          isDeleted: { $ne: true }
        }).select('patientId');

        if (patient) {
          req.user.patientId = patient.patientId;
        }
      }

      return next();
    }

    // ── No credentials ────────────────────────────────────────────
    return res.status(401).json({
      success: false,
      message: 'No token provided or missing API Gateway headers'
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Role-based access control middleware
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Optional auth - doesn't fail if no token / headers present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const bearerToken = getBearerToken(req);

    if (bearerToken) {
      try {
        const payload = verifyOAuthAccessToken(bearerToken);
        const role = extractRoleFromOAuthPayload(payload);
        const email = (payload?.email || payload?.preferred_username || '').toLowerCase().trim();
        req.user = {
          userId: payload?.sub || null,
          email,
          role
        };
      } catch (_) {
        // Token invalid – treat as unauthenticated
      }
    } else {
      const userId = req.headers['x-user-id'];
      const email = req.headers['x-user-email'];
      const role = req.headers['x-user-role'];

      if (userId && role) {
        req.user = { userId, email, role };
      }
    }
  } catch (_) {
    // Ignore errors for optional auth
  }
  next();
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  optionalAuth
};
