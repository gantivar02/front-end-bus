import { useEffect, useMemo, useState } from "react";
import NegPageHeader from "../../../../components/negocio/NegPageHeader";
import NegCard from "../../../../components/negocio/NegCard";
import NegSelect from "../../../../components/negocio/NegSelect";
import { listBuses } from "../../_services/catalogosService";
import { listParaderos } from "../../paraderos/paraderosService";
import { registrarDescenso } from "../boletosService";
import { formatDateTime } from "../../_utils/format";

function getErrorMessage(error) {
  const message = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(message)) return message.join(". ");
  return message || "No fue posible completar el descenso.";
}

export default function DescensoPage() {
  const [buses, setBuses] = useState([]);
  const [paraderos, setParaderos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    bus_id: "",
    paradero_id: "",
  });

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setLoadError("");
      try {
        const [busesData, paraderosData] = await Promise.all([
          listBuses(),
          listParaderos(),
        ]);

        if (!active) return;
        setBuses(Array.isArray(busesData) ? busesData : []);
        setParaderos(Array.isArray(paraderosData) ? paraderosData : []);
      } catch (error) {
        if (!active) return;
        setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const busOptions = useMemo(
    () =>
      buses.map((bus) => ({
        value: String(bus.id),
        label: `${bus.placa} · ${bus.modelo ?? "Bus"}`,
      })),
    [buses],
  );

  const paraderoOptions = useMemo(
    () =>
      paraderos.map((paradero) => ({
        value: String(paradero.id),
        label: `${paradero.nombre} · ${paradero.tipo ?? "paradero"}`,
      })),
    [paraderos],
  );

  const busSeleccionado = useMemo(
    () => buses.find((bus) => String(bus.id) === String(form.bus_id)) ?? null,
    [buses, form.bus_id],
  );

  const paraderoSeleccionado = useMemo(
    () =>
      paraderos.find((paradero) => String(paradero.id) === String(form.paradero_id)) ??
      null,
    [paraderos, form.paradero_id],
  );

  const canSubmit = form.bus_id && form.paradero_id && !submitting;

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitError("");
    setSuccess(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");
    setSuccess(null);

    try {
      const response = await registrarDescenso({
        bus_id: Number(form.bus_id),
        paradero_id: Number(form.paradero_id),
      });
      setSuccess(response);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="Uso del servicio"
        title="Descenso y cierre de viaje"
        subtitle="Selecciona el bus y el paradero donde desciendes para cerrar tu viaje activo y liberar el cupo ocupado."
      />

      {loadError && (
        <NegCard
          variant="outlined"
          className="border-neg-error/40 bg-neg-error-container/40 text-neg-on-error-container"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-neg-error">
              error
            </span>
            <div>
              <p className="font-semibold">No se pudo cargar el formulario</p>
              <p className="text-sm opacity-90">{loadError}</p>
            </div>
          </div>
        </NegCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <NegCard variant="elevated" className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-neg-on-surface">
              Validar descenso
            </h2>
            <p className="text-sm text-neg-on-surface-variant mt-1">
              El sistema identificará tu boleto activo en ese bus y registrará
              el descenso en el paradero seleccionado.
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-neg-on-surface-variant">
              Cargando buses y paraderos...
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NegSelect
                  name="bus_id"
                  label="Bus donde viajas"
                  value={form.bus_id}
                  onChange={handleChange("bus_id")}
                  options={busOptions}
                  placeholder="Selecciona un bus"
                />
                <NegSelect
                  name="paradero_id"
                  label="Paradero de descenso"
                  value={form.paradero_id}
                  onChange={handleChange("paradero_id")}
                  options={paraderoOptions}
                  placeholder="Selecciona un paradero"
                />
              </div>

              {submitError && (
                <div className="rounded-2xl border border-neg-error/40 bg-neg-error-container/40 px-4 py-3 text-sm text-neg-on-error-container">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neg-primary text-neg-on-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  {submitting ? "Cerrando viaje..." : "Validar descenso"}
                </button>
              </div>
            </form>
          )}
        </NegCard>

        <div className="space-y-6">
          <NegCard variant="outlined" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neg-on-surface">
                Resumen del cierre
              </h2>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                Revisa el bus y el paradero antes de completar el descenso.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-neg-surface-container p-4">
                <p className="text-xs uppercase tracking-widest text-neg-on-surface-variant mb-1">
                  Bus
                </p>
                <p className="font-semibold text-neg-on-surface">
                  {busSeleccionado
                    ? `${busSeleccionado.placa} · ${busSeleccionado.modelo ?? "Bus"}`
                    : "Selecciona un bus"}
                </p>
              </div>

              <div className="rounded-xl bg-neg-surface-container p-4">
                <p className="text-xs uppercase tracking-widest text-neg-on-surface-variant mb-1">
                  Paradero
                </p>
                <p className="font-semibold text-neg-on-surface">
                  {paraderoSeleccionado?.nombre ?? "Selecciona un paradero"}
                </p>
              </div>
            </div>
          </NegCard>

          {success && (
            <NegCard
              variant="outlined"
              className="space-y-4 border-sky-300 bg-sky-50/80"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-sky-700">
                  task_alt
                </span>
                <div>
                  <p className="text-lg font-semibold text-sky-950">
                    {success.mensaje}
                  </p>
                  <p className="text-sm text-sky-900/90">
                    El viaje quedó cerrado y el cupo del bus vuelve a estar
                    disponible para otro pasajero.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-sky-700/80 mb-1">
                    Estado del boleto
                  </p>
                  <p className="font-semibold text-sky-950">
                    {success.boleto?.estado ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-sky-700/80 mb-1">
                    Tiempo total
                  </p>
                  <p className="font-semibold text-sky-950">
                    {success.tiempo_total_minutos ?? 0} min
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-sky-700/80 mb-1">
                    Ruta
                  </p>
                  <p className="font-semibold text-sky-950">
                    {success.programacion?.ruta?.nombre ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-sky-700/80 mb-1">
                    Bus
                  </p>
                  <p className="font-semibold text-sky-950">
                    {success.programacion?.bus?.placa ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-sky-700/80 mb-1">
                    Paradero de descenso
                  </p>
                  <p className="font-semibold text-sky-950">
                    {success.paradero?.nombre ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-sky-700/80 mb-1">
                    Hora de finalización
                  </p>
                  <p className="font-semibold text-sky-950">
                    {formatDateTime(success.boleto?.fecha_finalizacion)}
                  </p>
                </div>
              </div>
            </NegCard>
          )}
        </div>
      </div>
    </section>
  );
}
