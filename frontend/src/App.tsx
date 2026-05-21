import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MainPage from "./pages/MainPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";

import AdminPage from "./pages/AdminPages/AdminPage";
import AdminRoute from "./pages/AdminPages/AdminRoute";
import AdminLogsPage from "./pages/AdminPages/AdminLogsPage";
import AdminUsersPage from "./pages/AdminPages/AdminUsersPage";

type ProtectedRouteProps = {
  children: JSX.Element;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const token = localStorage.getItem("access_token");

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("remember_me");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <LoginPage />}
        />

        <Route
          path="/register"
          element={token ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/settings"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute user={user}>
                <AdminPage user={user} onLogout={handleLogout} />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute>
              <AdminRoute user={user}>
                <AdminLogsPage user={user} onLogout={handleLogout} />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminRoute user={user}>
                <AdminUsersPage user={user} onLogout={handleLogout} />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to={token ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;