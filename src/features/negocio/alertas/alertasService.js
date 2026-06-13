import negocioApi from "../../../services/negocioApi";

/**
 * POST /alertas-masivas/vista-previa
 * Calcula cuantos destinatarios alcanzaria una alerta antes de crearla.
 */
export async function vistaPreviaAlcance({ alcance, ruta_id, ciudad }) {
  const payload = { alcance };
  if (ruta_id != null) payload.ruta_id = ruta_id;
  if (ciudad) payload.ciudad = ciudad;
  const { data } = await negocioApi.post(
    "/alertas-masivas/vista-previa",
    payload,
  );
  return data;
}

/**
 * POST /alertas-masivas/redactar
 * Pide a LangChain (Gemini) que reescriba el borrador del admin con tono
 * profesional. Si urgente = true, agrega enfasis.
 */
export async function redactarConIA({ borrador, urgente }) {
  const { data } = await negocioApi.post("/alertas-masivas/redactar", {
    borrador,
    urgente: !!urgente,
  });
  return data;
}

/**
 * POST /alertas-masivas
 * Crea la alerta. Si se envia programada_para con fecha futura, queda en
 * estado "programada"; en cualquier otro caso se envia al instante.
 */
export async function crearAlertaMasiva(payload) {
  const { data } = await negocioApi.post("/alertas-masivas", payload);
  return data;
}

/**
 * GET /alertas-masivas/mis-enviadas
 * Lista las alertas creadas por el admin autenticado con estadisticas.
 */
export async function listMisAlertasEnviadas() {
  const { data } = await negocioApi.get("/alertas-masivas/mis-enviadas");
  return data;
}

/**
 * GET /alertas-masivas/:id
 * Detalle + estadisticas de una alerta. Solo el creador.
 */
export async function getAlertaDetalle(id) {
  const { data } = await negocioApi.get(`/alertas-masivas/${id}`);
  return data;
}

/**
 * GET /alertas-masivas/mis-notificaciones
 * Bandeja del ciudadano: alertas masivas dirigidas a el.
 */
export async function listMisNotificaciones() {
  const { data } = await negocioApi.get(
    "/alertas-masivas/mis-notificaciones",
  );
  return data;
}

/**
 * PATCH /alertas-masivas/mis-notificaciones/:destinatarioId/leida
 * Marca como leida una notificacion del ciudadano.
 */
export async function marcarNotificacionLeida(destinatarioId) {
  const { data } = await negocioApi.patch(
    `/alertas-masivas/mis-notificaciones/${destinatarioId}/leida`,
  );
  return data;
}
