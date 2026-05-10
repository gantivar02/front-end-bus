import negocioApi from "../../../services/negocioApi";

export async function reporteRapidoIncidente({
  conductor_id,
  bus_id,
  tipo,
  gravedad,
  descripcion,
  latitud,
  longitud,
  fotos = [],
}) {
  const form = new FormData();
  if (conductor_id != null) form.append("conductor_id", String(conductor_id));
  form.append("bus_id", String(bus_id));
  form.append("tipo", tipo);
  form.append("gravedad", gravedad);
  if (descripcion) form.append("descripcion", descripcion);
  form.append("latitud", String(latitud));
  form.append("longitud", String(longitud));
  for (const file of fotos) form.append("fotos", file);

  const { data } = await negocioApi.post("/incidentes/reporte-rapido", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listarIncidentesPorBus(busId, { tipo, estado } = {}) {
  const params = {};
  if (tipo) params.tipo = tipo;
  if (estado) params.estado = estado;
  const { data } = await negocioApi.get(`/incidentes/bus/${busId}`, { params });
  return data;
}

export async function estadisticaBus(busId) {
  const { data } = await negocioApi.get(`/incidentes/bus/${busId}/estadistica`);
  return data;
}

export async function cambiarEstadoIncidente(id, estado) {
  const { data } = await negocioApi.patch(`/incidentes/${id}/estado`, {
    estado,
  });
  return data;
}

export async function obtenerIncidente(id) {
  const { data } = await negocioApi.get(`/incidentes/${id}`);
  return data;
}

export async function tendenciaMensual({ desde, hasta, empresa_id } = {}) {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  if (empresa_id != null) params.empresa_id = empresa_id;
  const { data } = await negocioApi.get("/incidentes/reportes/tendencia-mensual", {
    params,
  });
  return data;
}
