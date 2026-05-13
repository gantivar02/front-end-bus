import { useEffect, useMemo, useState } from "react";
import {
  NegButton,
  NegCard,
  NegInput,
  NegSectionHeader,
  NegSelect,
  NegTextarea,
} from "../../../../components/negocio";
import {
  getBusesPorConductor,
  listConductores,
} from "../../_services/catalogosService";

const ESTADOS_TURNO = [
  { value: "programado", label: "Programado" },
  { value: "en_curso", label: "En curso" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];

const EMPTY = {
  conductor_id: "",
  bus_id: "",
  inicio: "",
  fin: "",
  estado: "programado",
  observaciones: "",
};

function toDateTimeLocal(isoStr) {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatConductorLabel(conductor) {
  const persona = conductor?.persona ?? {};
  const nombre = `${persona.nombre ?? ""} ${persona.apellido ?? ""}`.trim();
  return nombre || `Conductor #${conductor?.id ?? "—"}`;
}

function formatBusLabel(bus) {
  return `${bus?.placa ?? `Bus #${bus?.id ?? "—"}`} — ${bus?.modelo ?? "Sin modelo"}`;
}

export default function TurnoForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(EMPTY);
  const [conductores, setConductores] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loadingConductores, setLoadingConductores] = useState(true);
  const [loadingBuses, setLoadingBuses] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoadingConductores(true);
    setLoadError(null);
    listConductores()
      .then((data) => {
        if (!alive) return;
        setConductores(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(
          err?.response?.data?.message ??
            "No se pudieron cargar los conductores.",
        );
      })
      .finally(() => {
        if (alive) setLoadingConductores(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        conductor_id: String(initialData.conductor_id ?? ""),
        bus_id: String(initialData.bus_id ?? ""),
        inicio: toDateTimeLocal(initialData.inicio),
        fin: toDateTimeLocal(initialData.fin),
        estado: initialData.estado ?? "programado",
        observaciones: initialData.observaciones ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [initialData]);

  useEffect(() => {
    if (!form.conductor_id) {
      setBuses([]);
      return;
    }
    let alive = true;
    setLoadingBuses(true);
    setLoadError(null);
    getBusesPorConductor(Number(form.conductor_id))
      .then((data) => {
        if (!alive) return;
        const busesData = Array.isArray(data) ? data : [];
        setBuses(busesData);
        if (
          form.bus_id &&
          !busesData.some((bus) => String(bus.id) === String(form.bus_id))
        ) {
          setForm((current) => ({ ...current, bus_id: "" }));
        }
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(
          err?.response?.data?.message ??
            "No se pudieron cargar los buses asignados a ese conductor.",
        );
      })
      .finally(() => {
        if (alive) setLoadingBuses(false);
      });
    return () => {
      alive = false;
    };
  }, [form.conductor_id]);

  const setField = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));

  const conductorOptions = useMemo(
    () =>
      conductores.map((conductor) => ({
        value: String(conductor.id),
        label: formatConductorLabel(conductor),
      })),
    [conductores],
  );

  const busOptions = useMemo(
    () =>
      buses.map((bus) => ({
        value: String(bus.id),
        label: formatBusLabel(bus),
      })),
    [buses],
  );

  const canSubmit =
    form.conductor_id &&
    form.bus_id &&
    form.inicio &&
    form.fin &&
    new Date(form.fin) > new Date(form.inicio);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    onSubmit({
      conductor_id: Number(form.conductor_id),
      bus_id: Number(form.bus_id),
      inicio: new Date(form.inicio).toISOString(),
      fin: new Date(form.fin).toISOString(),
      estado: form.estado,
      observaciones: form.observaciones.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <NegCard>
        <NegSectionHeader
          title="Asignación del turno"
          hint="Selecciona al conductor y uno de los buses que tiene asignados."
        />
        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-neg-error bg-neg-error-container/30 flex items-center gap-2 text-neg-error text-sm">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {loadError}
          </div>
        )}
        <div className="space-y-4">
          <NegSelect
            label="Conductor *"
            name="conductor_id"
            value={form.conductor_id}
            onChange={(e) => setField("conductor_id", e.target.value)}
            placeholder={
              loadingConductores
                ? "Cargando conductores..."
                : "Selecciona un conductor"
            }
            options={conductorOptions}
            disabled={loadingConductores}
          />
          <NegSelect
            label="Bus asignado *"
            name="bus_id"
            value={form.bus_id}
            onChange={(e) => setField("bus_id", e.target.value)}
            placeholder={
              !form.conductor_id
                ? "Selecciona primero un conductor"
                : loadingBuses
                  ? "Cargando buses..."
                  : busOptions.length === 0
                    ? "Sin buses asignados"
                    : "Selecciona un bus"
            }
            options={busOptions}
            disabled={!form.conductor_id || loadingBuses || busOptions.length === 0}
          />
        </div>
      </NegCard>

      <NegCard>
        <NegSectionHeader
          title="Horario"
          hint="El turno debe cubrir la fecha y hora en la que el conductor vaya a iniciarlo."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NegInput
            label="Inicio *"
            name="inicio"
            type="datetime-local"
            value={form.inicio}
            onChange={(e) => setField("inicio", e.target.value)}
            iconStart="schedule"
          />
          <NegInput
            label="Fin *"
            name="fin"
            type="datetime-local"
            value={form.fin}
            onChange={(e) => setField("fin", e.target.value)}
            iconStart="event"
            error={
              form.fin && form.inicio && new Date(form.fin) <= new Date(form.inicio)
                ? "La fecha/hora de fin debe ser posterior al inicio."
                : undefined
            }
          />
        </div>
      </NegCard>

      <NegCard>
        <NegSectionHeader
          title="Estado y notas"
          hint="Para probar HU-2-006 normalmente te conviene dejarlo en estado programado."
        />
        <div className="space-y-4">
          <NegSelect
            label="Estado inicial"
            name="estado"
            value={form.estado}
            onChange={(e) => setField("estado", e.target.value)}
            options={ESTADOS_TURNO}
          />
          <NegTextarea
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={(e) => setField("observaciones", e.target.value)}
            placeholder="Nota opcional del turno o del bus asignado."
            rows={4}
            maxLength={1000}
            hint={`${form.observaciones.length}/1000`}
          />
        </div>
      </NegCard>

      <div className="flex items-center justify-end gap-3 pt-2">
        <NegButton
          variant="outlined"
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </NegButton>
        <NegButton
          type="submit"
          icon={loading ? "hourglass_top" : isEdit ? "save" : "add"}
          disabled={!canSubmit || loading}
        >
          {loading
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Crear turno"}
        </NegButton>
      </div>
    </form>
  );
}
