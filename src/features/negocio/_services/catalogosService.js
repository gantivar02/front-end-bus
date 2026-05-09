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

export async function getMetodoPagoCiudadano(id) {
  const { data } = await negocioApi.get(`/metodos-pago-ciudadano/${id}`);
  return data;
}
