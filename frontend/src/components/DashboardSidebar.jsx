import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linksByRole = {
  PATIENT: [
    { to: "/patient/dashboard", label: "Dashboard", short: "DB" },
    { to: "/patient/doctors", label: "Find Doctors", short: "DR" },
    { to: "/patient/book-appointment", label: "Book Appointment", short: "BK" },
    { to: "/patient/appointments", label: "My Appointments", short: "AP" },
    { to: "/patient/payments", label: "Payments", short: "PM" },
    { to: "/patient/profile", label: "My Profile", short: "PF" },
    { to: "/patient/reports", label: "My Reports", short: "RP" },
    { to: "/patient/prescriptions", label: "Prescriptions", short: "RX" }
  ],
  DOCTOR: [
    { to: "/doctor/dashboard", label: "Dashboard", short: "DB" },
    { to: "/doctor/appointments", label: "Appointments", short: "AP" },
    { to: "/doctor/profile", label: "My Profile", short: "PF" },
    { to: "/doctor/availability", label: "Availability", short: "AV" },
    { to: "/doctor/issue-prescription", label: "Issue Prescription", short: "RX" }
  ],
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", short: "DB" },
    { to: "/admin/create-doctor-account", label: "Create Doctor Account", short: "DA" },
    { to: "/admin/create-doctor-profile", label: "Create Doctor Profile", short: "DP" }
  ]
};

const roleHintByRole = {
  PATIENT: "Track appointments, reports, and your health records.",
  DOCTOR: "Manage availability, appointments, and prescriptions.",
  ADMIN: "Control doctor accounts and platform configuration."
};

function DashboardSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const links = linksByRole[user?.role] || [];
  const role = user?.role || "USER";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className={`dashboard-sidebar dashboard-sidebar--${role.toLowerCase()}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand-wrap">
          <span className="sidebar-brand-mark">MC</span>
          <div>
            <div className="sidebar-brand">medicare</div>
            <p className="sidebar-role">{role.toLowerCase()}</p>
          </div>
        </div>

        {user?.name && <p className="sidebar-user">Signed in as {user.name}</p>}
        <p className="sidebar-role-hint">{roleHintByRole[role] || "Manage your dashboard workspace."}</p>
      </div>

      <nav className="sidebar-nav" aria-label={`${role.toLowerCase()} navigation`}>
        <p className="sidebar-nav-title">Navigation</p>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to}>
            <span className="sidebar-link-mark">{link.short}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="btn btn-outline sidebar-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}

export default DashboardSidebar;
