import { useEffect, useMemo, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegFilterBar,
  NegInput,
  NegKpiCard,
  NegSectionHeader,
  NegDataTable,
  NegBarRow,
  NegSegmentedControl,
  NegEmptyState,
} from "../../../../components/negocio";
import DonutChart from "../components/DonutChart";
import StackedBarChart from "../components/StackedBarChart";
import { formatCurrency } from "../../_utils/format";

const TONE_HEX = {
  primary: "#006948",
  secondary: "#4d6357",
  tertiary: "#224959",
  danger: "#ba1a1a",
  amber: "#d97706",
  violet: "#7c3aed",
};
import {
  ingresosPorMetodoPago,
  descargarIngresosPorMetodoPagoExcel,
} from "../../_services/reportesService";

const RANGES = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
];

const TONES = ["primary", "secondary", "tertiary", "amber", "violet", "danger"];

function formatearMes(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
}

export default function IngresosPorMetodoPagoPage() {
  const [meses, setMeses] = useState(3);
  const [hasta, setHasta] = useState("");
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const params = { meses };
    if (hasta) params.hasta = hasta;
    ingresosPorMetodoPago(params)
      .then((data) => {
        if (alive) setReporte(data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err?.response?.data?.message ??
            "No se pudo cargar el reporte de ingresos.",
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

  const rows = useMemo(() => {
    if (!reporte) return [];
    return (reporte.metodos_pago ?? []).map((mp, idx) => ({
      id: mp.metodo_pago_id,
      metodo: mp.tipo?.replaceAll("_", " ") ?? "—",
      tipoRaw: mp.tipo,
      ingresos: Number(mp.total_periodo ?? 0),
      porcentaje: Number(mp.porcentaje_del_total ?? 0),
      datos_mensuales: mp.datos_mensuales ?? [],
      tone: TONES[idx % TONES.length],
    }));
  }, [reporte]);

  const totalIngresos = Number(reporte?.total_general ?? 0);
  const topMetodo = rows[0];

  const mesesSerie = reporte?.meses ?? [];
  const promedioMensual =
    mesesSerie.length > 0 ? totalIngresos / mesesSerie.length : 0;

  const donutData = rows.map((r) => ({
    label: r.metodo,
    value: r.ingresos,
    tone: r.tone,
  }));

  const handleExportar = async () => {
    setDescargando(true);
    setError(null);
    try {
      const params = { meses };
      if (hasta) params.hasta = hasta;
      await descargarIngresosPorMetodoPagoExcel(params);
    } catch (err) {
      setError(err?.message ?? "No se pudo descargar el Excel.");
    } finally {
      setDescargando(false);
    }
  };

  const handleLimpiar = () => {
    setMeses(3);
    setHasta("");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <NegPageHeader
        eyebrow="HU 2-014"
        title="Ingresos por método de pago"
        subtitle="Distribución de ingresos acreditados por método y período."
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
        <div className="flex items-end">
          <NegSegmentedControl
            value={meses}
            onChange={setMeses}
            options={RANGES}
          />
        </div>
        <NegInput
          label="Hasta (YYYY-MM)"
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
      ) : !reporte || rows.length === 0 ? (
        <NegCard>
          <NegEmptyState
            icon="analytics"
            title="Sin ingresos en el período"
            description="Ajustá el rango o esperá a que se registren boletos pagados."
          />
        </NegCard>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <NegKpiCard
              label="Ingresos totales"
              value={formatCurrency(totalIngresos)}
              hint={`Últimos ${mesesSerie.length} meses`}
              icon="paid"
              iconTone="primary"
            />
            <NegKpiCard
              label="Promedio mensual"
              value={formatCurrency(promedioMensual)}
              icon="bar_chart"
              iconTone="secondary"
            />
            <NegKpiCard
              label="Métodos activos"
              value={String(rows.length)}
              icon="credit_card"
              iconTone="tertiary"
            />
            <NegKpiCard
              label="Top método"
              value={topMetodo?.metodo ?? "—"}
              hint={topMetodo ? formatCurrency(topMetodo.ingresos) : "—"}
              icon="workspace_premium"
              iconTone="primary"
            />
          </section>

          <NegCard className="mb-6">
            <NegSectionHeader
              title="Evolución mensual por método"
              hint="Barras apiladas: cada barra representa un mes y los segmentos muestran la contribución de cada método de pago."
            />
            <StackedBarChart
              labels={mesesSerie.map(formatearMes)}
              series={rows.map((r) => ({
                label: r.metodo,
                color: TONE_HEX[r.tone] ?? "#006948",
                values: mesesSerie.map((mes) => {
                  const punto = r.datos_mensuales.find((p) => p.mes === mes);
                  return Number(punto?.ingresos ?? 0);
                }),
              }))}
              valueFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}k`
                    : String(v)
              }
              height={300}
            />
          </NegCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <NegCard className="lg:col-span-1 flex flex-col items-center">
              <NegSectionHeader title="Distribución" />
              <DonutChart
                data={donutData}
                centerLabel="Total"
                centerValue={formatCurrency(totalIngresos)}
              />
              <div className="w-full mt-5 space-y-2">
                {donutData.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            {
                              primary: "#006948",
                              secondary: "#4d6357",
                              tertiary: "#224959",
                              danger: "#ba1a1a",
                              amber: "#d97706",
                              violet: "#7c3aed",
                            }[d.tone] ?? "#006948",
                        }}
                      />
                      <span className="text-neg-on-surface capitalize">
                        {d.label}
                      </span>
                    </div>
                    <span className="font-semibold text-neg-on-surface tabular-nums">
                      {totalIngresos > 0
                        ? ((d.value / totalIngresos) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </NegCard>

            <NegCard className="lg:col-span-2">
              <NegSectionHeader
                title="Participación por método"
                hint="Monto acreditado sobre el total del período."
              />
              <div className="space-y-4">
                {rows.map((r) => (
                  <NegBarRow
                    key={r.id}
                    label={<span className="capitalize">{r.metodo}</span>}
                    value={r.ingresos}
                    total={totalIngresos}
                    formatter={formatCurrency}
                    tone={
                      r.tone === "amber" || r.tone === "violet"
                        ? "primary"
                        : r.tone
                    }
                    hint={`${r.porcentaje.toFixed(1)}% del total`}
                  />
                ))}
              </div>
            </NegCard>
          </div>

          <NegCard padding="none">
            <div className="px-6 pt-6">
              <NegSectionHeader
                title="Detalle mensual"
                hint={`Ingresos por método entre ${mesesSerie[0] ?? "—"} y ${
                  mesesSerie.at(-1) ?? "—"
                }.`}
              />
            </div>
            <NegDataTable
              className="border-none rounded-t-none"
              keyField="id"
              columns={[
                {
                  key: "metodo",
                  header: "Método",
                  render: (r) => (
                    <span className="font-semibold capitalize">
                      {r.metodo}
                    </span>
                  ),
                },
                ...mesesSerie.map((mes) => ({
                  key: mes,
                  header: formatearMes(mes),
                  render: (r) => {
                    const punto = r.datos_mensuales.find((p) => p.mes === mes);
                    return formatCurrency(Number(punto?.ingresos ?? 0));
                  },
                })),
                {
                  key: "ingresos",
                  header: "Total",
                  render: (r) => (
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(r.ingresos)}
                    </span>
                  ),
                },
                {
                  key: "porcentaje",
                  header: "%",
                  render: (r) => `${r.porcentaje.toFixed(1)}%`,
                },
              ]}
              rows={rows}
            />
          </NegCard>
        </>
      )}
    </div>
  );
}
