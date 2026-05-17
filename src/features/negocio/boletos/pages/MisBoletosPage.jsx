import { useEffect, useMemo, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegInput,
  NegButton,
  NegEmptyState,
  NegChip,
  NegFilterBar,
  NegSectionHeader,
} from "../../../../components/negocio";
import { listMisBoletos } from "../boletosService";
import { formatCurrency, formatDateTime } from "../../_utils/format";

const ESTADO_LABEL = {
  emitido: "Emitido",
  pagado: "Pagado",
  activo: "Activo (en uso)",
  completado: "Completado",
};

const ESTADO_TONE = {
  emitido: "neutral",
  pagado: "secondary",
  activo: "success",
  completado: "primary",
};

export default function MisBoletosPage() {
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | activos | vencidos

  const load = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    if (filtroEstado === "activos") {
      params.activos = true;
      params.vencidos = false;
    } else if (filtroEstado === "vencidos") {
      params.activos = false;
      params.vencidos = true;
    }
    listMisBoletos(params)
      .then((data) => setBoletos(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(
          err?.response?.data?.message ??
            "No se pudieron cargar tus boletos.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta, filtroEstado]);

  const counts = useMemo(() => {
    const activos = boletos.filter((b) => b.categoria === "activo").length;
    const vencidos = boletos.filter((b) => b.categoria === "vencido").length;
    return { activos, vencidos, total: boletos.length };
  }, [boletos]);

  const handleLimpiar = () => {
    setFechaDesde("");
    setFechaHasta("");
    setFiltroEstado("todos");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <NegPageHeader
        eyebrow="Uso del servicio"
        title="Mis boletos"
        subtitle="Consulta todos tus boletos: los activos (disponibles para usar o en uso) y los vencidos (ya completados)."
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
        <NegInput
          label="Desde"
          name="fecha_desde"
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />
        <NegInput
          label="Hasta"
          name="fecha_hasta"
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
        />
      </NegFilterBar>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { value: "todos", label: `Todos (${counts.total})` },
          { value: "activos", label: `Activos (${counts.activos})` },
          { value: "vencidos", label: `Vencidos (${counts.vencidos})` },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFiltroEstado(opt.value)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              filtroEstado === opt.value
                ? "bg-neg-primary text-neg-on-primary border-neg-primary"
                : "border-neg-outline-variant text-neg-on-surface-variant hover:border-neg-outline"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <NegCard className="mb-5 border border-neg-error" padding="sm">
          <div className="flex items-center gap-2 text-sm text-neg-error font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </NegCard>
      )}

      {loading ? (
        <NegCard>
          <NegEmptyState
            icon="hourglass_top"
            title="Cargando boletos..."
            description="Un momento."
          />
        </NegCard>
      ) : boletos.length === 0 ? (
        <NegCard>
          <NegEmptyState
            icon="confirmation_number"
            title="Sin boletos"
            description="No encontramos boletos con los filtros seleccionados."
          />
        </NegCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boletos.map((b) => {
            const esVencido = b.categoria === "vencido";
            return (
              <NegCard
                key={b.id}
                variant="outlined"
                className={
                  esVencido
                    ? "border-neg-outline-variant"
                    : "border-neg-primary/40 bg-neg-primary-container/10"
                }
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                      Boleto #{b.id}
                    </p>
                    <p className="font-headline text-lg font-bold text-neg-on-surface">
                      {b.ruta?.nombre ?? "Ruta"}
                    </p>
                  </div>
                  <NegChip tone={ESTADO_TONE[b.estado] ?? "neutral"}>
                    {ESTADO_LABEL[b.estado] ?? b.estado}
                  </NegChip>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                      Bus
                    </p>
                    <p className="font-mono text-neg-on-surface">
                      {b.bus?.placa ?? "—"}
                    </p>
                    {b.bus?.modelo && (
                      <p className="text-xs text-neg-on-surface-variant">
                        {b.bus.modelo}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                      Precio
                    </p>
                    <p className="font-semibold text-neg-on-surface">
                      {formatCurrency(b.precio)}
                    </p>
                    <p className="text-xs text-neg-on-surface-variant capitalize">
                      {(b.metodo_pago ?? "").replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                      Compra
                    </p>
                    <p className="text-neg-on-surface">
                      {formatDateTime(b.fecha_compra)}
                    </p>
                  </div>
                  {b.fecha_finalizacion && (
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                        Finalización
                      </p>
                      <p className="text-neg-on-surface">
                        {formatDateTime(b.fecha_finalizacion)}
                      </p>
                    </div>
                  )}
                </div>
              </NegCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
