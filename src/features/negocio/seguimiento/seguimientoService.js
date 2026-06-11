import negocioApi from "../../../services/negocioApi";

export async function listRutas() {
  const { data } = await negocioApi.get("/rutas");
  return data;
}

export async function listParaderosPorRuta(rutaId) {
  const { data } = await negocioApi.get(`/ruta-paradero/ruta/${rutaId}`);
  return data;
}

export async function getSeguimiento(rutaId, paraderoId) {
  const url = paraderoId
    ? `/gps/ruta/${rutaId}?paradero_id=${paraderoId}`
    : `/gps/ruta/${rutaId}`;
  const { data } = await negocioApi.get(url);
  return data;
}
