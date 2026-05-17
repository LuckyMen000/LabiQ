import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import AdminRoute from "./pages/AdminRoute";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

function App() {
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/admin"
          element={
            <AdminRoute user={user}>
              <AdminPage user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminRoute user={user}>
              <AdminLogsPage user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />

        <Route
        path="/admin/users"
          element={
            <AdminRoute user={user}>
              <AdminUsersPage user={user} onLogout={handleLogout} />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;