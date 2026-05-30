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
  user?: User | null;
  children: ReactNode;
};

function AdminRoute({ user, children }: AdminRouteProps) {
  const token = localStorage.getItem("access_token");

  const savedUser = localStorage.getItem("user");
  const localUser: User | null = savedUser ? JSON.parse(savedUser) : null;

  const currentUser = user || localUser;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin =
    currentUser.role === "admin" ||
    currentUser.role === "administrator" ||
    currentUser.role === "Администратор";

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;