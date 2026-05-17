import { useEffect, useMemo, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegSelect,
  NegDataTable,
  NegEmptyState,
} from "../../../../components/negocio";
import {
  listConductores,
  listBuses,
} from "../../_services/catalogosService";
import {
  listAsignaciones,
  createAsignacion,
  deleteAsignacion,
} from "../asignacionesService";

function nombreConductor(c) {
  const persona = c?.persona;
  const nombre = `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim();
  return nombre || `Conductor #${c?.id ?? "?"}`;
}

export default function AsignacionesPage() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ conductor_id: "", bus_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([listAsignaciones(), listConductores(), listBuses()])
      .then(([asigData, condData, busesData]) => {
        setAsignaciones(Array.isArray(asigData) ? asigData : []);
        setConductores(Array.isArray(condData) ? condData : []);
        setBuses(Array.isArray(busesData) ? busesData : []);
      })
      .catch((err) =>
        setError(
          err?.response?.data?.message ??
            "No se pudo cargar la información.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Map IDs → entidades (asignaciones del backend ya traen conductor/bus
  // como relación, pero el shape puede no incluir persona del conductor)
  const conductorMap = useMemo(
    () => new Map(conductores.map((c) => [c.id, c])),
    [conductores],
  );
  const busMap = useMemo(() => new Map(buses.map((b) => [b.id, b])), [buses]);

  const rows = useMemo(() => {
    return asignaciones.map((a) => ({
      id: a.id,
      conductor_id: a.conductor_id,
      bus_id: a.bus_id,
      conductor: conductorMap.get(a.conductor_id),
      bus: busMap.get(a.bus_id),
    }));
  }, [asignaciones, conductorMap, busMap]);

  // Para el form: filtramos pares (conductor, bus) que ya existen
  const pairsActuales = useMemo(() => {
    const set = new Set();
    for (const a of asignaciones) {
      set.add(`${a.conductor_id}-${a.bus_id}`);
    }
    return set;
  }, [asignaciones]);

  const busesDisponiblesParaConductor = useMemo(() => {
    if (!form.conductor_id) return buses;
    return buses.filter(
      (b) => !pairsActuales.has(`${form.conductor_id}-${b.id}`),
    );
  }, [buses, form.conductor_id, pairsActuales]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.conductor_id || !form.bus_id || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createAsignacion({
        conductor_id: Number(form.conductor_id),
        bus_id: Number(form.bus_id),
      });
      setShowForm(false);
      setForm({ conductor_id: "", bus_id: "" });
      load();
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "No se pudo crear la asignación.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAsignacion(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "No se pudo eliminar la asignación.",
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "conductor",
      header: "Conductor",
      render: (r) => (
        <div>
          <p className="font-medium text-neg-on-surface">
            {nombreConductor(r.conductor)}
          </p>
          <p className="text-xs text-neg-on-surface-variant">
            {r.conductor?.persona?.email ?? `ID ${r.conductor_id}`}
          </p>
        </div>
      ),
    },
    {
      key: "bus",
      header: "Bus",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-neg-primary-container/40 text-neg-on-primary-container px-2 py-0.5 rounded-md">
            {r.bus?.placa ?? `Bus #${r.bus_id}`}
          </span>
          {r.bus?.modelo && (
            <span className="text-xs text-neg-on-surface-variant">
              {r.bus.modelo}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "estado_bus",
      header: "Estado bus",
      width: 130,
      render: (r) => (
        <span className="text-xs text-neg-on-surface-variant capitalize">
          {r.bus?.estado?.replaceAll("_", " ") ?? "—"}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "",
      width: 60,
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(r);
          }}
          className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-error hover:bg-neg-error/10 transition-colors"
          title="Eliminar asignación"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <NegPageHeader
        eyebrow="Conductores y turnos"
        title="Asignación de buses a conductores"
        subtitle="Define qué conductor puede operar cada bus. Sin esta asignación, el conductor no puede crear turnos ni reportar incidentes en ese bus."
        actions={
          <NegButton
            icon="add_link"
            onClick={() => {
              setForm({ conductor_id: "", bus_id: "" });
              setError(null);
              setShowForm(true);
            }}
          >
            Nueva asignación
          </NegButton>
        }
      />

      {error && (
        <NegCard className="mb-5 border border-neg-error" padding="sm">
          <div className="flex items-center gap-2 text-sm text-neg-error font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </NegCard>
      )}

      <NegCard padding="none">
        {loading ? (
          <div className="py-14 text-center text-sm text-neg-on-surface-variant">
            <span
              className="material-symbols-outlined text-[36px] block mb-2 animate-spin"
              style={{ animationDuration: "1s" }}
            >
              progress_activity
            </span>
            Cargando asignaciones...
          </div>
        ) : rows.length === 0 ? (
          <NegEmptyState
            icon="link_off"
            title="Sin asignaciones registradas"
            description="Creá la primera con el botón Nueva asignación."
          />
        ) : (
          <NegDataTable columns={columns} rows={rows} keyField="id" />
        )}
      </NegCard>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !submitting && setShowForm(false)}
          />
          <NegCard
            variant="elevated"
            padding="lg"
            className="relative z-10 w-full max-w-md"
          >
            <h2 className="font-headline text-xl font-bold text-neg-on-surface mb-2">
              Nueva asignación
            </h2>
            <p className="text-sm text-neg-on-surface-variant mb-5">
              Vinculá un conductor con un bus que pueda operar.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <NegSelect
                label="Conductor"
                name="conductor_id"
                value={form.conductor_id}
                onChange={(e) => {
                  setForm({ conductor_id: e.target.value, bus_id: "" });
                }}
                placeholder="Seleccioná un conductor"
                options={conductores.map((c) => ({
                  value: c.id,
                  label: nombreConductor(c),
                }))}
              />
              <NegSelect
                label="Bus"
                name="bus_id"
                value={form.bus_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bus_id: e.target.value }))
                }
                placeholder={
                  !form.conductor_id
                    ? "Elegí primero un conductor"
                    : busesDisponiblesParaConductor.length === 0
                      ? "No hay buses sin asignar para este conductor"
                      : "Seleccioná un bus"
                }
                disabled={
                  !form.conductor_id ||
                  busesDisponiblesParaConductor.length === 0
                }
                options={busesDisponiblesParaConductor.map((b) => ({
                  value: b.id,
                  label: `${b.placa} · ${b.modelo ?? ""}`,
                }))}
              />
              <p className="text-xs text-neg-on-surface-variant">
                Solo se muestran buses que no estén ya asignados a este
                conductor.
              </p>
              <div className="flex items-center justify-end gap-2 pt-3">
                <NegButton
                  type="button"
                  variant="outlined"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancelar
                </NegButton>
                <NegButton
                  type="submit"
                  icon={submitting ? "hourglass_top" : "link"}
                  disabled={!form.conductor_id || !form.bus_id || submitting}
                >
                  {submitting ? "Asignando..." : "Asignar"}
                </NegButton>
              </div>
            </form>
          </NegCard>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <NegCard
            variant="elevated"
            padding="lg"
            className="relative z-10 w-full max-w-sm"
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-neg-error-container flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px] text-neg-on-error-container">
                  link_off
                </span>
              </div>
              <h3 className="font-headline text-xl font-bold text-neg-on-surface mb-2">
                ¿Eliminar asignación?
              </h3>
              <p className="text-sm text-neg-on-surface-variant mb-1">
                {nombreConductor(deleteTarget.conductor)}
              </p>
              <p className="text-sm text-neg-on-surface-variant mb-6">
                ya no podrá operar el bus{" "}
                <strong className="text-neg-on-surface">
                  {deleteTarget.bus?.placa}
                </strong>
                .
              </p>
              <div className="flex gap-3 justify-center">
                <NegButton
                  variant="outlined"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancelar
                </NegButton>
                <NegButton
                  variant="danger"
                  icon={deleting ? "hourglass_top" : "delete"}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </NegButton>
              </div>
            </div>
          </NegCard>
        </div>
      )}
    </div>
  );
}
