import negocioApi from "../../../services/negocioApi";

export async function searchPersonas(q) {
  const { data } = await negocioApi.get("/personas/search", {
    params: { q },
  });
  return Array.isArray(data) ? data : [];
}

export async function listInbox(filters = {}) {
  const params = {};
  if (filters.tipo) params.tipo = filters.tipo;
  if (filters.soloNoLeidos) params.soloNoLeidos = "true";
  if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
  if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;

  const { data } = await negocioApi.get("/mensajes/bandeja", { params });
  return Array.isArray(data) ? data : [];
}

export async function listSent() {
  const { data } = await negocioApi.get("/mensajes/enviados");
  return Array.isArray(data) ? data : [];
}

export async function getMessageDetail(id) {
  const { data } = await negocioApi.get(`/mensajes/${id}/detalle`);
  return data;
}

export async function getUnreadCount() {
  const { data } = await negocioApi.get("/mensajes/no-leidos/count");
  return data?.total ?? 0;
}

export async function sendDirectMessage(payload) {
  const { data } = await negocioApi.post("/mensajes/directo", payload);
  return data;
}

export async function sendGroupMessage(payload) {
  const { data } = await negocioApi.post("/mensajes/grupal", payload);
  return Array.isArray(data) ? data : [];
}

export async function listMyGroups() {
  const { data } = await negocioApi.get("/grupo-persona/mis-grupos");
  return Array.isArray(data) ? data : [];
}

export async function deleteGroupMessage(grupoId, mensajeId) {
  await negocioApi.delete(`/mensajes/grupo/${grupoId}/${mensajeId}`);
}
