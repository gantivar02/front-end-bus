import NegStatusBadge from "../../../../components/negocio/NegStatusBadge";
import { relativeFromNow } from "../../_utils/format";
import {
  TIPO_INCIDENTE_ICON,
  TIPO_INCIDENTE_LABEL,
} from "../../_mocks/catalogos";

export default function IncidenteCard({ incidente, active, onClick }) {
  const nombreConductor = incidente.conductor
    ? `${incidente.conductor.nombre} ${incidente.conductor.apellido}`.trim()
    : "Sin conductor";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-colors ${
        active
          ? "border-neg-primary bg-neg-primary-container/30"
          : "border-neg-outline-variant bg-neg-surface-container-lowest hover:border-neg-outline"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-neg-surface-container-high text-neg-on-surface-variant flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined">
            {TIPO_INCIDENTE_ICON[incidente.tipo] ?? "help"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-mono text-neg-on-surface-variant">
              #{incidente.id}
            </p>
            <NegStatusBadge value={incidente.estado} />
          </div>
          <p className="mt-1 font-semibold text-neg-on-surface truncate">
            {TIPO_INCIDENTE_LABEL[incidente.tipo] ?? "Incidente"}
          </p>
          <p className="text-xs text-neg-on-surface-variant line-clamp-2 mt-0.5">
            {incidente.descripcion || "(sin descripción)"}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-neg-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">
                schedule
              </span>
              {relativeFromNow(incidente.fecha)}
            </span>
            <span className="inline-flex items-center gap-1 truncate">
              <span className="material-symbols-outlined text-[13px]">
                person
              </span>
              <span className="truncate">{nombreConductor}</span>
            </span>
            <NegStatusBadge kind="gravedad" value={incidente.gravedad} />
          </div>
        </div>
      </div>
    </button>
  );
}
