import negocioApi from "../../../services/negocioApi";

export async function suscribir(ruta_id, paradero_id, minutos_anticipacion) {
  const { data } = await negocioApi.post("/alertas-bus", {
    ruta_id,
    paradero_id,
    minutos_anticipacion,
  });
  return data;
}

export async function getMisAlertas() {
  const { data } = await negocioApi.get("/alertas-bus/mias");
  return data;
}

export async function cancelarAlerta(id) {
  await negocioApi.delete(`/alertas-bus/${id}`);
}

export async function marcarVista(id) {
  const { data } = await negocioApi.patch(`/alertas-bus/${id}/vista`);
  return data;
}
