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

export async function getMiViajeDetalle(id) {
  const { data } = await negocioApi.get(`/boletos/mis-viajes/${id}`);
  return data;
}
