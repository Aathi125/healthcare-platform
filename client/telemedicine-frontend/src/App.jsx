import { useEffect, useMemo, useState } from "react";
import Video from "twilio-video";
import { createSession, endSession, getSession, joinSession, resolveInviteCode } from "./api";
import { searchPatients } from "./authApi";
import JitsiRoom from "./components/JitsiRoom";
import VideoRoom from "./components/VideoRoom";
import { tokenSummary } from "./jwt";

function statusPillClass(status) {
  if (status === "active") return "pill-status pill-active";
  if (status === "ended") return "pill-status pill-ended";
  return "pill-status pill-scheduled";
}

function FlowStep({ step, title, description, children }) {
  return (
    <li className="flow-step">
      <div className="flow-step-num" aria-hidden="true">
        {step}
      </div>
      <div className="flow-step-body">
        <h2 className="flow-step-title">{title}</h2>
        {description ? <p className="flow-step-desc">{description}</p> : null}
        {children}
      </div>
    </li>
  );
}

export default function App() {
  const [jwtToken, setJwtToken] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [session, setSession] = useState(null);
  const [room, setRoom] = useState(null);
  const [jitsiUrl, setJitsiUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [inviteShareMode, setInviteShareMode] = useState("link");

  const claims = useMemo(() => tokenSummary(jwtToken), [jwtToken]);
  const role = claims.role;

  const canCreate = useMemo(() => role === "doctor" || role === "admin", [role]);
  const canEnd = useMemo(() => role === "doctor" || role === "admin", [role]);
  const tokenReady = Boolean(jwtToken && claims.payloadDecoded && claims.id);

  const inviteUrl = useMemo(() => {
    if (!session?.inviteCode || typeof window === "undefined") return "";
    const path = window.location.pathname || "/consult.html";
    const base = `${window.location.origin}${path.split("?")[0]}`;
    return `${base}?invite=${encodeURIComponent(session.inviteCode)}`;
  }, [session?.inviteCode]);
  const inviteCode = session?.inviteCode || "";
  const inviteMessage = useMemo(() => {
    if (!inviteUrl || !inviteCode) return "";
    return `Hi, join your consultation using this link: ${inviteUrl} (or use code: ${inviteCode}).`;
  }, [inviteUrl, inviteCode]);
  const inviteEmailMessage = useMemo(() => {
    if (!inviteUrl || !inviteCode) return "";
    return `Subject: Your consultation invite\n\n${inviteMessage}`;
  }, [inviteUrl, inviteCode, inviteMessage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite")?.trim();
    if (!invite) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await resolveInviteCode(invite);
        if (cancelled) return;
        setSessionId(res.data.sessionId);
        setMessage(
          "Invite link applied: session id is filled in below. Finish step 1 if needed, then use Join call in step 3."
        );
        const cleanPath = window.location.pathname || "/consult.html";
        window.history.replaceState({}, "", cleanPath);
      } catch (e) {
        if (!cancelled) setMessage(e.message || "Could not resolve invite");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_access_token");
      if (stored?.trim()) {
        setJwtToken((current) => (current.trim() ? current : stored));
      }
    } catch {
      /* private / blocked storage */
    }
  }, []);

  useEffect(() => {
    if (claims.id && role === "doctor" && !doctorId) {
      setDoctorId(claims.id);
    }
    if (claims.id && role === "patient" && !patientId) {
      setPatientId(claims.id);
    }
  }, [claims.id, role, doctorId, patientId]);

  function disconnectTwilio() {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
  }

  function closeJitsi() {
    setJitsiUrl("");
  }

  async function handleSearchPatients() {
    const q = patientQuery.trim();
    if (q.length < 2) {
      setMessage("Type at least 2 characters to search patients.");
      setPatientResults([]);
      return;
    }
    setPatientSearchLoading(true);
    setMessage("");
    try {
      const res = await searchPatients(jwtToken, q);
      setPatientResults(res.data?.patients || []);
      if (!res.data?.patients?.length) {
        setMessage("No patients matched. Try another email fragment or name.");
      }
    } catch (e) {
      setPatientResults([]);
      setMessage(e.message || "Patient search failed");
    } finally {
      setPatientSearchLoading(false);
    }
  }

  async function copyText(text, successMsg) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMsg);
    } catch {
      setMessage("Copy failed. Select the text and copy manually.");
    }
  }

  async function shareInviteNatively() {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Consultation invite",
          text: inviteMessage || "Join your consultation",
          url: inviteUrl,
        });
        setMessage("Invite shared.");
        return;
      } catch {
        // fall through to copy so user can still share quickly
      }
    }
    await copyText(inviteMessage || inviteUrl, "Invite message copied.");
  }

  function loadTokenFromBrowserSignIn() {
    try {
      const stored = localStorage.getItem("auth_access_token");
      if (stored?.trim()) {
        setJwtToken(stored);
        setMessage("Loaded access token from your last sign-in on this site.");
        return;
      }
      setMessage("No saved token. Open Sign in, log in, then try again—or paste a token manually.");
    } catch {
      setMessage("Could not read browser storage.");
    }
  }

  async function handleCreateSession(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    disconnectTwilio();
    closeJitsi();
    try {
      const response = await createSession(jwtToken, {
        appointmentId,
        patientId,
        ...(doctorId ? { doctorId } : {}),
      });
      setSession(response.data);
      setSessionId(response.data.id);
      setMessage(
        "Session created. Copy the invite link or code below for your patient—still no video until both sides join."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoadSession() {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await getSession(jwtToken, sessionId);
      setSession(response.data);
      setMessage("Session loaded. You can join when ready.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinSession() {
    setIsLoading(true);
    setMessage("");
    disconnectTwilio();
    closeJitsi();
    try {
      const response = await joinSession(jwtToken, sessionId);
      const data = response.data;

      if (data.provider === "jitsi" && data.jitsiUrl) {
        setJitsiUrl(data.jitsiUrl);
        setMessage(
          response.message ||
            "Access granted. Jitsi opens below—camera and mic are handled by your browser and Jitsi, not our servers."
        );
        return;
      }

      if (data.token) {
        const joinedRoom = await Video.connect(data.token, {
          audio: true,
          video: true,
        });
        setRoom(joinedRoom);
        setMessage("Access granted. Twilio Video runs in your browser; our backend only issued the room token.");
        return;
      }

      setMessage("Join response missing token or Jitsi URL.");
    } catch (error) {
      const hint =
        error?.message?.includes("getUserMedia") || error?.name === "NotAllowedError"
          ? " Allow camera and microphone for this site."
          : "";
      setMessage((error.message || "Join failed") + hint);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEndSession() {
    setIsLoading(true);
    setMessage("");
    try {
      await endSession(jwtToken, sessionId);
      setSession((prev) => (prev ? { ...prev, status: "ended" } : prev));
      disconnectTwilio();
      closeJitsi();
      setMessage("Session ended. No one can join this visit again.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const videoActive = Boolean(room || jitsiUrl);

  return (
    <div className="consult-console app-frame">
      <header className="care-header care-header-flow">
        <div>
          <span className="pulse-badge">Virtual visit</span>
          <h1>How your visit works</h1>
          <p>
            Sign in through the{" "}
            <a className="consult-accent" href="/auth.html">
              Auth service
            </a>{" "}
            to get a JWT (your digital ID). This console is the reception desk: it checks your ID, books the visit, and
            hands you a room key.{" "}
            <strong>Twilio or Jitsi</strong> is the actual room—video never streams through this backend.
          </p>
        </div>
      </header>

      <ol className="flow-timeline">
        <FlowStep
          step={1}
          title="Log in — your JWT"
          description="Use the access token from Care Platform sign-in (same browser is easiest). It carries your user id and role so the visit API can authorize you."
        >
          <div className="panel flow-panel">
            <div className="field">
              <div className="flow-token-label-row">
                <label htmlFor="jwt">Access token</label>
                <button type="button" className="btn btn-ghost btn-compact" onClick={loadTokenFromBrowserSignIn}>
                  Use token from sign-in
                </button>
              </div>
              <textarea
                id="jwt"
                rows={4}
                value={jwtToken}
                onChange={(e) => setJwtToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                spellCheck={false}
              />
            </div>
            <div className="claims-grid">
              <div className="claim-pill">
                <span>User id</span>
                <strong>{claims.id || "—"}</strong>
              </div>
              <div className="claim-pill">
                <span>Role</span>
                <strong>{claims.role || "—"}</strong>
              </div>
              <div className="claim-pill">
                <span>Email</span>
                <strong>{claims.email || "—"}</strong>
              </div>
            </div>
            {!jwtToken ? (
              <p className="hint">
                <strong>Easiest:</strong> go to <a href="/auth.html">Sign in</a>, log in, then return here—the token may
                fill in automatically, or click <strong>Use token from sign-in</strong>. You can also use{" "}
                <strong>Copy access token</strong> on the welcome screen and paste below.
              </p>
            ) : null}
            {jwtToken && !claims.payloadDecoded ? (
              <p className="hint warn">
                This text is not a valid access JWT. Try <strong>Use token from sign-in</strong> after logging in at{" "}
                <a href="/auth.html">Sign in</a>, or paste only the <strong>access</strong> token (not the refresh token).
                Advanced: DevTools → Network → your login request → Response JSON → copy{" "}
                <code>data.accessToken</code> or <code>access_token</code>.
              </p>
            ) : null}
            {jwtToken && claims.payloadDecoded && !claims.id ? (
              <p className="hint warn">
                Token decoded, but no user id (<code>sub</code>) found. Use the access token from login.
              </p>
            ) : null}
          </div>
        </FlowStep>

        <FlowStep
          step={2}
          title="Create the visit (clinician or admin)"
          description="Look up the patient by email or name (same user database as sign-in), choose an appointment id you both recognize, then create. You’ll get a shareable invite link and code—no video until someone joins in step 3."
        >
          {canCreate ? (
            <div className="panel flow-panel">
              <form onSubmit={handleCreateSession} className="stack">
                <div className="field">
                  <label htmlFor="appt">Appointment id</label>
                  <input
                    id="appt"
                    value={appointmentId}
                    onChange={(e) => setAppointmentId(e.target.value)}
                    placeholder="e.g. appt-2026-04-20 or your EHR id"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="patient-search">Find patient (email or name)</label>
                  <div className="patient-search-row">
                    <input
                      id="patient-search"
                      value={patientQuery}
                      onChange={(e) => setPatientQuery(e.target.value)}
                      placeholder="Type part of email or name…"
                      disabled={!tokenReady}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={!tokenReady || patientSearchLoading || patientQuery.trim().length < 2}
                      onClick={handleSearchPatients}
                    >
                      {patientSearchLoading ? "Searching…" : "Search"}
                    </button>
                  </div>
                  {patientResults.length > 0 ? (
                    <ul className="patient-search-results">
                      {patientResults.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="patient-pick-btn"
                            onClick={() => {
                              setPatientId(p.id);
                              setMessage(`Patient id set: ${p.fullName} (${p.email}).`);
                            }}
                          >
                            <span className="patient-pick-name">{p.fullName}</span>
                            <span className="patient-pick-email">{p.email}</span>
                            <code className="patient-pick-id">{p.id}</code>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="field">
                  <label htmlFor="pat">Patient user id</label>
                  <input id="pat" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
                  <p className="hint flow-hint-tight">
                    Use Search above, or paste an id from the patient’s profile after they sign in.
                  </p>
                </div>
                <div className="field">
                  <label htmlFor="doc">Doctor user id (optional)</label>
                  <input id="doc" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
                </div>
                <button className="btn btn-primary" disabled={isLoading || !tokenReady} type="submit">
                  Create session
                </button>
              </form>
              {session?.inviteCode && canCreate ? (
                <div className="invite-share">
                  <h3 className="invite-share-title">Invite this patient</h3>
                  <p className="hint">
                    Share a link (recommended) or a code from here. They must sign in with the patient account you selected.
                  </p>
                  <div className="invite-share-tabs" role="tablist" aria-label="Invite options">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={inviteShareMode === "link"}
                      className={`invite-tab-btn ${inviteShareMode === "link" ? "invite-tab-active" : ""}`}
                      onClick={() => setInviteShareMode("link")}
                    >
                      Invite link (recommended)
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={inviteShareMode === "code"}
                      className={`invite-tab-btn ${inviteShareMode === "code" ? "invite-tab-active" : ""}`}
                      onClick={() => setInviteShareMode("code")}
                    >
                      Invite code
                    </button>
                  </div>
                  {inviteShareMode === "link" ? (
                    <>
                      <div className="invite-link-row">
                        <code className="invite-link-url">{inviteUrl}</code>
                        <button
                          type="button"
                          className="btn btn-primary btn-compact"
                          disabled={!inviteUrl}
                          onClick={() => copyText(inviteUrl, "Invite link copied.")}
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-compact"
                          disabled={!inviteUrl}
                          onClick={() => window.open(inviteUrl, "_blank", "noopener,noreferrer")}
                        >
                          Open preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-compact"
                          disabled={!inviteUrl}
                          onClick={shareInviteNatively}
                        >
                          Share
                        </button>
                      </div>
                      <div className="invite-template-row">
                        <button
                          type="button"
                          className="btn btn-ghost btn-compact"
                          disabled={!inviteMessage}
                          onClick={() => copyText(inviteMessage, "SMS message copied.")}
                        >
                          Copy SMS text
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-compact"
                          disabled={!inviteEmailMessage}
                          onClick={() => copyText(inviteEmailMessage, "Email message copied.")}
                        >
                          Copy email text
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="invite-code-row">
                      <span className="invite-code-label">Code</span>
                      <strong className="invite-code-value">{session.inviteCode}</strong>
                      <button
                        type="button"
                        className="btn btn-ghost btn-compact"
                        onClick={() => copyText(session.inviteCode, "Invite code copied.")}
                      >
                        Copy code
                      </button>
                    </div>
                  )}
                  <div className="invite-template-note">
                    Use link when possible; use code only if link sharing is blocked in your workflow.
                  </div>
                </div>
              ) : null}
            </div>
          ) : tokenReady ? (
            <div className="panel flow-panel">
              <p className="hint flow-hint-strong">
                You are a <strong className="consult-accent">{role}</strong>. Patients don’t create visits—the clinician
                or admin does. Open the invite link they send you, or enter their session id / invite code in step 3.
              </p>
            </div>
          ) : (
            <div className="panel flow-panel">
              <p className="hint">Complete step 1 first. Clinicians and admins can create a session here.</p>
            </div>
          )}
        </FlowStep>

        <FlowStep
          step={3}
          title="Join the visit"
          description="The server checks your JWT: you must be the assigned doctor, patient, or an admin. The session must not be ended. If you used an invite link, this field may already be filled. Then you get video in step 4."
        >
          <div className="panel flow-panel">
            <div className="field">
              <label htmlFor="sess">Session id, appointment id, or invite code</label>
              <input
                id="sess"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="UUID, appointment id, or 8-character invite code"
              />
              <p className="hint flow-hint-tight">
                Invite links look like <code>?invite=XXXXXXXX</code>—opening one fills the session id automatically.
              </p>
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" type="button" disabled={isLoading || !sessionId || !tokenReady} onClick={handleLoadSession}>
                Load details
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={isLoading || !sessionId || !tokenReady || !!room || !!jitsiUrl}
                onClick={handleJoinSession}
              >
                Join call
              </button>
              {canEnd ? (
                <button className="btn btn-danger" type="button" disabled={isLoading || !sessionId || !tokenReady} onClick={handleEndSession}>
                  End session
                </button>
              ) : null}
            </div>
            {canEnd ? (
              <p className="hint flow-hint-tight">
                <strong>End session</strong> (step 5): marks the visit finished so nobody can join again.
              </p>
            ) : null}
            {session ? (
              <div className="session-meta">
                <div className="session-meta-row">
                  <span>Status</span>
                  <span className={statusPillClass(session.status)}>{session.status}</span>
                </div>
                <div className="session-meta-row">
                  <span>Room name</span>
                  <code>{session.roomName}</code>
                </div>
                <div className="session-meta-row">
                  <span>Appointment</span>
                  <code>{session.appointmentId}</code>
                </div>
                <div className="session-meta-row">
                  <span>Session id</span>
                  <code>{session.id}</code>
                </div>
                {session.inviteCode ? (
                  <div className="session-meta-row">
                    <span>Invite code</span>
                    <code>{session.inviteCode}</code>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </FlowStep>

        <FlowStep
          step={4}
          title="Video — Twilio or Jitsi"
          description="If Twilio is configured, you get a short-lived video token and the call runs inside this app. If not, you get a Jitsi link in an iframe. Camera and microphone are handled by your browser and the provider—not by this Node server."
        >
          <div className="flow-video-shell">
            {!videoActive ? (
              <div className="panel flow-panel">
                <p className="hint flow-video-placeholder">
                  Join in step 3 to open the room. Until then, there is no video—our backend never streams A/V.
                </p>
              </div>
            ) : null}
            {room ? (
              <VideoRoom room={room} onLeave={() => { disconnectTwilio(); setMessage("Left Twilio room."); }} />
            ) : null}
            {jitsiUrl ? (
              <JitsiRoom
                url={jitsiUrl}
                onLeave={() => {
                  closeJitsi();
                  setMessage("Closed Jitsi panel.");
                }}
              />
            ) : null}
          </div>
        </FlowStep>
      </ol>

      {message ? (
        <p className="message message-flow" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
