import { Navigate, createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import LoginPage from "../features/auth/pages/LoginPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import UsersPage from "../features/users/pages/UsersPage";
import RolesPage from "../features/roles/pages/RolesPage";
import PermissionsPage from "../features/permissions/pages/PermissionsPage";
import RolePermissionsPage from "../features/role-permission/pages/RolePermissionsPage";
import UserRolesPage from "../features/user-role/pages/UserRolesPage";
import ProfilesPage from "../features/profiles/pages/ProfilesPage";
import SessionsPage from "../features/sessions/pages/SessionsPage";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "roles", element: <RolesPage /> },
      { path: "permissions", element: <PermissionsPage /> },
      { path: "role-permission", element: <RolePermissionsPage /> },
      { path: "user-role", element: <UserRolesPage /> },
      { path: "profiles", element: <ProfilesPage /> },
      { path: "sessions", element: <SessionsPage /> },
    ],
  },
]);