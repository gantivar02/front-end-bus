import negocioApi from "../../../services/negocioApi";

export async function listTurnos() {
  const { data } = await negocioApi.get("/turnos");
  return data;
}

export async function createTurno(payload) {
  const { data } = await negocioApi.post("/turnos", payload);
  return data;
}

export async function updateTurno(id, payload) {
  const { data } = await negocioApi.patch(`/turnos/${id}`, payload);
  return data;
}

export async function deleteTurno(id) {
  await negocioApi.delete(`/turnos/${id}`);
}

export async function getMiTurnoActual() {
  const { data } = await negocioApi.get("/turnos/mi-turno-actual");
  return data;
}

export async function iniciarMiTurno(payload) {
  const { data } = await negocioApi.post("/turnos/iniciar", payload);
  return data;
}
