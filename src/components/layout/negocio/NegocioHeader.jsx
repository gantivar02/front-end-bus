import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import NegAvatar from "../../negocio/NegAvatar";
import { useMessageNotifications } from "../../../features/negocio/mensajeria/messageNotificationsContext";

const breadcrumbLabels = {
  "/negocio": "Inicio",
  "/negocio/incidentes/reportar": "Reporte rápido",
  "/negocio/incidentes/bus": "Gestión por bus",
  "/negocio/grupos/mios": "Mis grupos",
  "/negocio/grupos/publicos": "Grupos públicos",
  "/negocio/mensajes": "Mensajería",
  "/negocio/notificaciones": "Notificaciones",
  "/negocio/recargas/nueva": "Nueva recarga",
  "/negocio/reportes/ingresos": "Ingresos por método",
  "/negocio/reportes/distribucion-etaria": "Distribución etaria",
  "/negocio/reportes/tendencia-incidentes": "Tendencia incidentes",
};

const sectionLabels = [
  { prefix: "/negocio/mensajes", label: "Comunidad" },
  { prefix: "/negocio/notificaciones", label: "Comunidad" },
  { prefix: "/negocio/grupos", label: "Comunidad" },
  { prefix: "/negocio/incidentes", label: "Incidentes" },
  { prefix: "/negocio/recargas", label: "Recargas" },
  { prefix: "/negocio/reportes", label: "Reportes" },
];

function resolveSection(pathname) {
  return (
    sectionLabels.find((s) => pathname.startsWith(s.prefix))?.label ?? "Negocio"
  );
}

export default function NegocioHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount, isMessagingEnabled } = useMessageNotifications();
  const label = breadcrumbLabels[pathname] ?? "Negocio";
  const section = resolveSection(pathname);
  const unreadBadge = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 flex justify-between items-center px-8 bg-neg-surface/80 backdrop-blur-xl z-40 border-b border-neg-outline-variant/60">
      <nav className="flex items-center space-x-2 font-label text-[10px] uppercase tracking-wider text-neg-on-surface-variant">
        <span>{section}</span>
        <span className="material-symbols-outlined text-[12px]">
          chevron_right
        </span>
        <span className="text-neg-primary font-bold">{label}</span>
      </nav>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (isMessagingEnabled) {
              navigate("/negocio/mensajes");
            }
          }}
          className={`relative rounded-full p-2 transition-colors ${
            isMessagingEnabled
              ? "text-neg-on-surface-variant hover:bg-neg-surface-container-high"
              : "cursor-default text-neg-on-surface-variant/60"
          }`}
          aria-label={
            unreadCount > 0
              ? `Mensajes no leídos: ${unreadCount}`
              : "Mensajería"
          }
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings:
                unreadCount > 0 ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
            }}
          >
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-neg-primary px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-neg-on-primary shadow-sm">
              {unreadBadge}
            </span>
          )}
        </button>
        <NegAvatar name={user?.name ?? "Usuario"} size="sm" />
      </div>
    </header>
  );
}
