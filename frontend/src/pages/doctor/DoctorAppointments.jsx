import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Dialog from "../../components/ui/Dialog";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/ToastProvider";
import { appointmentService } from "../../services/appointmentService";

const statusOptions = ["ALL", "PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"];

const formatAppointmentDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

function DoctorAppointments() {
  const toast = useToast();
  const [status, setStatus] = useState("ALL");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectingAppointment, setRejectingAppointment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("Doctor is unavailable for this slot");
  const [savingRejection, setSavingRejection] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await appointmentService.getDoctorAppointments(status === "ALL" ? {} : { status });
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load doctor appointments.";
      setError(message);
      toast.error("Appointments unavailable", message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [status]);

  const handleAccept = async (id) => {
    setError("");
    setSuccess("");
    try {
      await appointmentService.acceptAppointment(id);
      const message = "Appointment accepted.";
      setSuccess(message);
      toast.success("Appointment accepted", "The patient can now proceed to payment and consultation.");
      loadAppointments();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to accept appointment.";
      setError(message);
      toast.error("Acceptance failed", message);
    }
  };

  const openRejectDialog = (appointment) => {
    setRejectingAppointment(appointment);
    setRejectionReason(appointment.rejectionReason || "Doctor is unavailable for this slot");
  };

  const closeRejectDialog = () => {
    setRejectingAppointment(null);
    setRejectionReason("Doctor is unavailable for this slot");
    setSavingRejection(false);
  };

  const handleReject = async () => {
    if (!rejectingAppointment) {
      return;
    }

    setSavingRejection(true);
    setError("");
    setSuccess("");

    try {
      await appointmentService.rejectAppointment(rejectingAppointment._id, {
        rejectionReason: rejectionReason.trim() || "Doctor is unavailable for this slot"
      });
      const message = "Appointment rejected.";
      setSuccess(message);
      toast.success("Appointment rejected", "The patient will see the reason in their timeline.");
      closeRejectDialog();
      loadAppointments();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to reject appointment.";
      setError(message);
      toast.error("Rejection failed", message);
      setSavingRejection(false);
    }
  };

  const handleComplete = async (id) => {
    setError("");
    setSuccess("");
    try {
      await appointmentService.completeAppointment(id);
      const message = "Appointment marked as completed.";
      setSuccess(message);
      toast.success("Consultation completed", "Prescription issuance can continue from the completed visit.");
      loadAppointments();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to complete appointment.";
      setError(message);
      toast.error("Completion failed", message);
    }
  };

  const summary = useMemo(
    () => ({
      total: appointments.length,
      pending: appointments.filter((appointment) => appointment.status === "PENDING").length,
      accepted: appointments.filter((appointment) => appointment.status === "ACCEPTED").length,
      completed: appointments.filter((appointment) => appointment.status === "COMPLETED").length
    }),
    [appointments]
  );

  return (
    <section className="dashboard-page doctor-page doctor-appointments-page">
      <PageHeader
        eyebrow="Clinical Operations"
        title="Doctor Appointments"
        subtitle="Review appointment requests, manage decisions with clear reasons, and move accepted consultations into video calls and prescriptions."
        action={
          <Link className="btn btn-outline" to="/doctor/availability">
            Edit Availability
          </Link>
        }
      />

      <div className="metrics-grid">
        <StatCard label="In View" value={summary.total} hint="Appointments returned by the current filter" />
        <StatCard label="Pending Requests" value={summary.pending} hint="Awaiting action" accent="accent" />
        <StatCard label="Accepted" value={summary.accepted} hint="Ready for consultation" accent="secondary" />
        <StatCard label="Completed" value={summary.completed} hint="Finished visits" accent="success" />
      </div>

      <div className="panel appointments-filter-panel doctor-filter-panel">
        <div className="appointments-filter-head">
          <h3>Status Filter</h3>
          <p>
            {loading
              ? "Loading appointments..."
              : `${appointments.length} appointment${appointments.length === 1 ? "" : "s"} found`}
          </p>
        </div>

        <div className="appointments-filter-actions">
          {statusOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`btn ${status === option ? "btn-primary" : "btn-outline"}`}
              onClick={() => setStatus(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      {loading ? <Loader label="Loading appointments..." /> : null}

      {!loading && appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          message="Try another status filter or wait for new booking requests."
        />
      ) : null}

      {!loading && appointments.length > 0 ? (
        <div className="doctor-appointments-grid">
          {appointments.map((appointment) => (
            <article className="appointment-card" key={appointment._id}>
              <header className="appointment-card-head">
                <div>
                  <h3 className="appointment-patient">{appointment.patientName || "Patient"}</h3>
                  <p className="appointment-datetime">
                    {formatAppointmentDate(appointment.appointmentDate)} at {appointment.timeSlot || "N/A"}
                  </p>
                </div>
                <StatusBadge value={appointment.status} />
              </header>

              <div className="appointment-info-grid">
                <div className="appointment-info-item">
                  <span className="appointment-label">Patient Email</span>
                  <span className="appointment-value">{appointment.patientEmail || "Not available"}</span>
                </div>

                <div className="appointment-info-item">
                  <span className="appointment-label">Reason</span>
                  <span className="appointment-value">{appointment.reason || "Not provided"}</span>
                </div>

                <div className="appointment-info-item">
                  <span className="appointment-label">Specialization</span>
                  <span className="appointment-value">{appointment.specialization || "General"}</span>
                </div>

                <div className="appointment-info-item">
                  <span className="appointment-label">Consultation Fee</span>
                  <span className="appointment-value">LKR {Number(appointment.consultationFee || 0).toLocaleString()}</span>
                </div>

                <div className="appointment-info-item appointment-info-item--full">
                  <span className="appointment-label">Appointment ID</span>
                  <span className="appointment-value appointment-value--mono">{appointment._id}</span>
                </div>

                {appointment.rejectionReason ? (
                  <div className="appointment-info-item appointment-info-item--full">
                    <span className="appointment-label">Rejection Reason</span>
                    <span className="appointment-value">{appointment.rejectionReason}</span>
                  </div>
                ) : null}
              </div>

              <div className="appointment-actions">
                {appointment.status === "PENDING" ? (
                  <>
                    <button className="btn btn-primary" type="button" onClick={() => handleAccept(appointment._id)}>
                      Accept
                    </button>
                    <button className="btn btn-outline" type="button" onClick={() => openRejectDialog(appointment)}>
                      Reject
                    </button>
                  </>
                ) : null}

                {appointment.status === "ACCEPTED" ? (
                  <>
                    {appointment.meetingLink ? (
                      <Link className="btn btn-outline" to={`/consultation/${appointment._id}`}>
                        Consultation Room
                      </Link>
                    ) : null}
                    <button className="btn btn-primary" type="button" onClick={() => handleComplete(appointment._id)}>
                      Mark Completed
                    </button>
                  </>
                ) : null}

                {appointment.status === "COMPLETED" && appointment.meetingLink ? (
                  <Link className="btn btn-outline" to={`/consultation/${appointment._id}`}>
                    View Consultation Room
                  </Link>
                ) : null}

                {(appointment.status === "ACCEPTED" || appointment.status === "COMPLETED") ? (
                  <Link
                    className="btn btn-outline"
                    to={`/doctor/issue-prescription?patientId=${appointment.patientId}&appointmentId=${appointment._id}`}
                  >
                    Issue Prescription
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Dialog
        open={Boolean(rejectingAppointment)}
        title="Reject Appointment"
        description="Provide the reason shown to the patient. This does not change the existing workflow or API."
        onClose={closeRejectDialog}
        actions={
          <>
            <button type="button" className="btn btn-outline" onClick={closeRejectDialog}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={savingRejection} onClick={handleReject}>
              {savingRejection ? "Saving..." : "Confirm Rejection"}
            </button>
          </>
        }
      >
        <label className="dialog__field">
          Rejection Reason
          <textarea
            rows="4"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Explain why this request cannot be accepted."
          />
        </label>
      </Dialog>
    </section>
  );
}

export default DoctorAppointments;
