import negocioApi from "../../../services/negocioApi";

export async function listParaderos() {
  const { data } = await negocioApi.get("/paraderos");
  return data;
}

export async function listParaderosCercanos({
  latitud,
  longitud,
  limite = 5,
}) {
  const { data } = await negocioApi.get("/paraderos/cercanos", {
    params: { latitud, longitud, limite },
  });
  return data;
}

export async function createParadero(payload) {
  const { data } = await negocioApi.post("/paraderos", payload);
  return data;
}

export async function updateParadero(id, payload) {
  const { data } = await negocioApi.patch(`/paraderos/${id}`, payload);
  return data;
}

export async function deleteParadero(id) {
  await negocioApi.delete(`/paraderos/${id}`);
}
