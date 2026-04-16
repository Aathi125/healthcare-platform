import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { appointmentService } from "../../services/appointmentService";
import { doctorService } from "../../services/doctorService";

const toLocalIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const formatDateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const getSlotCount = (entry) => {
  if (!entry || !Array.isArray(entry.slots)) return 0;
  return entry.slots.filter((slot) => typeof slot === "string" && slot.trim()).length;
};

function DoctorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileData, doctorAppointments] = await Promise.all([
          doctorService.getMyProfile(),
          appointmentService.getDoctorAppointments()
        ]);

        setProfile(profileData);
        setAppointments(Array.isArray(doctorAppointments) ? doctorAppointments : []);
      } catch {
        setProfile(null);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const availabilityEntries = useMemo(
    () => (Array.isArray(profile?.availability) ? profile.availability : []),
    [profile]
  );

  const availabilitySlotCount = availabilityEntries.reduce((count, entry) => count + getSlotCount(entry), 0);

  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter((appointment) => appointment.status === "PENDING").length;

  const todayIsoDate = toLocalIsoDate(new Date());
  const todayAppointments = appointments.filter(
    (appointment) => toLocalIsoDate(appointment.appointmentDate) === todayIsoDate
  ).length;

  const profileCompletion = Math.round(
    ([
      Boolean(profile?.specialization),
      Number(profile?.experience) > 0,
      Boolean(profile?.hospital),
      Number(profile?.consultationFee) > 0
    ].filter(Boolean).length /
      4) *
      100
  );

  const availabilityPreview = availabilityEntries
    .map((entry, index) => {
      const label = formatDateLabel(entry?.date) || entry?.day || `Entry ${index + 1}`;
      const dateValue = formatDateLabel(entry?.date) ? new Date(entry.date).getTime() : Number.POSITIVE_INFINITY;
      return {
        label,
        slotCount: getSlotCount(entry),
        dateValue
      };
    })
    .filter((entry) => entry.slotCount > 0)
    .sort((a, b) => a.dateValue - b.dateValue)
    .slice(0, 4);

  return (
    <section className="dashboard-page doctor-page doctor-home-page">
      <PageHeader
        title={`Welcome, Dr. ${user?.name || "Doctor"}`}
        subtitle="Review appointments, keep your profile complete, and manage patient-ready availability."
        action={
          <Link className="btn btn-primary" to="/doctor/appointments">
            Open Appointments
          </Link>
        }
      />

      {loading && <Loader label="Loading doctor dashboard..." />}

      {!loading && !profile && (
        <EmptyState
          title="Profile not found"
          message="Ask admin to create your doctor profile, then refresh this page."
          action={
            <Link className="btn btn-primary" to="/doctor/profile">
              Open Profile Page
            </Link>
          }
        />
      )}

      {!loading && profile && (
        <>
          <div className="stats-grid doctor-metric-grid">
            <article className="stat-card stat-card--primary doctor-metric-card">
              <div className="stat-icon doctor-stat-icon">
                <span className="doctor-icon-text">AP</span>
              </div>
              <div className="stat-content">
                <h3>Appointments</h3>
                <div className="stat-value-wrapper">
                  <p className="stat-value">{totalAppointments}</p>
                </div>
                <p className="stat-description">Total consultations assigned to you.</p>
              </div>
            </article>

            <article className="stat-card stat-card--accent doctor-metric-card">
              <div className="stat-icon doctor-stat-icon">
                <span className="doctor-icon-text">PD</span>
              </div>
              <div className="stat-content">
                <h3>Pending</h3>
                <div className="stat-value-wrapper">
                  <p className="stat-value">{pendingAppointments}</p>
                </div>
                <p className="stat-description">Appointment requests waiting for your decision.</p>
              </div>
            </article>

            <article className="stat-card stat-card--secondary doctor-metric-card">
              <div className="stat-icon doctor-stat-icon">
                <span className="doctor-icon-text">TD</span>
              </div>
              <div className="stat-content">
                <h3>Today</h3>
                <div className="stat-value-wrapper">
                  <p className="stat-value">{todayAppointments}</p>
                </div>
                <p className="stat-description">Scheduled appointments for today.</p>
              </div>
            </article>

            <article className="stat-card stat-card--success doctor-metric-card">
              <div className="stat-icon doctor-stat-icon">
                <span className="doctor-icon-text">SL</span>
              </div>
              <div className="stat-content">
                <h3>Configured Slots</h3>
                <div className="stat-value-wrapper">
                  <p className="stat-value">{availabilitySlotCount}</p>
                </div>
                <p className="stat-description">Total time slots currently visible to patients.</p>
              </div>
            </article>
          </div>

          <div className="doctor-home-layout">
            <div className="panel doctor-home-actions-panel">
              <h2>Quick Actions</h2>
              <p className="doctor-panel-subtitle">Move between key doctor tasks without leaving the dashboard.</p>

              <div className="quick-actions-grid doctor-quick-actions-grid">
                <Link className="action-card action-card--primary" to="/doctor/appointments">
                  <div className="action-icon">
                    <span className="doctor-icon-text">AP</span>
                  </div>
                  <div className="action-content">
                    <h3>Manage Appointments</h3>
                    <p>Accept, reject, and complete consultation requests.</p>
                  </div>
                </Link>

                <Link className="action-card action-card--secondary" to="/doctor/profile">
                  <div className="action-icon">
                    <span className="doctor-icon-text">PF</span>
                  </div>
                  <div className="action-content">
                    <h3>Update Profile</h3>
                    <p>Keep specialization, hospital, and fee details up to date.</p>
                  </div>
                </Link>

                <Link className="action-card action-card--accent" to="/doctor/availability">
                  <div className="action-icon">
                    <span className="doctor-icon-text">AV</span>
                  </div>
                  <div className="action-content">
                    <h3>Edit Availability</h3>
                    <p>Publish dated slots that patients can book immediately.</p>
                  </div>
                </Link>

                <Link className="action-card action-card--success" to="/doctor/issue-prescription">
                  <div className="action-icon">
                    <span className="doctor-icon-text">RX</span>
                  </div>
                  <div className="action-content">
                    <h3>Issue Prescription</h3>
                    <p>Create and store prescriptions with medicine instructions.</p>
                  </div>
                </Link>
              </div>
            </div>

            <aside className="panel doctor-summary-panel">
              <h2>Profile Snapshot</h2>
              <div className="doctor-summary-list">
                <div className="doctor-summary-item">
                  <span>Specialization</span>
                  <strong>{profile.specialization || "Not set"}</strong>
                </div>
                <div className="doctor-summary-item">
                  <span>Hospital</span>
                  <strong>{profile.hospital || "Not set"}</strong>
                </div>
                <div className="doctor-summary-item">
                  <span>Consultation Fee</span>
                  <strong>
                    {Number(profile.consultationFee) > 0
                      ? `LKR ${Number(profile.consultationFee).toLocaleString()}`
                      : "Not set"}
                  </strong>
                </div>
                <div className="doctor-summary-item">
                  <span>Profile Completion</span>
                  <strong>{profileCompletion}%</strong>
                </div>
              </div>

              <h3>Upcoming Availability</h3>
              {availabilityPreview.length === 0 ? (
                <p className="doctor-muted-note">No dated slots configured yet.</p>
              ) : (
                <ul className="doctor-slot-preview-list">
                  {availabilityPreview.map((entry, index) => (
                    <li key={`${entry.label}-${index}`}>
                      <span>{entry.label}</span>
                      <strong>
                        {entry.slotCount} slot{entry.slotCount === 1 ? "" : "s"}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

export default DoctorDashboard;
