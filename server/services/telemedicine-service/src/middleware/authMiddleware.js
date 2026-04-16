const jwt = require("jsonwebtoken");

const ApiError = require("../utils/apiError");
const { normalizeRole, normalizeUserId } = require("../utils/normalizeAuth");

function authenticateRequest(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing or invalid authorization header");
    }

    const token = authHeader.slice("Bearer ".length);
    const secret = process.env.AUTH_JWT_SECRET;

    if (!secret) {
      throw new ApiError(500, "AUTH_JWT_SECRET is not configured");
    }

    const payload = jwt.verify(token, secret);
    const id = normalizeUserId(payload.sub || payload.userId || payload.id);
    const role = normalizeRole(payload.role);

    req.user = { id, role };

    if (!req.user.id || !req.user.role) {
      throw new ApiError(401, "Invalid auth token payload (need sub/userId and role)");
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(new ApiError(401, "Unauthorized"));
  }
}

function authorizeRoles(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  return (req, _res, next) => {
    const role = req.user?.role;
    if (!role || !normalizedAllowed.includes(role)) {
      return next(new ApiError(403, "Forbidden"));
    }
    return next();
  };
}

module.exports = {
  authenticateRequest,
  authorizeRoles
};
