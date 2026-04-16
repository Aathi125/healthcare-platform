import { useCallback, useEffect, useState } from "react";
import { adminAuditLogs, adminListUsers, adminVerifyDoctor } from "./api";

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function AdminDashboard({
  accessToken,
  user,
  isLoading,
  setIsLoading,
  onToast,
  onLogout,
  onRefreshProfile,
  onRefreshToken,
  refreshTokenValue,
  toastMessage,
  toastKind,
}) {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [verifyingId, setVerifyingId] = useState(null);

  const loadPending = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await adminListUsers(accessToken, {
        role: "DOCTOR",
        status: "PENDING_VERIFICATION",
        limit: 100,
      });
      setPendingDoctors(res.data?.users || []);
    } catch (e) {
      onToast(e.message, "error");
      setPendingDoctors([]);
    } finally {
      setListLoading(false);
    }
  }, [accessToken, onToast]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await adminAuditLogs(accessToken, 30);
      setLogs(res.data?.logs || []);
    } catch (e) {
      onToast(e.message, "error");
      setLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [accessToken, onToast]);

  useEffect(() => {
    loadPending();
    loadAudit();
  }, [loadPending, loadAudit]);

  async function handleVerify(doctorId) {
    setVerifyingId(doctorId);
    setIsLoading(true);
    onToast("");
    try {
      await adminVerifyDoctor(accessToken, doctorId);
      onToast("Clinician verified. They can sign in normally now.", "success");
      await loadPending();
      await loadAudit();
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setVerifyingId(null);
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page-inner admin-dash-inner">
        <div className="admin-dash-header">
          <div>
            <p className="admin-dash-kicker">Administrator</p>
            <h1 className="auth-title admin-dash-title">Admin dashboard</h1>
            <p className="auth-subtitle admin-dash-sub">
              Verify clinician accounts and review recent platform activity.
            </p>
          </div>
          <div className="admin-dash-header-actions">
            <a className="auth-btn-secondary admin-dash-link" href="/consult.html">
              Telemedicine console
            </a>
            <button type="button" className="auth-btn-secondary" disabled={isLoading} onClick={onRefreshProfile}>
              Refresh profile
            </button>
            <button
              type="button"
              className="auth-btn-secondary"
              disabled={isLoading || !refreshTokenValue}
              onClick={onRefreshToken}
            >
              Refresh token
            </button>
            <button type="button" className="auth-submit admin-dash-logout" disabled={isLoading} onClick={onLogout}>
              Log out
            </button>
          </div>
        </div>

        <p className="admin-dash-signed-in">
          Signed in as <strong>{user.email}</strong> · {user.role}
        </p>

        <section className="auth-card admin-section">
          <div className="admin-section-head">
            <h2 className="admin-section-title">Clinicians awaiting verification</h2>
            <button type="button" className="auth-link-text" disabled={listLoading} onClick={loadPending}>
              Refresh list
            </button>
          </div>
          {listLoading ? (
            <p className="admin-muted">Loading…</p>
          ) : pendingDoctors.length === 0 ? (
            <p className="admin-muted">No pending clinicians. New doctor registrations will appear here.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Registered</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pendingDoctors.map((d) => (
                    <tr key={d.id}>
                      <td>{d.fullName}</td>
                      <td>
                        <code className="admin-code">{d.email}</code>
                      </td>
                      <td>{formatTime(d.createdAt)}</td>
                      <td className="admin-table-actions">
                        <button
                          type="button"
                          className="auth-submit admin-verify-btn"
                          disabled={verifyingId !== null}
                          onClick={() => handleVerify(d.id)}
                        >
                          {verifyingId === d.id ? "Verifying…" : "Verify"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="auth-card admin-section">
          <div className="admin-section-head">
            <h2 className="admin-section-title">Recent audit log</h2>
            <button type="button" className="auth-link-text" disabled={auditLoading} onClick={loadAudit}>
              Refresh
            </button>
          </div>
          {auditLoading ? (
            <p className="admin-muted">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="admin-muted">No audit entries yet.</p>
          ) : (
            <ul className="admin-audit-list">
              {logs.map((log) => (
                <li key={log._id != null ? String(log._id) : `${log.action}-${log.createdAt}`} className="admin-audit-item">
                  <span className="admin-audit-action">{log.action}</span>
                  <span className="admin-audit-time">{formatTime(log.createdAt)}</span>
                  {log.meta?.doctorEmail ? (
                    <span className="admin-audit-meta">{log.meta.doctorEmail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {toastMessage ? (
          <div
            className={`auth-toast admin-dash-toast ${toastKind === "error" ? "error" : toastKind === "success" ? "success" : ""}`}
            role="status"
          >
            {toastMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
