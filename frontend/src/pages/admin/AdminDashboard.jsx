import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/ToastProvider";
import { authService } from "../../services/authService";
import { doctorService } from "../../services/doctorService";
import { paymentService } from "../../services/paymentService";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

function AdminDashboard() {
  const toast = useToast();
  const [doctorAccounts, setDoctorAccounts] = useState([]);
  const [doctorProfiles, setDoctorProfiles] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationLoadingId, setVerificationLoadingId] = useState("");

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const [accountsData, profilesData, paymentsData] = await Promise.all([
        authService.getDoctorAccounts(),
        doctorService.getDoctors(),
        paymentService.getAllPayments()
      ]);

      setDoctorAccounts(Array.isArray(accountsData) ? accountsData : []);
      setDoctorProfiles(Array.isArray(profilesData) ? profilesData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load admin dashboard.";
      toast.error("Dashboard unavailable", message);
      setDoctorAccounts([]);
      setDoctorProfiles([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const profilesByUserId = useMemo(() => {
    const map = new Map();
    doctorProfiles.forEach((profile) => {
      map.set((profile.userId || "").toString(), profile);
    });
    return map;
  }, [doctorProfiles]);

  const doctorOperations = useMemo(
    () =>
      doctorAccounts.map((account) => {
        const profile = profilesByUserId.get(account.id);
        return {
          account,
          profile,
          hasProfile: Boolean(profile),
          verified: Boolean(profile?.verified)
        };
      }),
    [doctorAccounts, profilesByUserId]
  );

  const paymentCurrency = payments.find((payment) => payment.currency)?.currency || "LKR";
  const paidPayments = payments.filter((payment) => payment.status === "PAID");
  const pendingPayments = payments.filter((payment) => payment.status === "PENDING");
  const failedPayments = payments.filter((payment) => payment.status === "FAILED");

  const summary = {
    accounts: doctorAccounts.length,
    profiles: doctorProfiles.length,
    verified: doctorProfiles.filter((profile) => profile.verified).length,
    unverified: doctorProfiles.filter((profile) => !profile.verified).length,
    pendingProfiles: doctorAccounts.filter((account) => !profilesByUserId.has(account.id)).length,
    revenue: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  };

  const handleVerificationToggle = async (profile) => {
    const nextVerifiedState = !profile.verified;
    setVerificationLoadingId(profile._id);

    try {
      await doctorService.verifyDoctor(profile._id, { verified: nextVerifiedState });
      toast.success(
        nextVerifiedState ? "Doctor verified" : "Doctor unverified",
        `${profile.name} is now ${nextVerifiedState ? "verified" : "marked as unverified"}.`
      );
      await loadDashboard();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update doctor verification.";
      toast.error("Verification update failed", message);
    } finally {
      setVerificationLoadingId("");
    }
  };

  const adminActions = [
    {
      title: "Create Doctor Account",
      description: "Provision login credentials in auth-service before profile creation.",
      to: "/admin/create-doctor-account"
    },
    {
      title: "Create Doctor Profile",
      description: "Attach specialization, hospital, fees, and availability to an existing doctor account.",
      to: "/admin/create-doctor-profile"
    }
  ];

  return (
    <section className="dashboard-page admin-dashboard-page">
      <PageHeader
        eyebrow="Platform Control"
        title="Admin Dashboard"
        subtitle="Monitor doctor onboarding, verification, and payment activity while preserving the existing service boundaries."
      />

      <div className="metrics-grid">
        <StatCard label="Doctor Accounts" value={summary.accounts} hint="Accounts created in auth-service" />
        <StatCard label="Doctor Profiles" value={summary.profiles} hint={`${summary.pendingProfiles} accounts still need profiles`} accent="secondary" />
        <StatCard label="Verified Doctors" value={summary.verified} hint={`${summary.unverified} profile${summary.unverified === 1 ? "" : "s"} need review`} accent="success" />
        <StatCard label="Paid Revenue" value={formatCurrency(summary.revenue, paymentCurrency)} hint={`${paidPayments.length} paid records`} accent="accent" />
      </div>

      <div className="quick-actions-section">
        <h2>Admin Actions</h2>
        <div className="quick-actions-grid">
          {adminActions.map((action) => (
            <Link key={action.title} to={action.to} className="action-card action-card--primary">
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-operations-grid">
        <section className="panel">
          <div className="admin-section-head">
            <div>
              <h2>Doctor Verification</h2>
              <p>Review existing doctor profiles and toggle their verification state using the current admin API.</p>
            </div>
            <StatusBadge value={summary.unverified > 0 ? "UNVERIFIED" : "VERIFIED"} />
          </div>

          {loading ? <Loader label="Loading doctor verification list..." /> : null}

          {!loading && doctorProfiles.length === 0 ? (
            <EmptyState
              title="No doctor profiles yet"
              message="Create doctor accounts and profiles first before verification can be managed."
            />
          ) : null}

          {!loading && doctorProfiles.length > 0 ? (
            <div className="doctor-verification-list">
              {doctorProfiles.map((profile) => (
                <article className="doctor-verification-card" key={profile._id}>
                  <div className="doctor-verification-card__head">
                    <div>
                      <h3>{profile.name}</h3>
                      <p>{profile.email}</p>
                    </div>
                    <StatusBadge value={profile.verified ? "VERIFIED" : "UNVERIFIED"} />
                  </div>

                  <div className="doctor-verification-card__grid">
                    <div>
                      <span>Specialization</span>
                      <strong>{profile.specialization || "Not set"}</strong>
                    </div>
                    <div>
                      <span>Hospital</span>
                      <strong>{profile.hospital || "Not set"}</strong>
                    </div>
                    <div>
                      <span>Experience</span>
                      <strong>{Number(profile.experience || 0)} years</strong>
                    </div>
                    <div>
                      <span>Consultation Fee</span>
                      <strong>LKR {Number(profile.consultationFee || 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="doctor-verification-card__actions">
                    <button
                      type="button"
                      className={profile.verified ? "btn btn-outline" : "btn btn-primary"}
                      disabled={verificationLoadingId === profile._id}
                      onClick={() => handleVerificationToggle(profile)}
                    >
                      {verificationLoadingId === profile._id
                        ? "Saving..."
                        : profile.verified
                          ? "Mark Unverified"
                          : "Verify Doctor"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="admin-section-head">
            <div>
              <h2>User Management Overview</h2>
              <p>Track doctor accounts against doctor profiles without changing auth or doctor-service behavior.</p>
            </div>
            <span className="admin-section-count">{doctorOperations.length}</span>
          </div>

          {loading ? <Loader label="Loading doctor account overview..." /> : null}

          {!loading && doctorOperations.length > 0 ? (
            <div className="admin-account-overview-list">
              {doctorOperations.map(({ account, profile, hasProfile, verified }) => (
                <article className="admin-account-overview-card" key={account.id}>
                  <div>
                    <h3>{account.name}</h3>
                    <p>{account.email}</p>
                  </div>
                  <div className="admin-account-overview-status">
                    <StatusBadge value={hasProfile ? "COMPLETED" : "PENDING"} />
                    <StatusBadge value={verified ? "VERIFIED" : "UNVERIFIED"} />
                  </div>
                  <p className="admin-account-overview-note">
                    {hasProfile
                      ? `${profile.specialization || "Doctor"} profile linked successfully.`
                      : "Profile creation is still pending for this doctor account."}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <section className="panel admin-payment-panel">
        <div className="admin-payment-panel-head">
          <div>
            <h3>Payment Summary</h3>
            <p>Payment records are shown exactly as produced by the existing payment-service.</p>
          </div>
          <span>{loading ? "..." : `${payments.length} record${payments.length === 1 ? "" : "s"}`}</span>
        </div>

        {loading ? <Loader label="Loading payment details..." /> : null}

        {!loading && payments.length === 0 ? (
          <EmptyState title="No payment records" message="Payments will appear here after accepted appointments go through the billing flow." />
        ) : null}

        {!loading && payments.length > 0 ? (
          <>
            <div className="metrics-grid metrics-grid--compact">
              <StatCard label="Pending" value={pendingPayments.length} hint="Awaiting checkout completion" accent="accent" />
              <StatCard label="Paid" value={paidPayments.length} hint="Successfully recorded" accent="success" />
              <StatCard label="Failed" value={failedPayments.length} hint="Require retry or follow-up" />
            </div>

            <div className="admin-payment-list">
              {payments.map((payment) => (
                <article key={payment._id} className="admin-payment-card">
                  <div className="admin-payment-card-head">
                    <div>
                      <h4>{payment.patientName || "Unknown Patient"}</h4>
                      <p>{payment.patientEmail || payment.patientId}</p>
                    </div>
                    <div className="admin-payment-card-amount">
                      <strong>{formatCurrency(payment.amount, payment.currency)}</strong>
                      <StatusBadge value={payment.status} type="payment" />
                    </div>
                  </div>

                  <div className="admin-payment-grid">
                    <div className="admin-payment-item">
                      <span>Appointment</span>
                      <strong>{payment.appointmentId}</strong>
                    </div>
                    <div className="admin-payment-item">
                      <span>Method</span>
                      <strong>{(payment.method || "MOCK_CARD").replace(/_/g, " ")}</strong>
                    </div>
                    <div className="admin-payment-item">
                      <span>Transaction</span>
                      <strong>{payment.transactionRef || payment.stripePaymentIntentId || "-"}</strong>
                    </div>
                    <div className="admin-payment-item">
                      <span>Created</span>
                      <strong>{formatDateTime(payment.createdAt)}</strong>
                    </div>
                    <div className="admin-payment-item">
                      <span>Paid At</span>
                      <strong>{formatDateTime(payment.paidAt)}</strong>
                    </div>
                    <div className="admin-payment-item">
                      <span>Patient ID</span>
                      <strong>{payment.patientId}</strong>
                    </div>
                  </div>

                  {payment.failureReason ? <p className="admin-payment-failure">{payment.failureReason}</p> : null}
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </section>
  );
}

export default AdminDashboard;
