import { stripBearerAndTrim } from "./jwt";

const TELEMEDICINE_API_BASE_URL = import.meta.env.VITE_TELEMEDICINE_API_BASE_URL || "/api/v1/video";

async function request(path, { token, method = "GET", body } = {}) {
  const url = `${TELEMEDICINE_API_BASE_URL}${path}`;
  const cleanToken = token ? stripBearerAndTrim(token) : "";
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {})
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
      throw new Error(`Unable to reach telemedicine backend at ${TELEMEDICINE_API_BASE_URL}`);
    }
    throw error;
  }
}

export function createSession(token, data) {
  return request("/sessions", { token, method: "POST", body: data });
}

export function getSession(token, sessionOrAppointmentId) {
  return request(`/sessions/${sessionOrAppointmentId}`, { token });
}

export function joinSession(token, sessionOrAppointmentId) {
  return request(`/sessions/${sessionOrAppointmentId}/join`, { token, method: "POST" });
}

export function endSession(token, sessionOrAppointmentId) {
  return request(`/sessions/${sessionOrAppointmentId}/end`, { token, method: "POST" });
}

/** Public: resolve invite code to session id (no JWT). */
export function resolveInviteCode(code) {
  const c = encodeURIComponent(String(code || "").trim());
  return request(`/invite/${c}`, {});
}
