import negocioApi from "../../../services/negocioApi";

/**
 * GET /citas/disponibilidad?fecha=YYYY-MM-DD
 * Devuelve los slots libres del asesor para esa fecha (cruzando Google
 * Calendar con las citas ya reservadas en BD).
 */
export async function obtenerDisponibilidad(fechaIso) {
  const { data } = await negocioApi.get("/citas/disponibilidad", {
    params: { fecha: fechaIso },
  });
  return data;
}

/**
 * POST /citas/agendar
 * Agenda una cita. Si no envias tipo_consulta, el backend lo deduce con
 * LangChain a partir del motivo.
 */
export async function agendarCita(payload) {
  const { data } = await negocioApi.post("/citas/agendar", payload);
  return data;
}

/**
 * GET /citas/mis-citas
 * Lista las citas del ciudadano autenticado.
 */
export async function listMisCitas() {
  const { data } = await negocioApi.get("/citas/mis-citas");
  return data;
}

/**
 * POST /citas/mis-citas/:id/cancelar
 * Cancela una cita del ciudadano. Elimina tambien el evento en Google
 * Calendar para notificar al asesor.
 */
export async function cancelarMiCita(citaId) {
  const { data } = await negocioApi.post(
    `/citas/mis-citas/${citaId}/cancelar`,
  );
  return data;
}
