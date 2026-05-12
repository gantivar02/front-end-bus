import negocioApi from "../../../services/negocioApi";

export async function listBuses() {
  const { data } = await negocioApi.get("/buses");
  return data;
}

export async function getBus(id) {
  const { data } = await negocioApi.get(`/buses/${id}`);
  return data;
}

export async function listConductores() {
  const { data } = await negocioApi.get("/conductores");
  return data;
}

export async function getConductorMe() {
  const { data } = await negocioApi.get("/conductores/me");
  return data;
}

export async function getMisBuses() {
  const { data } = await negocioApi.get("/conductores/me/buses");
  return data;
}

export async function getBusesPorConductor(conductorId) {
  const { data } = await negocioApi.get(`/conductores/${conductorId}/buses`);
  return data;
}

export async function listRutas() {
  const { data } = await negocioApi.get("/rutas");
  return data;
}

export async function listMetodosPago() {
  const { data } = await negocioApi.get("/metodos-pago");
  return data;
}

export async function listMetodosPagoCiudadano() {
  const { data } = await negocioApi.get("/metodos-pago-ciudadano");
  return data;
}

export async function listMisMetodosPagoCiudadano() {
  const { data } = await negocioApi.get("/metodos-pago-ciudadano/mis-metodos");
  return data;
}

export async function getMetodoPagoCiudadano(id) {
  const { data } = await negocioApi.get(`/metodos-pago-ciudadano/${id}`);
  return data;
}
