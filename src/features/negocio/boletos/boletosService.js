import negocioApi from "../../../services/negocioApi";

export async function abordarBus(payload) {
  const { data } = await negocioApi.post("/boletos/abordaje", payload);
  return data;
}

export async function registrarDescenso(payload) {
  const { data } = await negocioApi.post("/boletos/descenso", payload);
  return data;
}

export async function listMisViajes() {
  const { data } = await negocioApi.get("/boletos/mis-viajes");
  return data;
}

export async function listMisBoletos({
  fecha_desde,
  fecha_hasta,
  activos,
  vencidos,
} = {}) {
  const params = {};
  if (fecha_desde) params.fecha_desde = fecha_desde;
  if (fecha_hasta) params.fecha_hasta = fecha_hasta;
  if (activos != null) params.activos = String(activos);
  if (vencidos != null) params.vencidos = String(vencidos);
  const { data } = await negocioApi.get("/boletos/mis-boletos", { params });
  return data;
}

export async function getMiViajeDetalle(id) {
  const { data } = await negocioApi.get(`/boletos/mis-viajes/${id}`);
  return data;
}
