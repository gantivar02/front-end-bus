import negocioApi from "../../../services/negocioApi";

export async function abordarBus(payload) {
  const { data } = await negocioApi.post("/boletos/abordaje", payload);
  return data;
}
