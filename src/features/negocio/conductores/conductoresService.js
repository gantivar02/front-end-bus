import negocioApi from "../../../services/negocioApi";

export async function listConductoresAdmin() {
  const { data } = await negocioApi.get("/conductores");
  return data;
}

export async function getConductor(id) {
  const { data } = await negocioApi.get(`/conductores/${id}`);
  return data;
}

export async function updateConductor(id, payload) {
  const { data } = await negocioApi.patch(`/conductores/${id}`, payload);
  return data;
}

export async function deleteConductor(id) {
  await negocioApi.delete(`/conductores/${id}`);
}

export async function listEmpresas() {
  const { data } = await negocioApi.get("/empresas");
  return data;
}
