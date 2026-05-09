const ESTADO_INCIDENTE = {
  pendiente: { label: "Pendiente", tone: "danger", icon: "error" },
  en_revision: { label: "En revisión", tone: "warning", icon: "autorenew" },
  resuelto: { label: "Resuelto", tone: "success", icon: "check_circle" },
};

const GRAVEDAD = {
  bajo: { label: "Bajo", tone: "success", icon: "sentiment_satisfied" },
  medio: { label: "Medio", tone: "warning", icon: "warning" },
  alto: { label: "Alto", tone: "danger", icon: "priority_high" },
  critico: { label: "Crítico", tone: "danger", icon: "crisis_alert" },
};

const ESTADO_RECARGA = {
  pendiente: { label: "Pendiente", tone: "warning", icon: "hourglass_top" },
  aprobada: { label: "Aprobada", tone: "success", icon: "check_circle" },
  rechazada: { label: "Rechazada", tone: "danger", icon: "cancel" },
  fallida: { label: "Fallida", tone: "danger", icon: "error" },
};

const KINDS = {
  estado: ESTADO_INCIDENTE,
  gravedad: GRAVEDAD,
  recarga: ESTADO_RECARGA,
};

const TONES = {
  success: "bg-neg-primary-container text-neg-on-primary-container",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-neg-error-container text-neg-on-error-container",
  neutral: "bg-neg-surface-container-high text-neg-on-surface-variant",
};

export default function NegStatusBadge({ kind = "estado", value }) {
  const dict = KINDS[kind] ?? ESTADO_INCIDENTE;
  const cfg = dict[value] ?? {
    label: value ?? "—",
    tone: "neutral",
    icon: "help",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] font-bold uppercase tracking-wide ${TONES[cfg.tone]}`}
    >
      <span className="material-symbols-outlined text-[13px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
