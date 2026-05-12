import negocioApi from "../../../services/negocioApi";

export async function listBuses() {
  const { data } = await negocioApi.get("/buses");
  return data;
}

export async function createBus(formData) {
  const { data } = await negocioApi.post("/buses", formData);
  return data;
}

export async function updateBus(id, formData) {
  const { data } = await negocioApi.patch(`/buses/${id}`, formData);
  return data;
}

export async function deleteBus(id) {
  await negocioApi.delete(`/buses/${id}`);
}

export async function listEmpresas() {
  const { data } = await negocioApi.get("/empresas");
  return data;
}
