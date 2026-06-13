import negocioApi from "../../../services/negocioApi";

/**
 * GET /grupo-persona/mis-grupos
 * Devuelve los grupos donde el usuario autenticado es miembro activo.
 */
export async function listMisGrupos() {
  const { data } = await negocioApi.get("/grupo-persona/mis-grupos");
  return data;
}

/**
 * POST /grupo-persona/grupos/:grupoId/abandonar
 * El usuario autenticado abandona el grupo (HU 3-011).
 */
export async function abandonarGrupo(grupoId) {
  const { data } = await negocioApi.post(
    `/grupo-persona/grupos/${grupoId}/abandonar`,
  );
  return data;
}
