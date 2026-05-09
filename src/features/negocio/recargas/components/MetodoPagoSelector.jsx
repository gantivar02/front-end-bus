import { iconoMetodoPago, toneMetodoPago } from "../../_mocks/catalogos";
import { formatCurrency } from "../../_utils/format";

const TONES = {
  primary: "bg-neg-primary text-neg-on-primary",
  secondary: "bg-neg-secondary text-neg-on-secondary",
  tertiary: "bg-neg-tertiary text-neg-on-tertiary",
};

function nombreCiudadano(mpc) {
  const persona = mpc?.ciudadano?.persona;
  if (!persona) return `Ciudadano #${mpc?.ciudadano_id ?? "?"}`;
  return `${persona.nombre ?? ""} ${persona.apellido ?? ""}`.trim();
}

export default function MetodoPagoSelector({ value, onChange, options = [] }) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-neg-on-surface-variant">
        No hay métodos de pago registrados.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((mpc) => {
        const tipo = mpc.metodoPago?.tipo ?? "desconocido";
        const icono = iconoMetodoPago(tipo);
        const tone = toneMetodoPago(tipo);
        const active = value === mpc.id;
        return (
          <button
            key={mpc.id}
            type="button"
            onClick={() => onChange?.(mpc.id)}
            disabled={!mpc.activo}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors text-left ${
              active
                ? "border-neg-primary bg-neg-primary-container/40"
                : "border-neg-outline-variant bg-neg-surface-container-lowest hover:border-neg-outline"
            } ${!mpc.activo ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${TONES[tone] ?? TONES.primary}`}
            >
              <span className="material-symbols-outlined">{icono}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neg-on-surface truncate">
                {nombreCiudadano(mpc)}
              </p>
              <p className="text-[11px] text-neg-on-surface-variant capitalize truncate">
                {tipo.replaceAll("_", " ")} · Saldo{" "}
                {formatCurrency(Number(mpc.saldo_actual))}
              </p>
            </div>
            {active && (
              <span className="material-symbols-outlined text-neg-primary">
                check_circle
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
