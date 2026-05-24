import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

type User = {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
};

type AdminRouteProps = {
  user: User | null;
  children: ReactNode;
};

function AdminRoute({
  user,
  children,
}: AdminRouteProps) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin =
    user.role === "admin" ||
    user.role === "administrator" ||
    user.role === "Администратор";

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;