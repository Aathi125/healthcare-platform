function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function normalizeIssuer(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function getTokenEndpointFromIssuer() {
  const issuer = normalizeIssuer(process.env.OAUTH2_ISSUER_URL || "");
  if (!issuer) {
    throw new Error("OAUTH2_ISSUER_URL is required");
  }
  return `${issuer}/protocol/openid-connect/token`;
}

function getLogoutEndpointFromIssuer() {
  const issuer = normalizeIssuer(process.env.OAUTH2_ISSUER_URL || "");
  if (!issuer) {
    throw new Error("OAUTH2_ISSUER_URL is required");
  }
  return `${issuer}/protocol/openid-connect/logout`;
}

function getRealmFromIssuer() {
  const issuer = (process.env.OAUTH2_ISSUER_URL || "").trim();
  if (!issuer) return null;
  try {
    const u = new URL(issuer);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "realms");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  } catch {
    return null;
  }
}

function getConfig() {
  const baseUrl = normalizeBaseUrl(process.env.KEYCLOAK_BASE_URL || "http://localhost:8180");
  const realm = (process.env.KEYCLOAK_REALM || getRealmFromIssuer() || "").trim();
  const adminClientId = (process.env.OAUTH2_ADMIN_CLIENT_ID || "").trim();
  const adminClientSecret = (process.env.OAUTH2_ADMIN_CLIENT_SECRET || "").trim();
  return { baseUrl, realm, adminClientId, adminClientSecret };
}

function getOauthClientConfig() {
  const clientId = (process.env.OAUTH2_CLIENT_ID || "").trim();
  const clientSecret = (process.env.OAUTH2_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) {
    throw new Error("OAUTH2_CLIENT_ID and OAUTH2_CLIENT_SECRET are required");
  }
  return { clientId, clientSecret };
}

function assertAdminConfig() {
  const cfg = getConfig();
  if (!cfg.realm) throw new Error("KEYCLOAK_REALM or OAUTH2_ISSUER_URL with /realms/{realm} is required");
  if (!cfg.adminClientId || !cfg.adminClientSecret) {
    throw new Error("OAUTH2_ADMIN_CLIENT_ID and OAUTH2_ADMIN_CLIENT_SECRET are required for OAuth2 registration");
  }
  return cfg;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { res, data, text };
}

