/**
 * Normalize pasted auth material into a raw JWT string (header.payload.signature).
 * Handles: Bearer prefix, quotes, JSON blobs, line breaks inside the token, embedded eyJ… in text.
 */
export function normalizeAccessTokenInput(raw) {
  if (!raw || typeof raw !== "string") return "";

  let t = raw.replace(/^\uFEFF/, "").trim();

  const stripOuterQuotes = (s) => {
    let x = s;
    if ((x.startsWith('"') && x.endsWith('"')) || (x.startsWith("'") && x.endsWith("'"))) {
      x = x.slice(1, -1).trim();
    }
    return x;
  };

  t = stripOuterQuotes(t);
  if (/^bearer\s+/i.test(t)) t = t.replace(/^bearer\s+/i, "").trim();
  t = stripOuterQuotes(t);

  if (t.startsWith("{")) {
    t = extractTokenFromJsonObjectString(t);
  }

  if (t.includes(".")) {
    t = t.replace(/\s+/g, "");
  }

  t = stripOuterQuotes(t);
  if (/^bearer\s+/i.test(t)) t = t.replace(/^bearer\s+/i, "").trim();

  if (t && !looksLikeJwt(t)) {
    const embedded = t.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_=-]+/);
    if (embedded) t = embedded[0];
  }

  return t.trim();
}

function extractTokenFromJsonObjectString(s) {
  try {
    const obj = JSON.parse(s);
    const v =
      (typeof obj.access_token === "string" && obj.access_token) ||
      (typeof obj.accessToken === "string" && obj.accessToken) ||
      (typeof obj.token === "string" && obj.token) ||
      (typeof obj.id_token === "string" && obj.id_token) ||
      "";
    if (v) return String(v).trim();
  } catch {
    /* fall through */
  }
  const patterns = [
    /"access_token"\s*:\s*"([^"]+)"/i,
    /"accessToken"\s*:\s*"([^"]+)"/i,
    /"token"\s*:\s*"([^"]+)"/i,
    /'access_token'\s*:\s*'([^']+)'/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return s;
}

function looksLikeJwt(t) {
  const parts = t.split(".");
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
}

/** @deprecated use normalizeAccessTokenInput — kept for api.js import name */
export function stripBearerAndTrim(raw) {
  return normalizeAccessTokenInput(raw);
}

export function decodeJwtPayload(token) {
  const t = normalizeAccessTokenInput(token);
  if (!t) return null;
  try {
    const parts = t.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function roleFromPayload(payload) {
  if (payload.role != null) {
    const r = String(payload.role).toLowerCase();
    if (r === "clinician") return "doctor";
    if (["doctor", "admin", "patient"].includes(r)) return r;
  }
  const roles = payload.realm_access?.roles;
  if (Array.isArray(roles)) {
    const lower = roles.map((x) => String(x).toLowerCase());
    if (lower.some((r) => r.includes("admin"))) return "admin";
    if (lower.some((r) => r.includes("doctor") || r.includes("clinician") || r.includes("physician"))) return "doctor";
    if (lower.some((r) => r.includes("patient"))) return "patient";
  }
  return null;
}

function userIdFromPayload(payload) {
  const raw = payload.sub ?? payload.userId ?? payload.id ?? payload.user_id;
  if (raw != null && raw !== "") return String(raw);
  return null;
}

/**
 * @returns {{ id: string | null, role: string | null, email: string | null, payloadDecoded: boolean }}
 */
export function tokenSummary(token) {
  const t = normalizeAccessTokenInput(token);
  if (!t) return { id: null, role: null, email: null, payloadDecoded: false };

  const payload = decodeJwtPayload(token);
  if (!payload) return { id: null, role: null, email: null, payloadDecoded: false };

  const id = userIdFromPayload(payload);
  const role = roleFromPayload(payload);
  const email = payload.email || payload.preferred_username || null;
  return {
    id,
    role,
    email,
    payloadDecoded: true,
  };
}
