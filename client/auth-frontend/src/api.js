const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL || "/api/auth";

async function request(path, { method = "GET", token, body } = {}) {
  const url = `${AUTH_API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || `Request failed (${response.status})`;
      throw new Error(message);
    }
    return payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Unable to reach auth backend at ${AUTH_API_BASE_URL}`);
    }
    throw error;
  }
}

export function registerPatient(data) {
  return request("/oauth/register/patient", { method: "POST", body: data });
}

export function registerDoctor(data) {
  return request("/oauth/register/doctor", { method: "POST", body: data });
}

export function loginOAuth(data) {
  return request("/oauth/login", { method: "POST", body: data });
}

export function refreshOAuth(refreshToken) {
  return request("/oauth/refresh", { method: "POST", body: { refreshToken } });
}

export function logoutOAuth(accessToken, refreshToken) {
  return request("/oauth/logout", { method: "POST", token: accessToken, body: { refreshToken } });
}

export function getMe(accessToken) {
  return request("/me", { token: accessToken });
}

/** @param {Record<string, string | number | undefined>} params */
function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function adminListUsers(accessToken, params = {}) {
  return request(`/admin/users${buildQuery(params)}`, { token: accessToken });
}

export function adminVerifyDoctor(accessToken, userId) {
  return request(`/admin/verify-doctor/${encodeURIComponent(userId)}`, { method: "PATCH", token: accessToken });
}

export function adminAuditLogs(accessToken, limit = 40) {
  return request(`/admin/audit-logs${buildQuery({ limit })}`, { token: accessToken });
}
