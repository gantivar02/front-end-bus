import { useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import NegAvatar from "../../negocio/NegAvatar";

const breadcrumbLabels = {
  "/negocio": "Inicio",
  "/negocio/incidentes/reportar": "Reporte rápido",
  "/negocio/incidentes/bus": "Gestión por bus",
  "/negocio/recargas/nueva": "Nueva recarga",
  "/negocio/reportes/ingresos": "Ingresos por método",
  "/negocio/reportes/distribucion-etaria": "Distribución etaria",
  "/negocio/reportes/tendencia-incidentes": "Tendencia incidentes",
};

const sectionLabels = [
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
  const { user } = useAuth();
  const label = breadcrumbLabels[pathname] ?? "Negocio";
  const section = resolveSection(pathname);

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
          className="p-2 text-neg-on-surface-variant hover:bg-neg-surface-container-high rounded-full transition-colors"
          aria-label="Notificaciones"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <NegAvatar name={user?.name ?? "Usuario"} size="sm" />
      </div>
    </header>
  );
}
