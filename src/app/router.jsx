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
import OAuthCompleteProfilePage from "../features/auth/pages/OAuthCompleteProfilePage";
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
import DescensoPage from "../features/negocio/boletos/pages/DescensoPage";
import HistorialViajesPage from "../features/negocio/boletos/pages/HistorialViajesPage";
import MisBoletosPage from "../features/negocio/boletos/pages/MisBoletosPage";
import InicioTurnoPage from "../features/negocio/turnos/pages/InicioTurnoPage";
import TurnosPage from "../features/negocio/turnos/pages/TurnosPage";
import AsignacionesPage from "../features/negocio/asignaciones/pages/AsignacionesPage";
import ConductoresPage from "../features/negocio/conductores/pages/ConductoresPage";
import ProgramacionesPage from "../features/negocio/programaciones/pages/ProgramacionesPage";
import BusesPage from "../features/negocio/buses/pages/BusesPage";
import SeguimientoPage from "../features/negocio/seguimiento/pages/SeguimientoPage";
import PanelControlPage from "../features/negocio/panel/pages/PanelControlPage";
import NotificacionBusPage from "../features/negocio/alertas-bus/pages/NotificacionBusPage";
import PerfilClimaPage from "../features/negocio/clima/pages/PerfilClimaPage";
import MisGruposPage from "../features/negocio/grupos/pages/MisGruposPage";
import GruposPublicosPage from "../features/negocio/grupos/pages/GruposPublicosPage";
import AdministrarGrupoPage from "../features/negocio/grupos/pages/AdministrarGrupoPage";
import CrearAlertaPage from "../features/negocio/alertas/pages/CrearAlertaPage";
import MisAlertasEnviadasPage from "../features/negocio/alertas/pages/MisAlertasEnviadasPage";
import MisNotificacionesPage from "../features/negocio/alertas/pages/MisNotificacionesPage";
import MensajeriaPage from "../features/negocio/mensajeria/pages/MensajeriaPage";
import AgendarCitaPage from "../features/negocio/citas/pages/AgendarCitaPage";
import MisCitasPage from "../features/negocio/citas/pages/MisCitasPage";
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
    path: "/auth/oauth/complete-profile",
    element: <OAuthCompleteProfilePage />,
  },
  // Compat: rutas viejas por proveedor mantenidas como alias.
  {
    path: "/auth/google/complete-profile",
    element: <OAuthCompleteProfilePage />,
  },
  {
    path: "/auth/github/complete-profile",
    element: <OAuthCompleteProfilePage />,
  },
  {
    path: "/auth/microsoft/complete-profile",
    element: <OAuthCompleteProfilePage />,
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
        path: "boletos/descenso",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO]}>
            <DescensoPage />
          </RoleRoute>
        ),
      },
      {
        path: "boletos/historial",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO]}>
            <HistorialViajesPage />
          </RoleRoute>
        ),
      },
      {
        path: "boletos/mios",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO]}>
            <MisBoletosPage />
          </RoleRoute>
        ),
      },
      {
        path: "grupos/mios",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO, ROL_CONDUCTOR]}>
            <MisGruposPage />
          </RoleRoute>
        ),
      },
      {
        path: "grupos/publicos",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO, ROL_CONDUCTOR]}>
            <GruposPublicosPage />
          </RoleRoute>
        ),
      },
      {
        path: "grupos/:grupoId/administrar",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO, ROL_CONDUCTOR]}>
            <AdministrarGrupoPage />
          </RoleRoute>
        ),
      },
      {
        path: "alertas/nueva",
        element: (
          <RoleRoute allow={ROLES_ADMIN}>
            <CrearAlertaPage />
          </RoleRoute>
        ),
      },
      {
        path: "alertas/mis-enviadas",
        element: (
          <RoleRoute allow={ROLES_ADMIN}>
            <MisAlertasEnviadasPage />
          </RoleRoute>
        ),
      },
      {
        path: "notificaciones",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO, ROL_CONDUCTOR]}>
            <MisNotificacionesPage />
          </RoleRoute>
        ),
      },
      {
        path: "mensajes",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO, ROL_CONDUCTOR]}>
            <MensajeriaPage />
          </RoleRoute>
        ),
      },
      {
        path: "citas/agendar",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO, ROL_CONDUCTOR]}>
            <AgendarCitaPage />
          </RoleRoute>
        ),
      },
      {
        path: "citas/mis-citas",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO, ROL_CONDUCTOR]}>
            <MisCitasPage />
          </RoleRoute>
        ),
      },
      {
        path: "turnos/inicio",
        element: (
          <RoleRoute allow={[ROL_CONDUCTOR]}>
            <InicioTurnoPage />
          </RoleRoute>
        ),
      },
      {
        path: "turnos",
        element: (
          <RoleRoute allow={ROLES_ADMIN}>
            <TurnosPage />
          </RoleRoute>
        ),
      },
      {
        path: "asignaciones",
        element: (
          <RoleRoute allow={ROLES_ADMIN}>
            <AsignacionesPage />
          </RoleRoute>
        ),
      },
      {
        path: "conductores",
        element: (
          <RoleRoute allow={ROLES_ADMIN}>
            <ConductoresPage />
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
      { path: "seguimiento", element: <SeguimientoPage /> },
      {
        path: "alertas-bus",
        element: (
          <RoleRoute allow={[ROL_CIUDADANO]}>
            <NotificacionBusPage />
          </RoleRoute>
        ),
      },
      { path: "clima", element: <PerfilClimaPage /> },
      {
        path: "panel",
        element: (
          <RoleRoute allow={ROLES_GESTION}>
            <PanelControlPage />
          </RoleRoute>
        ),
      },
      {
        path: "buses",
        element: (
          <RoleRoute allow={ROLES_ADMIN}>
            <BusesPage />
          </RoleRoute>
        ),
      },
      {
        path: "programaciones",
        element: (
          <RoleRoute allow={ROLES_ADMIN}>
            <ProgramacionesPage />
          </RoleRoute>
        ),
      },
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
