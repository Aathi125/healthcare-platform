import { Navigate, Outlet } from "react-router-dom";
import { roleHomePath, useAuth } from "../context/AuthContext";

function RoleGuard({ allowedRoles = [], children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return children || <Outlet />;
}

export default RoleGuard;
