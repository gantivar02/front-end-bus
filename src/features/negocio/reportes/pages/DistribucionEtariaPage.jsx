import { useEffect, useMemo, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegFilterBar,
  NegInput,
  NegSelect,
  NegKpiCard,
  NegSectionHeader,
  NegEmptyState,
} from "../../../../components/negocio";
import ColumnChart from "../components/ColumnChart";
import DonutChart from "../components/DonutChart";
import {
  distribucionEtaria,
  descargarDistribucionEtariaExcel,
} from "../../_services/reportesService";
import { listRutas } from "../../_services/catalogosService";

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("es-CO");
}

export default function DistribucionEtariaPage() {
  const [rutas, setRutas] = useState([]);
  const [rutaId, setRutaId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    let alive = true;
    listRutas()
      .then((data) => {
        if (!alive) return;
        setRutas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // no bloqueamos por error de rutas; el selector queda vacío
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
      setError("Debes seleccionar fecha inicio y fecha fin juntas.");
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    const params = {};
    if (rutaId) params.ruta_id = Number(rutaId);
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    distribucionEtaria(params)
      .then((data) => {
        if (alive) setReporte(data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err?.response?.data?.message ??
            "No se pudo cargar la distribución etaria.",
        );
        setReporte(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [rutaId, fechaInicio, fechaFin]);

  const total = reporte?.total_pasajeros ?? 0;
  const sinInfo = reporte?.sin_informacion;
  const rangoPred = reporte?.rango_predominante;

  const columnData = useMemo(() => {
    if (!reporte) return [];
    return reporte.rangos.map((r) => ({
      label: r.label,
      value: r.cantidad,
    }));
  }, [reporte]);

  const donutData = useMemo(() => {
    if (!reporte) return [];
    const base = reporte.rangos
      .filter((r) => r.cantidad > 0)
      .map((r) => ({
        label: r.label,
        value: r.cantidad,
        color: r.color,
      }));
    if (sinInfo?.cantidad > 0) {
      base.push({
        label: "Sin información",
        value: sinInfo.cantidad,
        color: sinInfo.color,
      });
    }
    return base;
  }, [reporte, sinInfo]);

  const handleExportar = async () => {
    setDescargando(true);
    try {
      const params = {};
      if (rutaId) params.ruta_id = Number(rutaId);
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      await descargarDistribucionEtariaExcel(params);
    } catch (err) {
      setError(err?.message ?? "No se pudo descargar el Excel.");
    } finally {
      setDescargando(false);
    }
  };

  const handleLimpiar = () => {
    setRutaId("");
    setFechaInicio("");
    setFechaFin("");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <NegPageHeader
        eyebrow="HU 2-015"
        title="Distribución etaria"
        subtitle="Perfil demográfico de los pasajeros por rango de edad."
        actions={
          <NegButton
            icon={descargando ? "hourglass_top" : "download"}
            onClick={handleExportar}
            disabled={descargando || !reporte}
          >
            {descargando ? "Descargando..." : "Exportar Excel"}
          </NegButton>
        }
      />

      <NegFilterBar
        className="mb-5"
        actions={
          <NegButton
            variant="outlined"
            icon="filter_alt_off"
            onClick={handleLimpiar}
          >
            Limpiar
          </NegButton>
        }
      >
        <NegSelect
          label="Ruta"
          name="ruta"
          value={rutaId}
          onChange={(e) => setRutaId(e.target.value)}
          options={[
            { value: "", label: "Todas las rutas" },
            ...rutas.map((r) => ({
              value: r.id,
              label: r.nombre ?? `Ruta #${r.id}`,
            })),
          ]}
        />
        <NegInput
          label="Desde"
          name="fecha_inicio"
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
        <NegInput
          label="Hasta"
          name="fecha_fin"
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />
      </NegFilterBar>

      {error && (
        <NegCard className="mb-5 border border-neg-error text-neg-error">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </NegCard>
      )}

      {loading && !reporte ? (
        <NegCard>
          <NegEmptyState
            icon="hourglass_top"
            title="Cargando reporte..."
            description="Un momento."
          />
        </NegCard>
      ) : !reporte ? null : total === 0 ? (
        <NegCard>
          <NegEmptyState
            icon="groups"
            title="Sin pasajeros en el período"
            description="Ajustá el rango o la ruta para ver resultados."
          />
        </NegCard>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <NegKpiCard
              label="Pasajeros"
              value={formatNumber(total)}
              hint={`Período: ${reporte.periodo.inicio} → ${reporte.periodo.fin}`}
              icon="groups"
              iconTone="primary"
            />
            <NegKpiCard
              label="Rango predominante"
              value={rangoPred?.label ?? "—"}
              hint={
                rangoPred
                  ? `${formatNumber(rangoPred.cantidad)} · ${rangoPred.porcentaje}%`
                  : "—"
              }
              icon="star"
              iconTone="secondary"
            />
            <NegKpiCard
              label="Sin información"
              value={`${sinInfo?.porcentaje?.toFixed?.(1) ?? 0}%`}
              hint={`${formatNumber(sinInfo?.cantidad ?? 0)} pasajeros`}
              icon="help"
              iconTone="tertiary"
            />
            <NegKpiCard
              label="Rangos con datos"
              value={String(
                reporte.rangos.filter((r) => r.cantidad > 0).length,
              )}
              hint={`${reporte.rangos.length} totales`}
              icon="bar_chart"
              iconTone="primary"
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <NegCard className="lg:col-span-2">
              <NegSectionHeader
                title="Distribución por rango etario"
                hint="Cantidad de pasajeros por cada franja de edad."
              />
              <ColumnChart
                data={columnData}
                valueFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v
                }
                colorTone="primary"
              />
            </NegCard>

            <NegCard className="flex flex-col items-center">
              <NegSectionHeader title="Participación" />
              <DonutChart
                data={donutData}
                centerLabel="Total"
                centerValue={formatNumber(total)}
              />
              <div className="w-full mt-4 space-y-2 text-sm">
                {donutData.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.label}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {total > 0
                        ? ((d.value / total) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </NegCard>
          </div>

          <NegCard>
            <NegSectionHeader
              title="Detalle por rango"
              hint="Cantidad, porcentaje y variación mensual."
            />
            <div className="space-y-5">
              {reporte.rangos.map((r) => {
                const pct = total > 0 ? (r.cantidad / total) * 100 : 0;
                const variacion = r.variacion_mes_anterior;
                return (
                  <div
                    key={r.label}
                    className="grid grid-cols-12 gap-4 items-center"
                  >
                    <div className="col-span-3">
                      <p className="font-semibold text-neg-on-surface">
                        {r.label}
                        {r.es_predominante && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-neg-primary">
                            top
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neg-on-surface-variant">
                        {r.min}–{r.max ?? "+"} · {formatNumber(r.cantidad)}
                      </p>
                    </div>
                    <div className="col-span-7">
                      <div className="flex h-3 rounded-full overflow-hidden bg-neg-surface-container-high">
                        <div
                          className="h-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: r.color,
                          }}
                          title={`${r.cantidad} (${r.porcentaje}%)`}
                        />
                      </div>
                      <p className="text-[11px] text-neg-on-surface-variant mt-1">
                        {r.porcentaje}% del total
                      </p>
                    </div>
                    <div className="col-span-2 text-right">
                      {variacion === null ? (
                        <span className="text-xs text-neg-on-surface-variant">
                          sin comparativo
                        </span>
                      ) : (
                        <span
                          className={`text-sm font-semibold ${
                            variacion > 0
                              ? "text-neg-primary"
                              : variacion < 0
                                ? "text-neg-error"
                                : "text-neg-on-surface-variant"
                          }`}
                        >
                          {variacion > 0 ? "+" : ""}
                          {variacion}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </NegCard>
        </>
      )}
    </div>
  );
}
