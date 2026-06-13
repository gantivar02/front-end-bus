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
