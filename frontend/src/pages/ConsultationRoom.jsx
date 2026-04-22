import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { appointmentService } from "../services/appointmentService";
import { formatDateTime } from "../utils/formatters";

const getRoleAwareAppointment = (role, appointmentId) => {
  if (role === "DOCTOR") {
    return appointmentService.getDoctorAppointmentById(appointmentId);
  }

  return appointmentService.getMyAppointmentById(appointmentId);
};

function ConsultationRoom() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadAppointment = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getRoleAwareAppointment(user?.role, appointmentId);

        if (!ignore) {
          setAppointment(data);
        }
      } catch (err) {
        if (!ignore) {
          setAppointment(null);
          setError(err.response?.data?.message || "Failed to load consultation session.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadAppointment();

    return () => {
      ignore = true;
    };
  }, [appointmentId, user?.role]);

  const copyMeetingLink = async () => {
    if (!appointment?.meetingLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(appointment.meetingLink);
      toast.success("Link copied", "The meeting link is ready to share.");
    } catch {
      toast.error("Copy failed", "Your browser blocked clipboard access.");
    }
  };

  if (loading) {
    return (
      <section className="dashboard-page">
        <Loader label="Loading consultation room..." />
      </section>
    );
  }

  if (error || !appointment) {
    return (
      <section className="dashboard-page">
        <EmptyState
          title="Consultation not available"
          message={error || "This consultation session could not be found."}
          action={
            <Link className="btn btn-primary" to={user?.role === "DOCTOR" ? "/doctor/appointments" : "/patient/appointments"}>
              Back to Appointments
            </Link>
          }
        />
      </section>
    );
  }

  if (!appointment.meetingLink || !["ACCEPTED", "COMPLETED"].includes(appointment.status)) {
    return (
      <section className="dashboard-page">
        <EmptyState
          title="Session not ready"
          message="The consultation room is created when an appointment is accepted."
          action={
            <Link className="btn btn-primary" to={user?.role === "DOCTOR" ? "/doctor/appointments" : "/patient/appointments"}>
              Back to Appointments
            </Link>
          }
        />
      </section>
    );
  }

  const counterpartLabel = user?.role === "DOCTOR" ? appointment.patientName : `Dr. ${appointment.doctorName}`;

  return (
    <section className="dashboard-page consultation-page">
      <PageHeader
        eyebrow="Consultation Session"
        title="Consultation Room"
        subtitle="Review the session details below, then join the secure consultation room when both parties are ready."
        action={
          <a className="btn btn-primary" href={appointment.meetingLink} target="_blank" rel="noreferrer">
            Join Consultation
          </a>
        }
      />

      <div className="consultation-layout">
        <article className="panel consultation-card">
          <div className="consultation-card__head">
            <div>
              <span className="consultation-card__eyebrow">Live Telemedicine Session</span>
              <h2>{counterpartLabel}</h2>
              <p>
                {formatDateTime(appointment.appointmentDate)} · {appointment.timeSlot || "-"}
              </p>
            </div>
            <StatusBadge value={appointment.status} />
          </div>

          <div className="consultation-card__grid">
            <div>
              <span>Appointment ID</span>
              <strong>{appointment._id}</strong>
            </div>
            <div>
              <span>Patient</span>
              <strong>{appointment.patientName || "Patient"}</strong>
            </div>
            <div>
              <span>Doctor</span>
              <strong>{appointment.doctorName || "Doctor"}</strong>
            </div>
            <div>
              <span>Consultation Fee</span>
              <strong>LKR {Number(appointment.consultationFee || 0).toLocaleString()}</strong>
            </div>
          </div>

          <div className="consultation-link-box">
            <span>Meeting Link</span>
            <strong>{appointment.meetingLink}</strong>
          </div>

          <div className="consultation-card__actions">
            <button type="button" className="btn btn-outline" onClick={copyMeetingLink}>
              Copy Link
            </button>
            <Link className="btn btn-outline" to={user?.role === "DOCTOR" ? "/doctor/appointments" : "/patient/appointments"}>
              Back to Appointments
            </Link>
          </div>
        </article>

        <aside className="consultation-side">
          <div className="panel consultation-checklist">
            <h3>Before Joining</h3>
            <ul className="profile-tip-list">
              <li>Confirm the appointment status is accepted.</li>
              <li>Keep reports or prescriptions open for reference during the call.</li>
              <li>Use the copied meeting link if you need to share the session outside the portal.</li>
            </ul>
          </div>

          <div className="panel consultation-summary">
            <h3>Session Summary</h3>
            <div className="doctor-summary-list">
              <div className="doctor-summary-item">
                <span>Reason</span>
                <strong>{appointment.reason || "Not provided"}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Created</span>
                <strong>{formatDateTime(appointment.createdAt)}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Last Updated</span>
                <strong>{formatDateTime(appointment.updatedAt)}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default ConsultationRoom;
