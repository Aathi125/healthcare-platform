import { useEffect, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import { getMe, loginOAuth, logoutOAuth, refreshOAuth, registerDoctor, registerPatient } from "./api";

function LogoMark() {
  return (
    <svg className="auth-logo-svg" width="88" height="36" viewBox="0 0 88 36" aria-hidden="true">
      <g fill="currentColor">
        <path d="M6 3h12c2.2 0 4 1.8 4 4v22c0 2.2-1.8 4-4 4H6c-2.2 0-4-1.8-4-4V7c0-2.2 1.8-4 4-4z" />
        <path d="M38 3h12c2.2 0 4 1.8 4 4v22c0 2.2-1.8 4-4 4H38c-2.2 0-4-1.8-4-4V7c0-2.2 1.8-4 4-4z" opacity="0.92" />
        <path d="M70 3h12c2.2 0 4 1.8 4 4v22c0 2.2-1.8 4-4 4H70c-2.2 0-4-1.8-4-4V7c0-2.2 1.8-4 4-4z" opacity="0.84" />
      </g>
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [accessToken, setAccessToken] = useState(localStorage.getItem("auth_access_token") || "");
  const [refreshTokenValue, setRefreshTokenValue] = useState(localStorage.getItem("auth_refresh_token") || "");
  const [user, setUser] = useState(
    localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null
  );
  const [message, setMessage] = useState("");
  const [toastKind, setToastKind] = useState("info");
  const [isLoading, setIsLoading] = useState(false);

  const [registerRole, setRegisterRole] = useState("patient");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (accessToken) localStorage.setItem("auth_access_token", accessToken);
    else localStorage.removeItem("auth_access_token");
  }, [accessToken]);

  useEffect(() => {
    if (refreshTokenValue) localStorage.setItem("auth_refresh_token", refreshTokenValue);
    else localStorage.removeItem("auth_refresh_token");
  }, [refreshTokenValue]);

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  function pushToast(text, kind = "info") {
    setMessage(text);
    setToastKind(kind);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setIsLoading(true);
    pushToast("");
    try {
      const payload = { fullName: registerFullName, email: registerEmail, password: registerPassword };
      if (registerRole === "doctor") await registerDoctor(payload);
      else await registerPatient(payload);
      pushToast("Registration successful. You can log in now.", "success");
      setView("login");
      setRegisterPassword("");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    pushToast("");
    try {
      const response = await loginOAuth({ email: loginEmail.trim(), password: loginPassword });
      setAccessToken(response.data.accessToken);
      setRefreshTokenValue(response.data.refreshToken);
      const me = await getMe(response.data.accessToken);
      setUser(me.data.user);
      pushToast("Login successful.", "success");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh() {
    if (!refreshTokenValue) return;
    setIsLoading(true);
    pushToast("");
    try {
      const response = await refreshOAuth(refreshTokenValue);
      setAccessToken(response.data.accessToken);
      setRefreshTokenValue(response.data.refreshToken);
      const me = await getMe(response.data.accessToken);
      setUser(me.data.user);
      pushToast("Token refreshed.", "success");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProfile() {
    if (!accessToken) return;
    setIsLoading(true);
    pushToast("");
    try {
      const me = await getMe(accessToken);
      setUser(me.data.user);
      pushToast("Profile loaded.", "success");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    pushToast("");
    try {
      if (accessToken && refreshTokenValue) {
        await logoutOAuth(accessToken, refreshTokenValue);
      }
      setAccessToken("");
      setRefreshTokenValue("");
      setUser(null);
      setView("login");
      pushToast("Logged out.", "success");
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyAccessToken() {
    if (!accessToken) return;
    try {
      await navigator.clipboard.writeText(accessToken);
      pushToast("Access token copied. Paste it in Virtual visit step 1.", "success");
    } catch {
      pushToast("Could not copy. Select and copy the token from your browser tools if needed.", "error");
    }
  }

  if (accessToken && user) {
    if (user.role === "ADMIN") {
      return (
        <AdminDashboard
          accessToken={accessToken}
          user={user}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onToast={pushToast}
          onLogout={handleLogout}
          onRefreshProfile={handleProfile}
          onRefreshToken={handleRefresh}
          refreshTokenValue={refreshTokenValue}
          toastMessage={message}
          toastKind={toastKind}
        />
      );
    }

    return (
      <div className="auth-page">
        <div className="auth-page-inner auth-signed-wide">
          <div className="auth-logo">
            <LogoMark />
          </div>
          <h1 className="auth-title">Welcome</h1>
          <p className="auth-subtitle">You are signed in. Your JWT identifies you to every Care Platform service.</p>
          <div className="auth-card">
            <ul className="auth-meta">
              <li>
                <strong>User ID:</strong> {user.id}
              </li>
              <li>
                <strong>Role:</strong> {user.role}
              </li>
              <li>
                <strong>Email:</strong> {user.email}
              </li>
            </ul>
            <div className="auth-actions">
              <button type="button" className="auth-btn-secondary" disabled={isLoading} onClick={handleCopyAccessToken}>
                Copy access token
              </button>
              <button type="button" className="auth-btn-secondary" disabled={isLoading} onClick={handleProfile}>
                Refresh profile
              </button>
              <button type="button" className="auth-btn-secondary" disabled={isLoading || !refreshTokenValue} onClick={handleRefresh}>
                Refresh token
              </button>
              <button type="button" className="auth-submit" style={{ width: "auto", paddingLeft: "1.5rem", paddingRight: "1.5rem" }} disabled={isLoading} onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>

          <div className="auth-card auth-next-card">
            <h2 className="auth-next-title">Next: Virtual visit</h2>
            <ol className="auth-next-steps">
              <li>
                <strong>Copy access token</strong> (above) or sign in again on the consult page.
              </li>
              <li>
                Open <a href="/consult.html">Virtual visit</a> — clinicians <strong>create</strong> the session; patients{" "}
                <strong>join</strong> with the shared id.
              </li>
              <li>
                After <strong>Join call</strong>, video runs in Twilio or Jitsi in your browser—not through this backend.
              </li>
            </ol>
            <a className="auth-submit auth-next-cta" href="/consult.html">
              Go to Virtual visit
            </a>
          </div>

          {message ? (
            <div className={`auth-toast ${toastKind === "error" ? "error" : "success"}`} role="status">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page-inner">
        <div className="auth-logo">
          <LogoMark />
        </div>
        <h1 className="auth-title">Welcome</h1>
        <p className="auth-subtitle">
          {view === "login" ? "Log in to Care Platform account" : "Create your Care Platform account"}
        </p>

        <div className="auth-card">
          {view === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="auth-input"
                  type="email"
                  autoComplete="username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="password"
                    className="auth-input"
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="auth-show-btn"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    aria-pressed={showLoginPassword}
                  >
                    {showLoginPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button className="auth-submit" type="submit" disabled={isLoading}>
                Log in
              </button>
              <div className="auth-link-row">
                <button
                  type="button"
                  className="auth-link"
                  onClick={() =>
                    pushToast("Use the email you registered with. Contact your administrator if you need help.", "success")
                  }
                >
                  Forgot username or password?
                  <IconExternal />
                </button>
              </div>
              <p className="auth-link-inline">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="auth-link-text"
                  onClick={() => {
                    setView("register");
                    setMessage("");
                  }}
                >
                  Create one now.
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="auth-field">
                <span className="auth-label">Account type</span>
                <div className="role-row">
                  <label>
                    <input
                      type="radio"
                      name="registerRole"
                      checked={registerRole === "patient"}
                      onChange={() => setRegisterRole("patient")}
                    />
                    Patient
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="registerRole"
                      checked={registerRole === "doctor"}
                      onChange={() => setRegisterRole("doctor")}
                    />
                    Clinician
                  </label>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-name">
                  Full name
                </label>
                <input
                  id="reg-name"
                  className="auth-input"
                  value={registerFullName}
                  onChange={(e) => setRegisterFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  className="auth-input"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-password">
                  Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="reg-password"
                    className="auth-input"
                    type={showRegPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-show-btn"
                    onClick={() => setShowRegPassword((v) => !v)}
                    aria-pressed={showRegPassword}
                  >
                    {showRegPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button className="auth-submit" type="submit" disabled={isLoading}>
                Create account
              </button>
              <p className="auth-link-inline">
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth-link-text"
                  onClick={() => {
                    setView("login");
                    setMessage("");
                  }}
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>

        {message && !(accessToken && user) ? (
          <div className={`auth-toast ${toastKind === "error" ? "error" : toastKind === "success" ? "success" : ""}`} role="status">
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
