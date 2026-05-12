import { useEffect, useState } from "react";
import {
  NegCard,
  NegButton,
  NegInput,
  NegSelect,
  NegSectionHeader,
} from "../../../../components/negocio";
import { listBuses, listRutas } from "../programacionesService";

const RECURRENCIAS = [
  { value: "unica", label: "Única vez" },
  { value: "lunes_viernes", label: "Lunes a viernes" },
  { value: "fines_semana", label: "Fines de semana" },
  { value: "diaria", label: "Diaria" },
];

function toDateStr(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toISOString().slice(0, 10);
}

function toTimeStr(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const EMPTY = {
  ruta_id: "",
  bus_id: "",
  fecha: "",
  hora_salida_time: "",
  recurrencia: "unica",
  margen_tolerancia_min: "5",
};

export default function ProgramacionForm({ initialData, onSubmit, onCancel, loading }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(EMPTY);
  const [buses, setBuses] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  useEffect(() => {
    Promise.all([listBuses(), listRutas()])
      .then(([b, r]) => {
        setBuses(Array.isArray(b) ? b : []);
        setRutas(Array.isArray(r) ? r : []);
      })
      .finally(() => setLoadingOpts(false));
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        ruta_id: String(initialData.ruta_id ?? ""),
        bus_id: String(initialData.bus_id ?? ""),
        fecha: toDateStr(initialData.hora_salida),
        hora_salida_time: toTimeStr(initialData.hora_salida),
        recurrencia: initialData.recurrencia ?? "unica",
        margen_tolerancia_min: String(initialData.margen_tolerancia_min ?? 5),
      });
    } else {
      setForm(EMPTY);
    }
  }, [initialData]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const rutaSeleccionada = rutas.find((r) => String(r.id) === form.ruta_id);

  const calcHoraLlegada = () => {
    if (!form.fecha || !form.hora_salida_time) return null;
    const salida = new Date(`${form.fecha}T${form.hora_salida_time}:00`);
    const minutos = rutaSeleccionada?.tiempo_estimado_min ?? 60;
    return new Date(salida.getTime() + minutos * 60_000);
  };

  const horaLlegada = calcHoraLlegada();

  const canSubmit = form.ruta_id && form.bus_id && form.fecha && form.hora_salida_time;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    const horaSalida = new Date(`${form.fecha}T${form.hora_salida_time}:00`);
    const horaLlegadaFinal = horaLlegada ?? new Date(horaSalida.getTime() + 60 * 60_000);
    onSubmit({
      bus_id: Number(form.bus_id),
      ruta_id: Number(form.ruta_id),
      hora_salida: horaSalida.toISOString(),
      hora_llegada_estimada: horaLlegadaFinal.toISOString(),
      recurrencia: form.recurrencia,
      margen_tolerancia_min: Number(form.margen_tolerancia_min) || 5,
    });
  };

  const busOptions = buses.map((b) => ({
    value: String(b.id),
    label: `${b.placa} — ${b.modelo}`,
  }));
  const rutaOptions = rutas.map((r) => ({
    value: String(r.id),
    label: `${r.nombre} (${r.codigo_ruta})`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Asignación */}
      <NegCard>
        <NegSectionHeader title="Asignación de ruta y bus" />
        {loadingOpts ? (
          <p className="text-sm text-neg-on-surface-variant">Cargando opciones...</p>
        ) : (
          <div className="space-y-4">
            <NegSelect
              label="Ruta *"
              name="ruta_id"
              value={form.ruta_id}
              onChange={(e) => setField("ruta_id", e.target.value)}
              placeholder="Seleccioná una ruta"
              options={rutaOptions}
            />
            {rutaSeleccionada && (
              <p className="text-xs text-neg-primary flex items-center gap-1 -mt-2">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                Tiempo estimado: {rutaSeleccionada.tiempo_estimado_min ?? 60} min · Tarifa: $
                {Number(rutaSeleccionada.tarifa).toLocaleString("es-CO")}
              </p>
            )}
            <NegSelect
              label="Bus *"
              name="bus_id"
              value={form.bus_id}
              onChange={(e) => setField("bus_id", e.target.value)}
              placeholder="Seleccioná un bus"
              options={busOptions}
            />
          </div>
        )}
      </NegCard>

      {/* Horario */}
      <NegCard>
        <NegSectionHeader title="Horario y recurrencia" />
        <div className="grid grid-cols-2 gap-4">
          <NegInput
            label="Fecha *"
            name="fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => setField("fecha", e.target.value)}
            className="col-span-2"
          />
          <NegInput
            label="Hora de salida *"
            name="hora_salida_time"
            type="time"
            value={form.hora_salida_time}
            onChange={(e) => setField("hora_salida_time", e.target.value)}
          />
          <div className="flex flex-col justify-end">
            {horaLlegada ? (
              <p className="text-xs text-neg-on-surface-variant pb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">flag</span>
                Llegada est.:{" "}
                {horaLlegada.toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            ) : (
              <p className="text-xs text-neg-on-surface-variant/50 pb-2">
                Llegada estimada: —
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <NegSelect
            label="Recurrencia"
            name="recurrencia"
            value={form.recurrencia}
            onChange={(e) => setField("recurrencia", e.target.value)}
            options={RECURRENCIAS}
          />
          <NegInput
            label="Margen tolerancia (min)"
            name="margen_tolerancia_min"
            type="number"
            value={form.margen_tolerancia_min}
            onChange={(e) => setField("margen_tolerancia_min", e.target.value)}
            placeholder="5"
            iconStart="timer"
          />
        </div>
      </NegCard>

      <div className="flex items-center justify-end gap-3 pt-2">
        <NegButton variant="outlined" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </NegButton>
        <NegButton
          type="submit"
          icon={loading ? "hourglass_top" : isEdit ? "save" : "add"}
          disabled={!canSubmit || loading}
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear programación"}
        </NegButton>
      </div>
    </form>
  );
}
