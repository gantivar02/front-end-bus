import { useEffect, useMemo, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegFilterBar,
  NegInput,
  NegKpiCard,
  NegSectionHeader,
  NegSegmentedControl,
  NegEmptyState,
} from "../../../../components/negocio";
import LineAreaChart from "../components/LineAreaChart";
import ColumnChart from "../components/ColumnChart";
import { tendenciaMensual } from "../../_services/incidentesService";
import {
  TIPOS_INCIDENTE,
  TIPO_INCIDENTE_LABEL,
} from "../../_mocks/catalogos";

const RANGOS = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
];

const COLORES_TIPO = {
  mecanico: "#006948",
  accidente: "#ba1a1a",
  retraso: "#d97706",
  problema_pasajero: "#7c3aed",
  otro: "#4d6357",
};

function formatearMes(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
}

function restarMeses(ym, meses) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 - meses, 1));
  const yy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

export default function TendenciaIncidentesPage() {
  const [meses, setMeses] = useState(6);
  const [hasta, setHasta] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const params = {};
    if (hasta) {
      params.hasta = hasta;
      params.desde = restarMeses(hasta, meses - 1);
    } else {
      const hoy = new Date();
      const hastaCalc = `${hoy.getUTCFullYear()}-${String(
        hoy.getUTCMonth() + 1,
      ).padStart(2, "0")}`;
      params.hasta = hastaCalc;
      params.desde = restarMeses(hastaCalc, meses - 1);
    }
    tendenciaMensual(params)
      .then((data) => {
        if (alive) setReporte(data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err?.response?.data?.message ??
            "No se pudo cargar la tendencia mensual.",
        );
        setReporte(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [meses, hasta]);

  const labels = useMemo(() => {
    if (!reporte?.series?.[0]?.datos) return [];
    return reporte.series[0].datos.map((p) => formatearMes(p.mes));
  }, [reporte]);

  const seriesFiltradas = useMemo(() => {
    if (!reporte) return [];
    const base =
      tipoFiltro === "todos"
        ? reporte.series
        : reporte.series.filter((s) => s.tipo === tipoFiltro);
    return base.map((s) => ({
      label: TIPO_INCIDENTE_LABEL[s.tipo] ?? s.tipo,
      color: COLORES_TIPO[s.tipo] ?? "#4d6357",
      values: s.datos.map((p) => Number(p.cantidad ?? 0)),
      tipo: s.tipo,
    }));
  }, [reporte, tipoFiltro]);

  const totalesPorMes = useMemo(() => {
    if (!reporte) return [];
    const meses = reporte.series[0]?.datos?.map((p) => p.mes) ?? [];
    return meses.map((mes) => {
      const total = reporte.series.reduce((sum, s) => {
        const p = s.datos.find((d) => d.mes === mes);
        return sum + Number(p?.cantidad ?? 0);
      }, 0);
      return { mes, total };
    });
  }, [reporte]);

  const totalPeriodo = totalesPorMes.reduce((acc, m) => acc + m.total, 0);
  const ultimoMes = totalesPorMes.at(-1)?.total ?? 0;
  const mesAnterior = totalesPorMes.at(-2)?.total ?? 0;
  const deltaMoM =
    mesAnterior > 0
      ? (((ultimoMes - mesAnterior) / mesAnterior) * 100).toFixed(1)
      : "0";
  const promedio =
    totalesPorMes.length > 0
      ? Math.round(totalPeriodo / totalesPorMes.length)
      : 0;
  const picoEntry = totalesPorMes.reduce(
    (max, m) => (m.total > (max?.total ?? -1) ? m : max),
    null,
  );

  const totalesPorTipo = useMemo(() => {
    if (!reporte) return [];
    return reporte.series.map((s) => {
      const total = s.datos.reduce(
        (sum, p) => sum + Number(p.cantidad ?? 0),
        0,
      );
      return {
        tipo: s.tipo,
        label: TIPO_INCIDENTE_LABEL[s.tipo] ?? s.tipo,
        total,
      };
    });
  }, [reporte]);

  const tipoPredominante = totalesPorTipo.reduce(
    (max, t) => (t.total > (max?.total ?? -1) ? t : max),
    null,
  );

  return (
    <div className="max-w-7xl mx-auto">
      <NegPageHeader
        eyebrow="HU 2-016"
        title="Tendencia mensual de incidentes"
        subtitle="Evolución de los incidentes reportados por tipo y mes."
      />

      <NegFilterBar className="mb-5">
        <div className="flex items-end">
          <NegSegmentedControl
            value={meses}
            onChange={setMeses}
            options={RANGOS}
          />
        </div>
        <NegInput
          label="Hasta (mes)"
          name="hasta"
          type="month"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          placeholder="2026-04"
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
      ) : !reporte ? null : totalPeriodo === 0 ? (
        <NegCard>
          <NegEmptyState
            icon="report_off"
            title="Sin incidentes en el período"
            description="Ajustá el rango para ver la tendencia."
          />
        </NegCard>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <NegKpiCard
              label="Total del período"
              value={totalPeriodo.toLocaleString("es-CO")}
              hint={`${reporte.periodo.meses} meses`}
              icon="report"
              iconTone="primary"
            />
            <NegKpiCard
              label="Último mes"
              value={ultimoMes.toLocaleString("es-CO")}
              delta={`${deltaMoM}% vs mes anterior`}
              deltaTone={Number(deltaMoM) > 0 ? "down" : "up"}
              icon="calendar_month"
              iconTone="secondary"
            />
            <NegKpiCard
              label="Promedio mensual"
              value={promedio.toLocaleString("es-CO")}
              icon="bar_chart"
              iconTone="tertiary"
            />
            <NegKpiCard
              label="Pico del período"
              value={picoEntry?.total?.toLocaleString("es-CO") ?? "0"}
              hint={picoEntry ? formatearMes(picoEntry.mes) : "—"}
              icon="trending_up"
              iconTone="danger"
            />
          </section>

          <NegCard className="mb-6">
            <NegSectionHeader
              title="Tendencia por tipo"
              hint="Evolución comparativa de incidentes por categoría."
              actions={
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTipoFiltro("todos")}
                    className={`text-xs px-2 h-6 rounded-full border ${
                      tipoFiltro === "todos"
                        ? "bg-neg-primary text-neg-on-primary border-neg-primary"
                        : "border-neg-outline-variant text-neg-on-surface-variant"
                    }`}
                  >
                    Todos
                  </button>
                  {TIPOS_INCIDENTE.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTipoFiltro(t.value)}
                      className={`text-xs px-2 h-6 rounded-full border inline-flex items-center gap-1 ${
                        tipoFiltro === t.value
                          ? "bg-neg-primary text-neg-on-primary border-neg-primary"
                          : "border-neg-outline-variant text-neg-on-surface-variant"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORES_TIPO[t.value] }}
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              }
            />
            <LineAreaChart series={seriesFiltradas} labels={labels} />
          </NegCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <NegCard>
              <NegSectionHeader
                title="Por tipo de incidente"
                hint="Total del período agrupado por categoría."
              />
              <ColumnChart
                data={totalesPorTipo.map((t) => ({
                  label: t.label,
                  value: t.total,
                }))}
                colorTone="secondary"
              />
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {totalesPorTipo.map((t) => (
                  <div
                    key={t.tipo}
                    className="flex items-center justify-between p-2 rounded-lg bg-neg-surface-container-low"
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-neg-on-surface">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORES_TIPO[t.tipo] }}
                      />
                      {t.label}
                    </span>
                    <span className="text-xs font-semibold tabular-nums">
                      {t.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                ))}
              </div>
            </NegCard>

            <NegCard>
              <NegSectionHeader
                title="Resumen mensual"
                hint="Total de incidentes por mes."
              />
              <ul className="divide-y divide-neg-outline-variant/60">
                {totalesPorMes.map((m) => (
                  <li
                    key={m.mes}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-neg-on-surface-variant">
                      {formatearMes(m.mes)}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {m.total.toLocaleString("es-CO")}
                    </span>
                  </li>
                ))}
              </ul>
            </NegCard>
          </div>

          <NegCard>
            <NegSectionHeader title="Observaciones" />
            <ul className="space-y-2 text-sm text-neg-on-surface">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-neg-primary text-[18px] mt-0.5">
                  insights
                </span>
                {picoEntry
                  ? `El pico fue en ${formatearMes(picoEntry.mes)} con ${picoEntry.total} incidentes.`
                  : "Aún no se detecta un pico relevante."}
              </li>
              {tipoPredominante && tipoPredominante.total > 0 && (
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-neg-tertiary text-[18px] mt-0.5">
                    stacked_bar_chart
                  </span>
                  {`El tipo predominante es "${tipoPredominante.label}" con ${tipoPredominante.total} casos en el período.`}
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-neg-error text-[18px] mt-0.5">
                  priority_high
                </span>
                {Number(deltaMoM) > 0
                  ? `El último mes creció ${deltaMoM}% vs el mes anterior: revisar causas.`
                  : `El último mes bajó ${Math.abs(Number(deltaMoM))}% vs el mes anterior.`}
              </li>
            </ul>
          </NegCard>
        </>
      )}
    </div>
  );
}
