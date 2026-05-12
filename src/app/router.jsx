import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import RoleRoute from "./RoleRoute";
import RootRedirect from "./RootRedirect";
import {
  ROL_ADMIN_SISTEMA,
  ROL_ADMIN_EMPRESA,
  ROL_SUPERVISOR,
  ROL_CONDUCTOR,
  ROL_CIUDADANO,
} from "../context/AuthContext";

const ROLES_GESTION = [ROL_ADMIN_SISTEMA, ROL_ADMIN_EMPRESA, ROL_SUPERVISOR];
const ROLES_ADMIN = [ROL_ADMIN_SISTEMA, ROL_ADMIN_EMPRESA];
import MainLayout from "../components/layout/MainLayout";
import NegocioLayout from "../components/layout/negocio/NegocioLayout";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import GoogleCompleteProfilePage from "../features/auth/pages/GoogleCompleteProfilePage";
import GithubCallbackPage from "../features/auth/pages/GithubCallbackPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import AppSelectionPage from "../features/app-selection/pages/AppSelectionPage";
import NegocioHomePage from "../features/negocio/pages/NegocioHomePage";
import ReporteRapidoPage from "../features/negocio/incidentes/pages/ReporteRapidoPage";
import IncidentesPorBusPage from "../features/negocio/incidentes/pages/IncidentesPorBusPage";
import RecargarTarjetaPage from "../features/negocio/recargas/pages/RecargarTarjetaPage";
import IngresosPorMetodoPagoPage from "../features/negocio/reportes/pages/IngresosPorMetodoPagoPage";
import DistribucionEtariaPage from "../features/negocio/reportes/pages/DistribucionEtariaPage";
import TendenciaIncidentesPage from "../features/negocio/reportes/pages/TendenciaIncidentesPage";
import RutasPage from "../features/negocio/rutas/pages/RutasPage";
import ParaderosPage from "../features/negocio/paraderos/pages/ParaderosPage";
import ParaderosCercanosPage from "../features/negocio/paraderos/pages/ParaderosCercanosPage";
import AbordajePage from "../features/negocio/boletos/pages/AbordajePage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import UsersPage from "../features/users/pages/UsersPage";
import RolesPage from "../features/roles/pages/RolesPage";
import PermissionsPage from "../features/permissions/pages/PermissionsPage";
import RolePermissionsPage from "../features/role-permission/pages/RolePermissionsPage";
import UserRolesPage from "../features/user-role/pages/UserRolesPage";
import ProfilesPage from "../features/profiles/pages/ProfilesPage";
import SessionsPage from "../features/sessions/pages/SessionsPage";
import AccountSettingsPage from "../features/account/pages/AccountSettingsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/auth/google/complete-profile",
    element: <GoogleCompleteProfilePage />,
  },
  { path: "/auth/github/callback", element: <GithubCallbackPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },

  { path: "/", element: <RootRedirect /> },

  {
    path: "/app-selection",
    element: (
      <AdminRoute>
        <AppSelectionPage />
      </AdminRoute>
    ),
  },

  {
    path: "/negocio",
    element: (
      <PrivateRoute>
        <NegocioLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <NegocioHomePage /> },
      {
        path: "incidentes/reportar",
        element: (
          <RoleRoute allow={[...ROLES_ADMIN, ROL_CONDUCTOR]}>
            <ReporteRapidoPage />
          </RoleRoute>
        ),
      },
      {
        path: "incidentes/bus",
        element: (
          <RoleRoute allow={ROLES_GESTION}>
            <IncidentesPorBusPage />
          </RoleRoute>
        ),
      },
      {
        path: "recargas/nueva",
        element: (
          <RoleRoute allow={[ROL_ADMIN_SISTEMA, ROL_CIUDADANO]}>
            <RecargarTarjetaPage />
          </RoleRoute>
        ),
      },
      {
        path: "boletos/abordaje",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO]}>
            <AbordajePage />
          </RoleRoute>
        ),
      },
      {
        path: "reportes/ingresos",
        element: (
          <RoleRoute allow={ROLES_GESTION}>
            <IngresosPorMetodoPagoPage />
          </RoleRoute>
        ),
      },
      {
        path: "reportes/distribucion-etaria",
        element: (
          <RoleRoute allow={ROLES_GESTION}>
            <DistribucionEtariaPage />
          </RoleRoute>
        ),
      },
      {
        path: "reportes/tendencia-incidentes",
        element: (
          <RoleRoute allow={ROLES_GESTION}>
            <TendenciaIncidentesPage />
          </RoleRoute>
        ),
      },
      { path: "rutas", element: <RutasPage /> },
      { path: "paraderos/cercanos", element: <ParaderosCercanosPage /> },
      {
        path: "paraderos",
        element: (
          <RoleRoute allow={ROLES_ADMIN}>
            <ParaderosPage />
          </RoleRoute>
        ),
      },
    ],
  },

  {
    path: "/seguridad",
    element: (
      <AdminRoute>
        <MainLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "roles", element: <RolesPage /> },
      { path: "permissions", element: <PermissionsPage /> },
      { path: "role-permission", element: <RolePermissionsPage /> },
      { path: "user-role", element: <UserRolesPage /> },
      { path: "profiles", element: <ProfilesPage /> },
      { path: "sessions", element: <SessionsPage /> },
      { path: "account", element: <AccountSettingsPage /> },
    ],
  },
]);
