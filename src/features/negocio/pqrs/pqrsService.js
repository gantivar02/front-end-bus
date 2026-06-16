import negocioApi from "../../../services/negocioApi";

export async function crearPqrs(payload, fotos = []) {
  const form = new FormData();
  form.append("tipo", payload.tipo);
  form.append("categoria", payload.categoria);
  form.append("descripcion", payload.descripcion);
  form.append("email_contacto", payload.email_contacto);
  for (const file of fotos) form.append("fotos", file);

  const { data } = await negocioApi.post("/pqrs", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function consultarPqrsPorRadicado(numeroRadicado) {
  const { data } = await negocioApi.get(`/pqrs/consulta/${numeroRadicado}`, {
    skipAuth: true,
    skipAuthRedirect: true,
  });
  return data;
}

export async function listarMisPqrs() {
  const { data } = await negocioApi.get("/pqrs/mis");
  return data;
}

export async function listarPqrsGestion() {
  const { data } = await negocioApi.get("/pqrs");
  return data;
}

export async function actualizarPqrs(id, payload) {
  const { data } = await negocioApi.patch(`/pqrs/${id}`, payload);
  return data;
}
