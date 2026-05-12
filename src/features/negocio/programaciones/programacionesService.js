import negocioApi from "../../../services/negocioApi";

export async function listProgramaciones() {
  const { data } = await negocioApi.get("/programaciones");
  return data;
}

export async function createProgramacion(payload) {
  const { data } = await negocioApi.post("/programaciones", payload);
  return data;
}

export async function updateProgramacion(id, payload) {
  const { data } = await negocioApi.patch(`/programaciones/${id}`, payload);
  return data;
}

export async function deleteProgramacion(id) {
  await negocioApi.delete(`/programaciones/${id}`);
}

export async function listBuses() {
  const { data } = await negocioApi.get("/buses");
  return data;
}

export async function listRutas() {
  const { data } = await negocioApi.get("/rutas");
  return data;
}
