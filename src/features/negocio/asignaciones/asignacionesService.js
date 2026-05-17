import negocioApi from "../../../services/negocioApi";

export async function listAsignaciones() {
  const { data } = await negocioApi.get("/conductor-bus");
  return data;
}

export async function createAsignacion(payload) {
  const { data } = await negocioApi.post("/conductor-bus", payload);
  return data;
}

export async function deleteAsignacion(id) {
  await negocioApi.delete(`/conductor-bus/${id}`);
}
