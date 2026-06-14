import { NavLink, useNavigate } from "react-router-dom";
import {
  useAuth,
  ROL_ADMIN_SISTEMA,
  ROL_ADMIN_EMPRESA,
  ROL_SUPERVISOR,
  ROL_CONDUCTOR,
  ROL_CIUDADANO,
} from "../../../context/AuthContext";

const ROLES_GESTION = [ROL_ADMIN_SISTEMA, ROL_ADMIN_EMPRESA, ROL_SUPERVISOR];
const ROLES_ADMIN = [ROL_ADMIN_SISTEMA, ROL_ADMIN_EMPRESA];

const navGroups = [
  {
    title: "General",
    items: [
      {
        to: "/negocio",
        icon: "dashboard",
        label: "Inicio",
        end: true,
        // Inicio visible para todos los roles autenticados
      },
    ],
  },
  {
    title: "Incidentes",
    items: [
      {
        to: "/negocio/incidentes/reportar",
        icon: "report",
        label: "Reporte rápido",
        roles: [...ROLES_ADMIN, ROL_CONDUCTOR],
      },
      {
        to: "/negocio/incidentes/bus",
        icon: "directions_bus",
        label: "Gestión por bus",
        roles: ROLES_GESTION,
      },
    ],
  },
  {
    title: "Recargas",
    items: [
      {
        to: "/negocio/recargas/nueva",
        icon: "credit_card",
        label: "Nueva recarga",
        roles: [ROL_ADMIN_SISTEMA, ROL_CIUDADANO],
      },
    ],
  },
  {
    title: "Uso del servicio",
    items: [
      {
        to: "/negocio/boletos/abordaje",
        icon: "confirmation_number",
        label: "Abordar bus",
        roles: [ROL_CIUDADANO],
      },
      {
        to: "/negocio/boletos/descenso",
        icon: "logout",
        label: "Descender bus",
        roles: [ROL_CIUDADANO],
      },
      {
        to: "/negocio/boletos/mios",
        icon: "confirmation_number",
        label: "Mis boletos",
        roles: [ROL_CIUDADANO],
      },
      {
        to: "/negocio/boletos/historial",
        icon: "history",
        label: "Historial de viajes",
        roles: [ROL_CIUDADANO],
      },
    ],
  },
  {
    title: "Conductores y turnos",
    items: [
      {
        to: "/negocio/turnos",
        icon: "calendar_month",
        label: "Gestionar turnos",
        roles: ROLES_ADMIN,
      },
      {
        to: "/negocio/conductores",
        icon: "badge",
        label: "Gestión conductores",
        roles: ROLES_ADMIN,
      },
      {
        to: "/negocio/asignaciones",
        icon: "link",
        label: "Asignar buses",
        roles: ROLES_ADMIN,
      },
      {
        to: "/negocio/turnos/inicio",
        icon: "play_circle",
        label: "Iniciar turno",
        roles: [ROL_CONDUCTOR],
      },
    ],
  },
  {
    title: "Monitoreo",
    items: [
      {
        to: "/negocio/seguimiento",
        icon: "location_on",
        label: "Seguimiento en vivo",
      },
      {
        to: "/negocio/panel",
        icon: "monitor_heart",
        label: "Panel de control",
        roles: ROLES_GESTION,
      },
    ],
  },
  {
    title: "Rutas y Paraderos",
    items: [
      {
        to: "/negocio/rutas",
        icon: "route",
        label: "Rutas disponibles",
      },
      {
        to: "/negocio/paraderos/cercanos",
        icon: "near_me",
        label: "Paraderos cercanos",
      },
      {
        to: "/negocio/paraderos",
        icon: "add_location",
        label: "Administrar paraderos",
        roles: ROLES_ADMIN,
      },
    ],
  },
  {
    title: "Flota",
    items: [
      {
        to: "/negocio/buses",
        icon: "directions_bus",
        label: "Gestión de buses",
        roles: ROLES_ADMIN,
      },
    ],
  },
  {
    title: "Programación",
    items: [
      {
        to: "/negocio/programaciones",
        icon: "calendar_month",
        label: "Programar rutas",
        roles: ROLES_ADMIN,
      },
    ],
  },
  {
    title: "Reportes",
    items: [
      {
        to: "/negocio/reportes/ingresos",
        icon: "paid",
        label: "Ingresos por método",
        roles: ROLES_GESTION,
      },
      {
        to: "/negocio/reportes/distribucion-etaria",
        icon: "groups",
        label: "Distribución etaria",
        roles: ROLES_GESTION,
      },
      {
        to: "/negocio/reportes/tendencia-incidentes",
        icon: "trending_up",
        label: "Tendencia incidentes",
        roles: ROLES_GESTION,
      },
    ],
  },
];

export default function NegocioSidebar() {
  const { logout, isAdmin, hasAnyRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || hasAnyRole(item.roles),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-neg-surface-container-low flex flex-col py-6 px-4 z-50">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neg-primary-container flex items-center justify-center">
            <span
              className="material-symbols-outlined text-neg-on-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_bus
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-neg-on-surface font-headline leading-tight">
              JAP Team
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-neg-on-surface-variant font-semibold">
              Buses Inteligentes
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[10px] uppercase tracking-widest font-bold text-neg-on-surface-variant/80">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, icon, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      isActive
                        ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neg-primary-container text-neg-on-primary-container font-semibold transition-colors"
                        : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-neg-on-surface-variant hover:text-neg-on-surface hover:bg-neg-surface-container transition-colors"
                    }
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {icon}
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-neg-outline-variant space-y-1">
        {isAdmin && (
          <button
            onClick={() => navigate("/app-selection")}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-neg-on-surface-variant hover:text-neg-on-surface hover:bg-neg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">apps</span>
            <span className="text-sm font-medium">Volver al selector</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-neg-on-surface-variant hover:text-neg-error hover:bg-neg-error-container/60 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
