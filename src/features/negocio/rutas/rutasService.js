import negocioApi from "../../../services/negocioApi";

export async function listRutas({ nombre } = {}) {
  const params = {};
  if (nombre) params.nombre = nombre;
  const { data } = await negocioApi.get("/rutas", { params });
  return data;
}

export async function getRuta(id) {
  const { data } = await negocioApi.get(`/rutas/${id}`);
  return data;
}

export async function createRutaConParaderos(payload) {
  const { data } = await negocioApi.post("/rutas/con-paraderos", payload);
  return data;
}

export async function updateRuta(id, payload) {
  const { data } = await negocioApi.patch(`/rutas/${id}`, payload);
  return data;
}

export async function deleteRuta(id) {
  const { data } = await negocioApi.delete(`/rutas/${id}`);
  return data;
}

export async function listParaderos() {
  const { data } = await negocioApi.get("/paraderos");
  return data;
}

export async function getRutaParaMapa(id) {
  const { data } = await negocioApi.get(`/rutas/${id}/mapa`);
  return data;
}
