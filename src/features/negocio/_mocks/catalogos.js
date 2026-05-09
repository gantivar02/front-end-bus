export const TIPOS_INCIDENTE = [
  { value: "mecanico", label: "Mecánico", icon: "build" },
  { value: "accidente", label: "Accidente", icon: "car_crash" },
  { value: "retraso", label: "Retraso", icon: "schedule" },
  {
    value: "problema_pasajero",
    label: "Problema con pasajero",
    icon: "person_alert",
  },
  { value: "otro", label: "Otro", icon: "help" },
];

export const TIPO_INCIDENTE_ICON = Object.fromEntries(
  TIPOS_INCIDENTE.map((t) => [t.value, t.icon]),
);

export const TIPO_INCIDENTE_LABEL = Object.fromEntries(
  TIPOS_INCIDENTE.map((t) => [t.value, t.label]),
);

export const GRAVEDADES = [
  { value: "bajo", label: "Bajo", icon: "sentiment_satisfied", tone: "success" },
  { value: "medio", label: "Medio", icon: "warning", tone: "warning" },
  { value: "alto", label: "Alto", icon: "priority_high", tone: "danger" },
  { value: "critico", label: "Crítico", icon: "crisis_alert", tone: "danger" },
];

export const ESTADOS_INCIDENTE = [
  { value: "pendiente", label: "Pendiente", tone: "danger", icon: "error" },
  {
    value: "en_revision",
    label: "En revisión",
    tone: "warning",
    icon: "autorenew",
  },
  {
    value: "resuelto",
    label: "Resuelto",
    tone: "success",
    icon: "check_circle",
  },
];

export const ESTADOS_RECARGA = {
  pendiente: { label: "Pendiente", tone: "warning", icon: "hourglass_top" },
  aprobada: { label: "Aprobada", tone: "success", icon: "check_circle" },
  rechazada: { label: "Rechazada", tone: "danger", icon: "cancel" },
  fallida: { label: "Fallida", tone: "danger", icon: "error" },
};

const MS_PAGO_ICON = {
  nequi: "smartphone",
  daviplata: "smartphone",
  pse: "account_balance",
  tarjeta_credito: "credit_card",
  tarjeta_debito: "credit_card",
  efecty: "payments",
};

const MS_PAGO_TONE = {
  nequi: "primary",
  daviplata: "secondary",
  pse: "secondary",
  tarjeta_credito: "tertiary",
  tarjeta_debito: "primary",
  efecty: "tertiary",
};

export function iconoMetodoPago(tipo) {
  if (!tipo) return "payments";
  return MS_PAGO_ICON[tipo.toLowerCase()] ?? "payments";
}

export function toneMetodoPago(tipo) {
  if (!tipo) return "primary";
  return MS_PAGO_TONE[tipo.toLowerCase()] ?? "primary";
}

export const MONTOS_PREDEFINIDOS = [10000, 20000, 50000, 100000];
