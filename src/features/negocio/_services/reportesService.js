import negocioApi, { NEGOCIO_BASE_URL } from "../../../services/negocioApi";
import { storage } from "../../../utils/storage";

export async function distribucionEtaria({ ruta_id, fecha_inicio, fecha_fin } = {}) {
  const params = {};
  if (ruta_id != null) params.ruta_id = ruta_id;
  if (fecha_inicio) params.fecha_inicio = fecha_inicio;
  if (fecha_fin) params.fecha_fin = fecha_fin;
  const { data } = await negocioApi.get(
    "/boletos/reportes/distribucion-etaria",
    { params },
  );
  return data;
}

export async function ingresosPorMetodoPago({ meses, hasta } = {}) {
  const params = { meses };
  if (hasta) params.hasta = hasta;
  const { data } = await negocioApi.get(
    "/boletos/reportes/ingresos-por-metodo-pago",
    { params },
  );
  return data;
}

function buildQueryString(params) {
  const usp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val != null && val !== "") usp.append(key, val);
  }
  return usp.toString();
}

async function descargarArchivo(path, params, nombreSugerido) {
  const token = storage.getToken();
  const qs = buildQueryString(params);
  const url = `${NEGOCIO_BASE_URL}${path}${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Descarga falló con estado ${response.status}`);
  }
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nombreSugerido;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export function descargarDistribucionEtariaExcel(params = {}) {
  const fecha = new Date().toISOString().slice(0, 10);
  return descargarArchivo(
    "/boletos/reportes/distribucion-etaria/excel",
    params,
    `distribucion-etaria-${fecha}.xlsx`,
  );
}

export function descargarIngresosPorMetodoPagoExcel(params = {}) {
  const fecha = new Date().toISOString().slice(0, 10);
  return descargarArchivo(
    "/boletos/reportes/ingresos-por-metodo-pago/excel",
    params,
    `ingresos-por-metodo-pago-${fecha}.xlsx`,
  );
}
