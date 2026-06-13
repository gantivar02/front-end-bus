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

/**
 * GET /grupos/publicos
 * Directorio de grupos publicos disponibles para unirse (HU 3-009).
 * Acepta busqueda libre opcional sobre nombre o descripcion.
 * Cada grupo trae total_miembros y ya_soy_miembro (calculado contra el JWT).
 */
export async function listGruposPublicos({ search } = {}) {
  const params = {};
  if (search && search.trim().length > 0) {
    params.search = search.trim();
  }
  const { data } = await negocioApi.get("/grupos/publicos", { params });
  return data;
}

/**
 * POST /grupo-persona/grupos/:grupoId/unirse
 * El usuario autenticado se une a un grupo publico (HU 3-009).
 */
export async function unirseAGrupo(grupoId) {
  const { data } = await negocioApi.post(
    `/grupo-persona/grupos/${grupoId}/unirse`,
  );
  return data;
}

// ----------------------------------------------------------------
// HU 3-010 — Administracion de miembros (solo admin del grupo).
// ----------------------------------------------------------------

/**
 * GET /grupo-persona/grupos/:grupoId/miembros
 * Lista miembros (activos e historicos) del grupo. Acepta busqueda.
 */
export async function listMiembrosGrupo(grupoId, { search } = {}) {
  const params = {};
  if (search && search.trim().length > 0) params.search = search.trim();
  const { data } = await negocioApi.get(
    `/grupo-persona/grupos/${grupoId}/miembros`,
    { params },
  );
  return data;
}

/**
 * PATCH /grupo-persona/grupos/:grupoId/miembros/:personaId/rol
 * Promueve o degrada a un miembro.
 */
export async function cambiarRolMiembro(grupoId, personaId, rol) {
  const { data } = await negocioApi.patch(
    `/grupo-persona/grupos/${grupoId}/miembros/${personaId}/rol`,
    { rol },
  );
  return data;
}

/**
 * DELETE /grupo-persona/grupos/:grupoId/miembros/:personaId
 * Remueve a un miembro del grupo (soft delete).
 */
export async function removerMiembroGrupo(grupoId, personaId) {
  const { data } = await negocioApi.delete(
    `/grupo-persona/grupos/${grupoId}/miembros/${personaId}`,
  );
  return data;
}

/**
 * PATCH /grupo-persona/grupos/:grupoId/miembros/:personaId/bloqueo
 * Bloquea o desbloquea a un usuario.
 */
export async function cambiarBloqueoMiembro(grupoId, personaId, bloqueado) {
  const { data } = await negocioApi.patch(
    `/grupo-persona/grupos/${grupoId}/miembros/${personaId}/bloqueo`,
    { bloqueado },
  );
  return data;
}

/**
 * GET /grupo-persona/grupos/:grupoId/historial
 * Log de cambios de membresia del grupo.
 */
export async function listHistorialGrupo(grupoId) {
  const { data } = await negocioApi.get(
    `/grupo-persona/grupos/${grupoId}/historial`,
  );
  return data;
}
