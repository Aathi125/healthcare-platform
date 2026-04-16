import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/ToastProvider";
import { appointmentService } from "../../services/appointmentService";
import { paymentService } from "../../services/paymentService";

const statusOptions = ["ALL", "PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"];

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const toInputDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

function MyAppointments() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState("ALL");
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingStripeResult, setProcessingStripeResult] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ appointmentDate: "", timeSlot: "", reason: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const appointmentPromise = appointmentService.getMyAppointments(status === "ALL" ? {} : { status });
      const paymentPromise = paymentService.getMyPayments();
      const [appointmentData, paymentData] = await Promise.all([appointmentPromise, paymentPromise]);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load appointments.";
      setError(message);
      toast.error("Appointments unavailable", message);
      setAppointments([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const paymentResult = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (!paymentResult) {
      return undefined;
    }

    const clearPaymentParams = () => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("payment");
      nextParams.delete("session_id");
      nextParams.delete("appointmentId");
      setSearchParams(nextParams, { replace: true });
    };

    if (paymentResult === "cancelled") {
      const message = "Payment was cancelled before completion.";
      setError(message);
      toast.info("Checkout cancelled", message);
      clearPaymentParams();
      return undefined;
    }

    if (paymentResult !== "success" || !sessionId) {
      return undefined;
    }

    let ignore = false;

    const syncStripePayment = async () => {
      setProcessingStripeResult(true);
      setError("");

      try {
        const result = await paymentService.getCheckoutSessionStatus(sessionId);

        if (ignore) {
          return;
        }

        const message =
          result.payment?.status === "PAID"
            ? "Payment completed successfully."
            : "Payment is being confirmed. Refresh again in a few seconds if the status stays pending.";

        setSuccess(message);
        toast.success("Payment update", message);
        await loadData();
      } catch (err) {
        if (!ignore) {
          const message = err.response?.data?.message || "Failed to confirm Stripe payment status.";
          setError(message);
          toast.error("Payment confirmation failed", message);
        }
      } finally {
        if (!ignore) {
          setProcessingStripeResult(false);
          clearPaymentParams();
        }
      }
    };

    syncStripePayment();

    return () => {
      ignore = true;
    };
  }, [loadData, searchParams, setSearchParams, toast]);

  const paymentsByAppointment = useMemo(() => {
    const map = {};
    payments.forEach((payment) => {
      map[payment.appointmentId] = payment;
    });
    return map;
  }, [payments]);

  const summary = useMemo(
    () => ({
      total: appointments.length,
      pending: appointments.filter((appointment) => appointment.status === "PENDING").length,
      accepted: appointments.filter((appointment) => appointment.status === "ACCEPTED").length,
      completed: appointments.filter((appointment) => appointment.status === "COMPLETED").length
    }),
    [appointments]
  );

  const startEdit = (appointment) => {
    setEditingId(appointment._id);
    setEditForm({
      appointmentDate: toInputDate(appointment.appointmentDate),
      timeSlot: appointment.timeSlot,
      reason: appointment.reason
    });
  };

  const saveEdit = async () => {
    setError("");
    setSuccess("");

    try {
      await appointmentService.updateMyAppointment(editingId, editForm);
      const message = "Appointment updated successfully.";
      setSuccess(message);
      toast.success("Appointment updated", message);
      setEditingId("");
      loadData();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update appointment.";
      setError(message);
      toast.error("Update failed", message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    setError("");
    setSuccess("");

    try {
      await appointmentService.cancelMyAppointment(appointmentId);
      const message = "Appointment cancelled successfully.";
      setSuccess(message);
      toast.success("Appointment cancelled", message);
      loadData();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to cancel appointment.";
      setError(message);
      toast.error("Cancellation failed", message);
    }
  };

  return (
    <section className="dashboard-page patient-appointments-page">
      <PageHeader
        eyebrow="Appointment Timeline"
        title="My Appointments"
        subtitle="Track status changes, update pending requests, open the billing center, and join consultations from one place."
        action={
          <Link className="btn btn-outline" to="/patient/payments">
            Billing Center
          </Link>
        }
      />

      <div className="metrics-grid">
        <StatCard label="In View" value={summary.total} hint="Appointments returned by the current filter" />
        <StatCard label="Pending" value={summary.pending} hint="Still waiting for doctor review" accent="accent" />
        <StatCard label="Accepted" value={summary.accepted} hint="Ready for payment or consultation" accent="secondary" />
        <StatCard label="Completed" value={summary.completed} hint="Finalized consultation history" accent="success" />
      </div>

      <div className="panel appointments-filter-panel">
        <div className="appointments-filter-head">
          <h3>Status Filter</h3>
          <p>{loading ? "Loading..." : `${appointments.length} appointment${appointments.length === 1 ? "" : "s"} found`}</p>
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
      {!loading && processingStripeResult ? <Loader label="Confirming Stripe payment..." /> : null}

      {!loading && appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          message="Try another filter or book a new consultation."
          action={
            <Link className="btn btn-primary" to="/patient/book-appointment">
              Book Appointment
            </Link>
          }
        />
      ) : null}

      {!loading && appointments.length > 0 ? (
        <div className="patient-appointments-grid">
          {appointments.map((appointment) => {
            const payment = paymentsByAppointment[appointment._id];
            const paymentStatus = payment?.status || "PENDING";

            return (
              <article className="appointment-card" key={appointment._id}>
                <header className="appointment-card-head">
                  <div>
                    <h3 className="appointment-patient">{appointment.doctorName}</h3>
                    <p className="appointment-datetime">
                      {formatDate(appointment.appointmentDate)} at {appointment.timeSlot}
                    </p>
                  </div>
                  <StatusBadge value={appointment.status} />
                </header>

                <div className="appointment-info-grid">
                  <div className="appointment-info-item">
                    <span className="appointment-label">Reason</span>
                    <span className="appointment-value">{appointment.reason}</span>
                  </div>

                  <div className="appointment-info-item">
                    <span className="appointment-label">Consultation Fee</span>
                    <span className="appointment-value">LKR {Number(appointment.consultationFee || 0).toLocaleString()}</span>
                  </div>

                  <div className="appointment-info-item">
                    <span className="appointment-label">Payment</span>
                    <StatusBadge value={paymentStatus} type="payment" />
                  </div>

                  {appointment.rejectionReason ? (
                    <div className="appointment-info-item appointment-info-item--full">
                      <span className="appointment-label">Rejection Reason</span>
                      <span className="appointment-value">{appointment.rejectionReason}</span>
                    </div>
                  ) : null}
                </div>

                {editingId === appointment._id ? (
                  <div className="appointment-edit-form form-grid two-col">
                    <label>
                      New Date
                      <input
                        type="date"
                        value={editForm.appointmentDate}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, appointmentDate: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      New Time Slot
                      <input
                        type="text"
                        value={editForm.timeSlot}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, timeSlot: event.target.value }))}
                      />
                    </label>
                    <label className="span-2">
                      Reason
                      <textarea
                        rows="3"
                        value={editForm.reason}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, reason: event.target.value }))}
                      />
                    </label>
                    <div className="appointment-edit-actions span-2">
                      <button type="button" className="btn btn-primary" onClick={saveEdit}>
                        Save
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setEditingId("")}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="appointment-actions">
                    {appointment.status === "PENDING" ? (
                      <>
                        <button type="button" className="btn btn-outline" onClick={() => startEdit(appointment)}>
                          Modify
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => cancelAppointment(appointment._id)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}

                    {appointment.status === "ACCEPTED" ? (
                      <>
                        <Link className="btn btn-outline" to={`/patient/payments?appointmentId=${appointment._id}`}>
                          Payment Center
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => cancelAppointment(appointment._id)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}

                    {appointment.status === "ACCEPTED" && appointment.meetingLink && paymentStatus !== "PAID" ? (
                      <button 
                        className="btn btn-primary" 
                        disabled={paymentStatus === "PAID"}
                        title={paymentStatus === "PAID" ? "Payment completed - consultation available" : ""}
                      >
                        {paymentStatus === "PAID" ? "Payment Completed" : "Join Consultation"}
                      </button>
                    ) : paymentStatus === "PAID" && appointment.meetingLink ? (
                      <Link className="btn btn-primary" to={`/consultation/${appointment._id}`}>
                        Start Consultation
                      </Link>
                    ) : null}

                    {appointment.status === "COMPLETED" && appointment.meetingLink ? (
                      <Link className="btn btn-outline" to={`/consultation/${appointment._id}`}>
                        View Consultation Room
                      </Link>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default MyAppointments;
