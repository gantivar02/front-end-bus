import negocioApi from "../../../services/negocioApi";

export async function previewRecarga({ metodo_pago_ciudadano_id, monto }) {
  const { data } = await negocioApi.post("/recargas/preview", {
    metodo_pago_ciudadano_id,
    monto,
  });
  return data;
}

export async function iniciarRecarga({ metodo_pago_ciudadano_id, monto }) {
  const { data } = await negocioApi.post("/recargas", {
    metodo_pago_ciudadano_id,
    monto,
  });
  return data;
}

export async function obtenerRecarga(id) {
  const { data } = await negocioApi.get(`/recargas/${id}`);
  return data;
}
