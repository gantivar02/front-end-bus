import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegPageHeader,
  NegCard,
  NegSelect,
  NegInput,
  NegButton,
  NegSegmentedControl,
  NegFilterBar,
  NegChip,
  NegEmptyState,
} from "../../../../components/negocio";
import IncidenteCard from "../components/IncidenteCard";
import IncidenteDetail from "../components/IncidenteDetail";
import {
  ESTADOS_INCIDENTE,
  TIPOS_INCIDENTE,
  TIPO_INCIDENTE_LABEL,
} from "../../_mocks/catalogos";
import { listBuses } from "../../_services/catalogosService";
import {
  listarIncidentesPorBus,
  cambiarEstadoIncidente,
} from "../../_services/incidentesService";

const ESTADO_TABS = [
  { value: "todos", label: "Todos" },
  ...ESTADOS_INCIDENTE.map((e) => ({ value: e.value, label: e.label })),
];

const TIPO_FILTER_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  ...TIPOS_INCIDENTE.map((t) => ({ value: t.value, label: t.label })),
];

export default function IncidentesPorBusPage() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [busId, setBusId] = useState("");
  const [estadoTab, setEstadoTab] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [search, setSearch] = useState("");
  const [incidentes, setIncidentes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingBuses, setLoadingBuses] = useState(true);
  const [loadingIncidentes, setLoadingIncidentes] = useState(false);
  const [error, setError] = useState(null);
  const [estadoUpdatingId, setEstadoUpdatingId] = useState(null);

  useEffect(() => {
    let alive = true;
    listBuses()
      .then((data) => {
        if (!alive) return;
        const lista = Array.isArray(data) ? data : [];
        setBuses(lista);
        if (lista.length > 0) setBusId(String(lista[0].id));
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err?.response?.data?.message ?? "No se pudieron cargar los buses.",
        );
      })
      .finally(() => {
        if (alive) setLoadingBuses(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!busId) {
      setIncidentes([]);
      return;
    }
    let alive = true;
    setLoadingIncidentes(true);
    setError(null);
    const params = {};
    if (estadoTab !== "todos") params.estado = estadoTab;
    if (tipoFiltro) params.tipo = tipoFiltro;
    listarIncidentesPorBus(Number(busId), params)
      .then((data) => {
        if (!alive) return;
        setIncidentes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err?.response?.data?.message ??
            "No se pudieron cargar los incidentes.",
        );
      })
      .finally(() => {
        if (alive) setLoadingIncidentes(false);
      });
    return () => {
      alive = false;
    };
  }, [busId, estadoTab, tipoFiltro]);

  const bus = buses.find((b) => String(b.id) === busId);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return incidentes;
    return incidentes.filter((i) => {
      const descripcion = (i.descripcion ?? "").toLowerCase();
      const tipoLabel = (TIPO_INCIDENTE_LABEL[i.tipo] ?? "").toLowerCase();
      const conductor = i.conductor
        ? `${i.conductor.nombre} ${i.conductor.apellido}`.toLowerCase()
        : "";
      return (
        String(i.id).includes(term) ||
        descripcion.includes(term) ||
        tipoLabel.includes(term) ||
        conductor.includes(term)
      );
    });
  }, [incidentes, search]);

  const selected =
    filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  const handleChangeEstado = async (incidenteId, nuevoEstado) => {
    setEstadoUpdatingId(incidenteId);
    try {
      await cambiarEstadoIncidente(incidenteId, nuevoEstado);
      setIncidentes((prev) =>
        prev.map((i) =>
          i.id === incidenteId ? { ...i, estado: nuevoEstado } : i,
        ),
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No se pudo actualizar el estado del incidente.",
      );
    } finally {
      setEstadoUpdatingId(null);
    }
  };

  const counts = useMemo(() => {
    return incidentes.reduce(
      (acc, i) => {
        acc[i.estado] = (acc[i.estado] ?? 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, pendiente: 0, en_revision: 0, resuelto: 0 },
    );
  }, [incidentes]);

  return (
    <div className="max-w-7xl">
      <NegPageHeader
        eyebrow="HU 2-008"
        title="Gestión de incidentes por bus"
        subtitle="Consultá y actualizá el estado de los incidentes asociados a cada bus."
        actions={
          <NegButton
            icon="add"
            onClick={() => navigate("/negocio/incidentes/reportar")}
          >
            Nuevo reporte
          </NegButton>
        }
      />

      <NegFilterBar
        className="mb-5"
        actions={
          <NegButton
            variant="outlined"
            icon="filter_alt_off"
            onClick={() => {
              setEstadoTab("todos");
              setTipoFiltro("");
              setSearch("");
            }}
          >
            Limpiar
          </NegButton>
        }
      >
        <NegSelect
          label="Bus"
          name="busId"
          value={busId}
          onChange={(e) => {
            setBusId(e.target.value);
            setSelectedId(null);
          }}
          placeholder={loadingBuses ? "Cargando buses..." : "Seleccioná un bus"}
          disabled={loadingBuses || buses.length === 0}
          options={buses.map((b) => ({
            value: b.id,
            label: `${b.placa} · ${b.modelo}`,
          }))}
        />
        <NegSelect
          label="Tipo"
          name="tipo"
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          options={TIPO_FILTER_OPTIONS}
        />
        <NegInput
          label="Buscar"
          name="search"
          iconStart="search"
          placeholder="ID, descripción, conductor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </NegFilterBar>

      {bus && (
        <NegCard variant="filled" padding="sm" className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                {bus.placa} · {bus.modelo}
              </p>
              <p className="text-lg font-headline font-bold text-neg-on-surface">
                {bus.anio} · {bus.capacidad_maxima} pax
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NegChip tone="neutral">Total: {counts.total}</NegChip>
              <NegChip tone="danger">Pendientes: {counts.pendiente}</NegChip>
              <NegChip tone="warning">
                En revisión: {counts.en_revision}
              </NegChip>
              <NegChip tone="success">Resueltos: {counts.resuelto}</NegChip>
            </div>
          </div>
        </NegCard>
      )}

      {error && (
        <NegCard className="mb-5 border border-neg-error text-neg-error">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </NegCard>
      )}

      <div className="flex items-center justify-between gap-3 mb-3">
        <NegSegmentedControl
          value={estadoTab}
          onChange={setEstadoTab}
          options={ESTADO_TABS}
        />
        <p className="text-xs text-neg-on-surface-variant">
          {loadingIncidentes
            ? "Cargando..."
            : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {loadingIncidentes ? (
            <NegCard>
              <NegEmptyState
                icon="hourglass_top"
                title="Cargando incidentes"
                description="Un momento..."
              />
            </NegCard>
          ) : filtered.length === 0 ? (
            <NegCard>
              <NegEmptyState
                icon="inbox"
                title="Sin incidentes"
                description="No hay incidentes para este bus con los filtros actuales."
              />
            </NegCard>
          ) : (
            filtered.map((i) => (
              <IncidenteCard
                key={i.id}
                incidente={i}
                active={(selected?.id ?? null) === i.id}
                onClick={() => setSelectedId(i.id)}
              />
            ))
          )}
        </div>
        <div className="lg:col-span-3">
          <IncidenteDetail
            incidente={selected}
            onChangeEstado={handleChangeEstado}
            estadoUpdatingId={estadoUpdatingId}
          />
        </div>
      </div>
    </div>
  );
}