async function getAdminAccessToken() {
  const cfg = assertAdminConfig();
  const tokenUrl = `${cfg.baseUrl}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.adminClientId,
    client_secret: cfg.adminClientSecret,
  });
  const { res, data } = await fetchJson(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok || !data?.access_token) {
    const err = new Error(
      `Failed to obtain Keycloak admin token (${res.status}). Check OAUTH2_ADMIN_CLIENT_ID/SECRET and service-account roles.`
    );
    err.code = "CONFIG_ERROR";
    err.statusCode = 500;
    throw err;
  }
  return { token: data.access_token, cfg };
}

function parseName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "User", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function findUserIdByUsername(cfg, adminToken, username) {
  const url = `${cfg.baseUrl}/admin/realms/${encodeURIComponent(cfg.realm)}/users?exact=true&username=${encodeURIComponent(
    username
  )}`;
  const { res, data } = await fetchJson(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok) throw new Error(`Failed to query Keycloak user (${res.status})`);
  const user = Array.isArray(data) ? data.find((u) => u.username === username || u.email === username) : null;
  return user?.id || null;
}

async function createKeycloakUser({ email, fullName, password, realmRole }) {
  const { token, cfg } = await getAdminAccessToken();
  const { firstName, lastName } = parseName(fullName);
  const createUrl = `${cfg.baseUrl}/admin/realms/${encodeURIComponent(cfg.realm)}/users`;

  const createPayload = {
    username: email,
    email,
    emailVerified: true,
    enabled: true,
    firstName,
    lastName,
    requiredActions: [],
  };

  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createPayload),
  });

  if (createRes.status === 409) {
    const err = new Error("Email already registered");
    err.code = "CONFLICT";
    err.statusCode = 409;
    throw err;
  }

  if (!createRes.ok && createRes.status !== 201) {
    throw new Error(`Failed to create Keycloak user (${createRes.status})`);
  }

  let userId = null;
  const location = createRes.headers.get("location");
  if (location) {
    const parts = location.split("/").filter(Boolean);
    userId = parts[parts.length - 1] || null;
  }
  if (!userId) {
    userId = await findUserIdByUsername(cfg, token, email);
  }
  if (!userId) {
    throw new Error("Created Keycloak user but could not resolve user id");
  }

  const resetUrl = `${cfg.baseUrl}/admin/realms/${encodeURIComponent(cfg.realm)}/users/${encodeURIComponent(
    userId
  )}/reset-password`;
  const resetRes = await fetch(resetUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "password",
      value: password,
      temporary: false,
    }),
  });
  if (!resetRes.ok && resetRes.status !== 204) {
    throw new Error(`Failed to set Keycloak user password (${resetRes.status})`);
  }

  const roleUrl = `${cfg.baseUrl}/admin/realms/${encodeURIComponent(cfg.realm)}/roles/${encodeURIComponent(realmRole)}`;
  const { res: roleRes, data: roleData } = await fetchJson(roleUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!roleRes.ok || !roleData?.name) {
    throw new Error(`Failed to load Keycloak role '${realmRole}' (${roleRes.status})`);
  }

  const mapUrl = `${cfg.baseUrl}/admin/realms/${encodeURIComponent(cfg.realm)}/users/${encodeURIComponent(
    userId
  )}/role-mappings/realm`;
  const mapRes = await fetch(mapUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        id: roleData.id,
        name: roleData.name,
      },
    ]),
  });
  if (!mapRes.ok && mapRes.status !== 204) {
    throw new Error(`Failed to assign Keycloak role '${realmRole}' (${mapRes.status})`);
  }

  return { keycloakUserId: userId };
}

async function refreshOAuthToken(refreshToken) {
  const { clientId, clientSecret } = getOauthClientConfig();
  const tokenUrl = getTokenEndpointFromIssuer();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const { res, data } = await fetchJson(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok || !data?.access_token) {
    const err = new Error(`Failed to refresh OAuth2 token (${res.status})`);
    err.statusCode = res.status === 400 || res.status === 401 ? 401 : 500;
    err.code = "UNAUTHORIZED";
    throw err;
  }
  return data;
}

async function logoutOAuthSession(refreshToken) {
  const { clientId, clientSecret } = getOauthClientConfig();
  const logoutUrl = getLogoutEndpointFromIssuer();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const { res } = await fetchJson(logoutUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok && res.status !== 204) {
    const err = new Error(`Failed to logout OAuth2 session (${res.status})`);
    err.statusCode = res.status === 400 || res.status === 401 ? 401 : 500;
    err.code = "UNAUTHORIZED";
    throw err;
  }
}

async function logoutKeycloakUserSessionsByEmail(email) {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) {
    const err = new Error("Email is required to revoke Keycloak sessions");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const { token, cfg } = await getAdminAccessToken();
  const keycloakUserId = await findUserIdByUsername(cfg, token, normalizedEmail);
  if (!keycloakUserId) {
    return { keycloakUserFound: false, keycloakUserId: null };
  }

  const logoutUrl = `${cfg.baseUrl}/admin/realms/${encodeURIComponent(cfg.realm)}/users/${encodeURIComponent(
    keycloakUserId
  )}/logout`;
  const { res } = await fetchJson(logoutUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const err = new Error(`Failed to revoke Keycloak user sessions (${res.status})`);
    err.statusCode = 502;
    err.code = "PROVIDER_ERROR";
    throw err;
  }

  return { keycloakUserFound: true, keycloakUserId };
}

module.exports = {
  createKeycloakUser,
  refreshOAuthToken,
  logoutOAuthSession,
  logoutKeycloakUserSessionsByEmail,
};
