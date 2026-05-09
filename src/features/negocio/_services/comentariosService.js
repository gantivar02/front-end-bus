import negocioApi from "../../../services/negocioApi";

export async function listarComentarios(incidenteId) {
  const { data } = await negocioApi.get("/incidente-comentario", {
    params: incidenteId != null ? { incidente_id: incidenteId } : undefined,
  });
  return data;
}

export async function crearComentario({ incidente_id, autor_id, texto }) {
  const payload = { incidente_id, texto };
  if (autor_id != null) payload.autor_id = autor_id;
  const { data } = await negocioApi.post("/incidente-comentario", payload);
  return data;
}

export async function eliminarComentario(id) {
  await negocioApi.delete(`/incidente-comentario/${id}`);
}
