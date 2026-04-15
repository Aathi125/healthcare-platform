const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

function getOAuth2PublicKey() {
  const raw = (process.env.OAUTH2_PUBLIC_KEY || "").trim();
  if (!raw) {
    throw new Error("OAUTH2_PUBLIC_KEY is required");
  }
  if (raw.includes("BEGIN PUBLIC KEY")) {
    return raw.replace(/\\n/g, "\n");
  }
  return `-----BEGIN PUBLIC KEY-----\n${raw.replace(/\\n/g, "\n")}\n-----END PUBLIC KEY-----`;
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

function toAppRole(rawRole) {
  if (!rawRole) return null;
  const normalized = String(rawRole).toUpperCase();
  if (["ADMIN", "DOCTOR", "PATIENT"].includes(normalized)) return normalized;
  return null;
}

function extractRoleFromOAuthPayload(payload) {
  const candidates = [];
  const realmRoles = Array.isArray(payload?.realm_access?.roles) ? payload.realm_access.roles : [];
  candidates.push(...realmRoles);

  const clientId = (process.env.OAUTH2_CLIENT_ID || "").trim();
  if (clientId) {
    const clientRoles = Array.isArray(payload?.resource_access?.[clientId]?.roles)
      ? payload.resource_access[clientId].roles
      : [];
    candidates.push(...clientRoles);
  }

  const resourceAccess = payload?.resource_access || {};
  for (const key of Object.keys(resourceAccess)) {
    const roles = Array.isArray(resourceAccess[key]?.roles) ? resourceAccess[key].roles : [];
    candidates.push(...roles);
  }

  candidates.push(payload?.role);

  for (const role of candidates) {
    const mapped = toAppRole(role);
    if (mapped) return mapped;
  }
  return null;
}

function verifyOAuthAccessToken(token) {
  const issuer = (process.env.OAUTH2_ISSUER_URL || "").trim() || undefined;
  const audience = (process.env.OAUTH2_AUDIENCE || "").trim() || undefined;
  const options = {
    algorithms: ["RS256"],
    issuer,
  };
  if (audience) {
    options.audience = audience;
  }
  return jwt.verify(token, getOAuth2PublicKey(), options);
}

async function authenticateJwtWithUserCheck(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      const err = new Error("Missing or invalid Authorization header");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }

    let payload;
    try {
      payload = await verifyOAuthAccessToken(token);
    } catch (e) {
      const err = new Error("Invalid or expired OAuth2 access token");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }

    const tokenRole = extractRoleFromOAuthPayload(payload);
    const tokenEmail = (payload?.email || payload?.preferred_username || "").toLowerCase().trim();
    let user = null;
    if (tokenEmail && tokenEmail.includes("@")) {
      user = await User.findOne({ email: tokenEmail }).select("_id role doctorVerificationStatus");
    }

    if (user) {
      if (user.role === "DOCTOR" && user.doctorVerificationStatus !== "VERIFIED") {
        const err = new Error("Doctor account is pending admin verification");
        err.statusCode = 403;
        err.code = "DOCTOR_NOT_VERIFIED";
        return next(err);
      }
      req.auth = { userId: user._id.toString(), role: user.role };
      return next();
    }

    req.auth = {
      userId: null,
      role: tokenRole,
      oauthSub: payload?.sub || null,
      email: tokenEmail || null,
    };
    return next();
  } catch (e) {
    return next(e);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth?.role) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }
    if (!allowedRoles.includes(req.auth.role)) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }
    return next();
  };
}

async function attachUserIfNeeded(req, res, next) {
  if (!req.auth?.userId) return next();
  try {
    req.user = await User.findById(req.auth.userId).select("-passwordHash");
    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = { authenticateJwtWithUserCheck, requireRole, attachUserIfNeeded };
