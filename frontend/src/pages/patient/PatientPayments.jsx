import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/ToastProvider";
import { appointmentService } from "../../services/appointmentService";
import { paymentService } from "../../services/paymentService";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

const formatAppointmentDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

function PatientPayments() {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const toast = useToast();

  const highlightedAppointmentId = searchParams.get("appointmentId") || "";

  useEffect(() => {
    let ignore = false;

    const loadBilling = async () => {
      setLoading(true);
      setError("");

      try {
        const [appointmentData, paymentData] = await Promise.all([
          appointmentService.getMyAppointments(),
          paymentService.getMyPayments()
        ]);

        if (ignore) {
          return;
        }

        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
        setPayments(Array.isArray(paymentData) ? paymentData : []);
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || "Failed to load payment records.");
          setAppointments([]);
          setPayments([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadBilling();

    return () => {
      ignore = true;
    };
  }, []);

  const paymentByAppointment = useMemo(() => {
    const map = {};
    payments.forEach((payment) => {
      map[payment.appointmentId] = payment;
    });
    return map;
  }, [payments]);

  const billableAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => ["ACCEPTED", "COMPLETED"].includes(appointment.status))
        .sort((left, right) => new Date(right.appointmentDate) - new Date(left.appointmentDate)),
    [appointments]
  );

  const summary = useMemo(() => {
    const paidPayments = payments.filter((payment) => payment.status === "PAID");
    const pendingPayments = billableAppointments.filter((appointment) => {
      const payment = paymentByAppointment[appointment._id];
      return appointment.status === "ACCEPTED" && payment?.status !== "PAID";
    });

    return {
      readyToPay: pendingPayments.length,
      paid: paidPayments.length,
      totalPaid: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      consultations: billableAppointments.length
    };
  }, [billableAppointments, paymentByAppointment, payments]);

  const openCheckout = async (appointment) => {
    setProcessingId(appointment._id);
    setError("");

    try {
      const result = await paymentService.createCheckoutSession({
        appointmentId: appointment._id,
        amount: Number(appointment.consultationFee || 0)
      });

      if (!result.checkoutUrl) {
        throw new Error("Checkout URL was not returned");
      }

      window.location.assign(result.checkoutUrl);
    } catch (err) {
      const message = err.response?.data?.message || "Unable to start checkout.";
      setError(message);
      toast.error("Payment unavailable", message);
    } finally {
      setProcessingId("");
    }
  };

  return (
    <section className="dashboard-page patient-payments-page">
      <PageHeader
        eyebrow="Billing Center"
        title="Payments"
        subtitle="Review accepted consultations, payment status, and sandbox transaction records without collecting card details inside the platform."
        action={
          <Link className="btn btn-outline" to="/patient/appointments">
            Open Appointments
          </Link>
        }
      />

      <div className="metrics-grid">
        <StatCard label="Ready To Pay" value={summary.readyToPay} hint="Accepted consultations awaiting payment" />
        <StatCard label="Paid Records" value={summary.paid} hint="Completed checkout records" accent="success" />
        <StatCard
          label="Recorded Revenue"
          value={formatCurrency(summary.totalPaid, "LKR")}
          hint="Based on payment-service data only"
          accent="accent"
        />
        <StatCard label="Billing Items" value={summary.consultations} hint="Accepted or completed consultations" accent="secondary" />
      </div>

      <div className="panel payment-policy-panel">
        <div>
          <h2>Sandbox Checkout</h2>
          <p>No real card data is stored in this application. Payment actions redirect to the existing sandbox checkout flow.</p>
        </div>
        <StatusBadge value="PENDING" type="payment" />
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <Loader label="Loading billing records..." /> : null}

      {!loading && billableAppointments.length === 0 ? (
        <EmptyState
          title="No accepted consultations yet"
          message="Payments become actionable after a doctor accepts an appointment."
          action={
            <Link className="btn btn-primary" to="/patient/book-appointment">
              Book Appointment
            </Link>
          }
        />
      ) : null}

      {!loading && billableAppointments.length > 0 ? (
        <div className="payment-card-list">
          {billableAppointments.map((appointment) => {
            const payment = paymentByAppointment[appointment._id];
            const paymentStatus = payment?.status || "PENDING";
            const isReadyForPayment = appointment.status === "ACCEPTED" && paymentStatus !== "PAID";

            return (
              <article
                key={appointment._id}
                className={`payment-card${highlightedAppointmentId === appointment._id ? " payment-card--highlighted" : ""}`}
              >
                <div className="payment-card__head">
                  <div>
                    <span className="payment-card__eyebrow">Appointment Billing</span>
                    <h3>{appointment.doctorName || "Doctor"}</h3>
                    <p>
                      {formatAppointmentDate(appointment.appointmentDate)} at {appointment.timeSlot || "-"}
                    </p>
                  </div>
                  <div className="payment-card__status">
                    <StatusBadge value={appointment.status} />
                    <StatusBadge value={paymentStatus} type="payment" />
                  </div>
                </div>

                <div className="payment-card__grid">
                  <div>
                    <span>Consultation Fee</span>
                    <strong>{formatCurrency(appointment.consultationFee, "LKR")}</strong>
                  </div>
                  <div>
                    <span>Transaction</span>
                    <strong>{payment?.transactionRef || payment?.stripePaymentIntentId || "Pending"}</strong>
                  </div>
                  <div>
                    <span>Updated</span>
                    <strong>{formatDateTime(payment?.paidAt || payment?.updatedAt || appointment.updatedAt)}</strong>
                  </div>
                  <div>
                    <span>Reason</span>
                    <strong>{appointment.reason || "No reason provided"}</strong>
                  </div>
                </div>

                {payment?.failureReason ? <p className="patient-payment-failure">{payment.failureReason}</p> : null}

                <div className="payment-card__actions">
                  <Link className="btn btn-outline" to="/patient/appointments">
                    View Timeline
                  </Link>
                  {appointment.meetingLink ? (
                    <Link className="btn btn-outline" to={`/consultation/${appointment._id}`}>
                      Consultation Room
                    </Link>
                  ) : null}
                  {isReadyForPayment ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={processingId === appointment._id}
                      onClick={() => openCheckout(appointment)}
                    >
                      {processingId === appointment._id ? "Opening Checkout..." : "Pay Now"}
                    </button>
                  ) : (
                    <span className="payment-card__caption">
                      {paymentStatus === "PAID"
                        ? "This consultation has already been paid."
                        : "Payment becomes available after acceptance."}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default PatientPayments;
