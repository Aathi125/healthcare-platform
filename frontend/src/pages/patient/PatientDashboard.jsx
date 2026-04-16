import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { appointmentService } from "../../services/appointmentService";
import { patientService } from "../../services/patientService";
import { paymentService } from "../../services/paymentService";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcoming: 0,
    reports: 0,
    prescriptions: 0,
    completed: 0,
    paidPayments: 0,
    pendingPayments: 0,
    paidAmount: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadStats = async () => {
      setLoading(true);

      try {
        const [appointmentsResult, reportsResult, prescriptionsResult, paymentsResult] =
          await Promise.allSettled([
            appointmentService.getMyAppointments(),
            patientService.getMyReports(),
            patientService.getMyPrescriptions(),
            paymentService.getMyPayments()
          ]);

        if (ignore) {
          return;
        }

        const appointments =
          appointmentsResult.status === "fulfilled" && Array.isArray(appointmentsResult.value)
            ? appointmentsResult.value
            : [];
        const reports =
          reportsResult.status === "fulfilled" && Array.isArray(reportsResult.value)
            ? reportsResult.value
            : [];
        const prescriptions =
          prescriptionsResult.status === "fulfilled" && Array.isArray(prescriptionsResult.value)
            ? prescriptionsResult.value
            : [];
        const payments =
          paymentsResult.status === "fulfilled" && Array.isArray(paymentsResult.value)
            ? paymentsResult.value
            : [];

        const upcomingCount = appointments.filter((item) =>
          ["PENDING", "ACCEPTED"].includes(item.status)
        ).length;
        const completedCount = appointments.filter((item) => item.status === "COMPLETED").length;
        const paidPayments = payments.filter((item) => item.status === "PAID");

        setStats({
          upcoming: upcomingCount,
          completed: completedCount,
          reports: reports.length,
          prescriptions: prescriptions.length,
          paidPayments: paidPayments.length,
          pendingPayments: payments.filter((item) => item.status === "PENDING").length,
          paidAmount: paidPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        });
        setRecentPayments(payments.slice(0, 4));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      ignore = true;
    };
  }, []);

  const quickActions = [
    {
      title: "Find Doctors",
      description: "Browse doctors, review available slots, and pick the right specialist",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M17 11l2 2 4-4" />
        </svg>
      ),
      to: "/patient/doctors",
      color: "accent"
    },
    {
      title: "Book Appointment",
      description: "Schedule a consultation with a specialist",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      to: "/patient/book-appointment",
      color: "primary"
    },
    {
      title: "View Appointments",
      description: "Manage appointments and complete any pending payments",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      to: "/patient/appointments",
      color: "secondary"
    },
    {
      title: "Medical Reports",
      description: "Upload and manage your medical documents",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      ),
      to: "/patient/reports",
      color: "accent"
    },
    {
      title: "Prescriptions",
      description: "View your prescriptions and treatment plans",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5Z" />
          <path d="M12 5L8 21l4-7 4 7-4-16Z" />
        </svg>
      ),
      to: "/patient/prescriptions",
      color: "success"
    },
    {
      title: "Payments",
      description: "Review accepted consultations and complete sandbox checkout",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M6 15h5" />
        </svg>
      ),
      to: "/patient/payments",
      color: "primary"
    }
  ];

  const statCards = [
    {
      title: "Upcoming Appointments",
      value: stats.upcoming,
      description: "Pending or accepted appointments",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      ),
      color: "primary",
      trend: stats.upcoming > 0 ? "up" : "neutral"
    },
    {
      title: "Completed Visits",
      value: stats.completed,
      description: "Successfully completed consultations",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
      ),
      color: "success",
      trend: stats.completed > 0 ? "up" : "neutral"
    },
    {
      title: "Medical Reports",
      value: stats.reports,
      description: "Uploaded medical documents",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
      ),
      color: "accent",
      trend: "neutral"
    },
    {
      title: "Prescriptions",
      value: stats.prescriptions,
      description: "Active prescriptions",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5Z" />
        </svg>
      ),
      color: "secondary",
      trend: "neutral"
    },
    {
      title: "Payments Completed",
      value: stats.paidPayments,
      description: "Payments successfully recorded",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M6 15h2" />
          <path d="M10 15h5" />
        </svg>
      ),
      color: "success",
      trend: stats.paidPayments > 0 ? "up" : "neutral"
    },
    {
      title: "Total Paid",
      value: formatCurrency(stats.paidAmount, "LKR"),
      description: `${stats.pendingPayments} payment${stats.pendingPayments === 1 ? "" : "s"} still pending`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1v22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      color: "primary",
      trend: stats.paidAmount > 0 ? "up" : "neutral"
    }
  ];

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="loading-spinner"></div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "Patient"}!`}
        subtitle="Here is your healthcare account overview"
      />

      <div className="dashboard-stats">
        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <div key={index} className={`stat-card stat-card--${stat.color}`}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <h3>{stat.title}</h3>
                <div className="stat-value-wrapper">
                  <span className="stat-value">{stat.value}</span>
                  {stat.trend === "up" && (
                    <svg className="trend-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
                      <polyline points="17,6 23,6 23,12" />
                    </svg>
                  )}
                </div>
                <p className="stat-description">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.to} className={`action-card action-card--${action.color}`}>
                <div className="action-icon">{action.icon}</div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                <div className="action-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6" />
                    <polyline points="15,12 3,12 3,18" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-widgets">
          <div className="widget upcoming-appointments">
            <h3>Next Steps</h3>
            <div className="widget-content">
              <div className="activity-item">
                <div className="activity-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                <div className="activity-details">
                  <p className="activity-title">Review pending and accepted appointments</p>
                  <p className="activity-time">Track status from My Appointments</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
                <div className="activity-details">
                  <p className="activity-title">Clear pending appointment payments</p>
                  <p className="activity-time">
                    {stats.pendingPayments > 0
                      ? `${stats.pendingPayments} payment${stats.pendingPayments === 1 ? "" : "s"} still waiting`
                      : "No pending payments right now"}
                  </p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>
                <div className="activity-details">
                  <p className="activity-title">Open your latest prescriptions and reports</p>
                  <p className="activity-time">Keep records ready before consultations</p>
                </div>
              </div>
            </div>
            <Link to="/patient/appointments" className="widget-link">
              Open Appointments →
            </Link>
          </div>

          <div className="widget patient-payments-widget">
            <h3>Recent Payments</h3>
            <p className="patient-payment-summary">
              {stats.paidPayments} paid / {stats.pendingPayments} pending / {formatCurrency(stats.paidAmount, "LKR")} total recorded
            </p>
            <div className="widget-content">
              {recentPayments.length === 0 ? (
                <p className="patient-payment-empty">No payment records available yet.</p>
              ) : (
                <div className="patient-payment-list">
                  {recentPayments.map((payment) => (
                    <div key={payment._id} className="patient-payment-item">
                      <div className="patient-payment-item-head">
                        <div>
                          <p className="patient-payment-title">
                            Appointment #{payment.appointmentId?.slice(-6)?.toUpperCase() || payment.appointmentId}
                          </p>
                          <p className="patient-payment-meta">{formatDateTime(payment.paidAt || payment.createdAt)}</p>
                        </div>
                        <span className={`payment-status payment-status--${payment.status.toLowerCase()}`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="patient-payment-item-foot">
                        <strong>{formatCurrency(payment.amount, payment.currency)}</strong>
                        <span>{(payment.method || "MOCK_CARD").replace(/_/g, " ")}</span>
                      </div>
                      {payment.failureReason && (
                        <p className="patient-payment-failure">{payment.failureReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link to="/patient/payments" className="widget-link">
              View Payment Status →
            </Link>
          </div>

          <div className="widget health-tips">
            <h3>Account Reminders</h3>
            <div className="widget-content">
              <div className="tip-item">
                <h4>Keep Profile Updated</h4>
                <p>Update phone number and personal details for smoother communication.</p>
              </div>
              <div className="tip-item">
                <h4>Upload Key Reports</h4>
                <p>Attach recent reports before appointments so doctors can review them early.</p>
              </div>
            </div>
            <Link to="/patient/profile" className="widget-link">
              Manage Profile →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PatientDashboard;
