import negocioApi from "../../../services/negocioApi";

export async function getClimaPerfi() {
  const { data } = await negocioApi.get("/clima-alerta/mi-perfil");
  return data;
}

export async function updateClimaPerfil(payload) {
  const { data } = await negocioApi.patch("/clima-alerta/mi-perfil", payload);
  return data;
}

export async function testEnvioClima() {
  const { data } = await negocioApi.post("/clima-alerta/test-envio-propio");
  return data;
}
