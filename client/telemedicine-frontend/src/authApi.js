import { stripBearerAndTrim } from "./jwt";

const CONSULT_API_BASE_URL = (import.meta.env.VITE_CONSULT_API_BASE_URL || "/api/v1/consult").replace(/\/+$/, "");

/**
 * Patient directory search on telemedicine-service at /api/v1/consult (separate from /api/v1/video router).
 */
export async function searchPatients(accessToken, q) {
  const query = new URLSearchParams({ q: q.trim() });
  const url = `${CONSULT_API_BASE_URL}/patients/search?${query}`;
  const clean = accessToken ? stripBearerAndTrim(accessToken) : "";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(clean ? { Authorization: `Bearer ${clean}` } : {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || `Request failed (${response.status})`;
      throw new Error(message);
    }
    return payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Unable to reach consult API at ${CONSULT_API_BASE_URL}`);
    }
    throw error;
  }
}
