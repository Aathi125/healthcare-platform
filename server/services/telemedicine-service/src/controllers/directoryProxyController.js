const ApiError = require("../utils/apiError");

function normalizeProxyQuery(raw) {
  const s = String(raw)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  try {
    return decodeURIComponent(s).trim();
  } catch {
    return s;
  }
}

function getAuthServiceOrigin() {
  const raw = (process.env.AUTH_SERVICE_URL || "http://127.0.0.1:8081").trim();
  if (!raw) {
    throw new ApiError(500, "AUTH_SERVICE_URL is not configured");
  }
  return raw.replace(/\/+$/, "");
}

/**
 * Proxies patient directory search to auth-service so the browser only calls /api/v1/video (one dev proxy).
 */
async function proxyClinicianPatientSearch(req, res, next) {
  try {
    const qRaw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const qNorm = qRaw != null ? normalizeProxyQuery(qRaw) : "";
    if (!qNorm || qNorm.length < 2) {
      throw new ApiError(400, "Query q must be at least 2 characters");
    }

    const token = req.headers.authorization;
    if (!token || !String(token).startsWith("Bearer ")) {
      throw new ApiError(401, "Missing or invalid Authorization header");
    }

    const origin = getAuthServiceOrigin();
    const target = new URL("/api/auth/clinician/patients/search", `${origin}/`);
    target.searchParams.set("q", qNorm);

    let upstream;
    try {
      upstream = await fetch(target, {
        headers: { Authorization: token },
      });
    } catch (err) {
      const code = err?.cause?.code || err?.code;
      if (code === "ECONNREFUSED") {
        throw new ApiError(502, "Auth service is unreachable. Start auth-service and check AUTH_SERVICE_URL.");
      }
      throw err;
    }

    const body = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(body);
  } catch (e) {
    return next(e);
  }
}

module.exports = { proxyClinicianPatientSearch };
