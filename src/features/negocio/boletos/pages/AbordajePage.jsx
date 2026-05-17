import { useEffect, useMemo, useState } from "react";
import NegPageHeader from "../../../../components/negocio/NegPageHeader";
import NegCard from "../../../../components/negocio/NegCard";
import NegSelect from "../../../../components/negocio/NegSelect";
import MetodoPagoSelector from "../../recargas/components/MetodoPagoSelector";
import {
  listBuses,
  listMisMetodosPagoCiudadano,
  getDisponibilidadBus,
} from "../../_services/catalogosService";
import { listParaderos } from "../../paraderos/paraderosService";
import { abordarBus } from "../boletosService";
import { formatCurrency, formatDateTime } from "../../_utils/format";

function getErrorMessage(error) {
  const message = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(message)) return message.join(". ");
  return message || "No fue posible procesar el abordaje.";
}

export default function AbordajePage() {
  const [buses, setBuses] = useState([]);
  const [paraderos, setParaderos] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    bus_id: "",
    paradero_id: "",
    metodo_pago_ciudadano_id: "",
  });

  const [disponibilidad, setDisponibilidad] = useState(null);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [dispError, setDispError] = useState("");

  // Consulta disponibilidad cada vez que cambia el bus
  useEffect(() => {
    if (!form.bus_id) {
      setDisponibilidad(null);
      setDispError("");
      return;
    }
    let alive = true;
    setLoadingDisp(true);
    setDispError("");
    getDisponibilidadBus(Number(form.bus_id))
      .then((data) => {
        if (alive) setDisponibilidad(data);
      })
      .catch((err) => {
        if (alive) {
          setDisponibilidad(null);
          setDispError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (alive) setLoadingDisp(false);
      });
    return () => {
      alive = false;
    };
  }, [form.bus_id]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setLoadError("");
      try {
        const [busesData, paraderosData, metodosData] = await Promise.all([
          listBuses(),
          listParaderos(),
          listMisMetodosPagoCiudadano(),
        ]);

        if (!active) return;
        setBuses(Array.isArray(busesData) ? busesData : []);
        setParaderos(Array.isArray(paraderosData) ? paraderosData : []);
        setMetodos(Array.isArray(metodosData) ? metodosData : []);
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

  const metodoSeleccionado = useMemo(
    () =>
      metodos.find(
        (metodo) => String(metodo.id) === String(form.metodo_pago_ciudadano_id),
      ) ?? null,
    [metodos, form.metodo_pago_ciudadano_id],
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

  // Si ya cargamos disponibilidad y el bus está lleno, bloqueamos el submit.
  // (Si todavía está cargando, dejamos pasar — el backend valida de nuevo.)
  const busLleno = disponibilidad && !disponibilidad.puede_abordar;
  const canSubmit =
    form.bus_id &&
    form.paradero_id &&
    form.metodo_pago_ciudadano_id &&
    !submitting &&
    !busLleno;

  const handleChange = (field) => (eventOrValue) => {
    const value =
      typeof eventOrValue === "object" && eventOrValue?.target
        ? eventOrValue.target.value
        : eventOrValue;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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
      const response = await abordarBus({
        bus_id: Number(form.bus_id),
        paradero_id: Number(form.paradero_id),
        metodo_pago_ciudadano_id: Number(form.metodo_pago_ciudadano_id),
      });

      setSuccess(response);
      setMetodos((current) =>
        current.map((metodo) =>
          metodo.id === Number(form.metodo_pago_ciudadano_id)
            ? { ...metodo, saldo_actual: response.saldo_restante }
            : metodo,
        ),
      );
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
        title="Abordaje y generación de boleto"
        subtitle="Selecciona el bus, el paradero y tu método de pago para validar el abordaje. El sistema buscará automáticamente la programación activa y generará tu boleto."
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <NegCard variant="elevated" className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-neg-on-surface">
              Validar abordaje
            </h2>
            <p className="text-sm text-neg-on-surface-variant mt-1">
              El abordaje se registrará en el paradero seleccionado con fecha y
              hora exacta.
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-neg-on-surface-variant">
              Cargando buses, paraderos y métodos de pago...
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NegSelect
                  name="bus_id"
                  label="Bus donde abordas"
                  value={form.bus_id}
                  onChange={handleChange("bus_id")}
                  options={busOptions}
                  placeholder="Selecciona un bus"
                />
                <NegSelect
                  name="paradero_id"
                  label="Paradero de abordaje"
                  value={form.paradero_id}
                  onChange={handleChange("paradero_id")}
                  options={paraderoOptions}
                  placeholder="Selecciona un paradero"
                />
              </div>

              {form.bus_id && (
                <DisponibilidadBus
                  disponibilidad={disponibilidad}
                  loading={loadingDisp}
                  error={dispError}
                />
              )}

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-neg-on-surface">
                    Método de pago
                  </h3>
                  <p className="text-xs text-neg-on-surface-variant mt-1">
                    Se validará el saldo disponible y se descontará la tarifa del
                    recorrido activo.
                  </p>
                </div>
                <MetodoPagoSelector
                  value={Number(form.metodo_pago_ciudadano_id) || null}
                  onChange={(value) =>
                    handleChange("metodo_pago_ciudadano_id")(String(value))
                  }
                  options={metodos}
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
                    confirmation_number
                  </span>
                  {submitting ? "Generando boleto..." : "Validar abordaje"}
                </button>
              </div>
            </form>
          )}
        </NegCard>

        <div className="space-y-6">
          <NegCard variant="outlined" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neg-on-surface">
                Resumen de la validación
              </h2>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                Antes de confirmar, revisa los datos del abordaje.
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

              <div className="rounded-xl bg-neg-surface-container p-4">
                <p className="text-xs uppercase tracking-widest text-neg-on-surface-variant mb-1">
                  Saldo disponible
                </p>
                <p className="font-semibold text-neg-on-surface">
                  {metodoSeleccionado
                    ? formatCurrency(Number(metodoSeleccionado.saldo_actual))
                    : "Selecciona un método de pago"}
                </p>
              </div>
            </div>
          </NegCard>

          {success && (
            <NegCard
              variant="outlined"
              className="space-y-4 border-emerald-300 bg-emerald-50/80"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600">
                  check_circle
                </span>
                <div>
                  <p className="text-lg font-semibold text-emerald-900">
                    {success.mensaje}
                  </p>
                  <p className="text-sm text-emerald-800/90">
                    Tu boleto fue generado correctamente y el abordaje quedó
                    registrado.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-700/80 mb-1">
                    Saldo restante
                  </p>
                  <p className="font-semibold text-emerald-950">
                    {formatCurrency(Number(success.saldo_restante))}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-700/80 mb-1">
                    Tarifa descontada
                  </p>
                  <p className="font-semibold text-emerald-950">
                    {formatCurrency(Number(success.boleto?.precio ?? 0))}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-700/80 mb-1">
                    Ruta activa
                  </p>
                  <p className="font-semibold text-emerald-950">
                    {success.programacion?.ruta?.nombre ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-700/80 mb-1">
                    Bus
                  </p>
                  <p className="font-semibold text-emerald-950">
                    {success.programacion?.bus?.placa ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-700/80 mb-1">
                    Paradero de abordaje
                  </p>
                  <p className="font-semibold text-emerald-950">
                    {success.paradero?.nombre ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-700/80 mb-1">
                    Hora de validación
                  </p>
                  <p className="font-semibold text-emerald-950">
                    {formatDateTime(success.validacion?.fecha)}
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

function DisponibilidadBus({ disponibilidad, loading, error }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-neg-outline-variant/50 bg-neg-surface-container-low px-4 py-3 text-sm text-neg-on-surface-variant">
        Consultando disponibilidad del bus...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-neg-error/40 bg-neg-error-container/40 px-4 py-3 text-sm text-neg-on-error-container">
        {error}
      </div>
    );
  }
  if (!disponibilidad) return null;

  const { bus, programacion_activa, ocupacion, disponibilidad: disp, puede_abordar, motivo } =
    disponibilidad;

  const okStyle = puede_abordar
    ? "border-emerald-300 bg-emerald-50/70"
    : "border-rose-300 bg-rose-50/70";
  const okBadge = puede_abordar
    ? "bg-emerald-600 text-white"
    : "bg-rose-600 text-white";

  // Barra de ocupación visual
  const pctOcupado =
    bus.capacidad_maxima > 0
      ? Math.min(100, Math.round((ocupacion.total / bus.capacidad_maxima) * 100))
      : 0;

  return (
    <div className={`rounded-2xl border ${okStyle} p-4`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-neg-on-surface-variant">
            Disponibilidad del bus
          </p>
          <p className="font-semibold text-neg-on-surface mt-0.5">
            {bus.placa} · {bus.modelo}
          </p>
          {programacion_activa && (
            <p className="text-xs text-neg-on-surface-variant mt-1">
              Ruta activa: <strong>{programacion_activa.ruta.nombre}</strong>
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${okBadge}`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {puede_abordar ? "check_circle" : "block"}
          </span>
          {puede_abordar ? "Puede abordar" : "No puede abordar"}
        </span>
      </div>

      {!puede_abordar && motivo && (
        <p className="text-sm text-rose-900 mb-3">{motivo}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
            A bordo
          </p>
          <p className="font-headline text-xl font-bold text-neg-on-surface">
            {ocupacion.total}
            <span className="text-sm font-medium text-neg-on-surface-variant ml-1">
              / {bus.capacidad_maxima}
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
            Sentados
          </p>
          <p className="font-headline text-xl font-bold text-neg-on-surface">
            {ocupacion.sentados}
            <span className="text-sm font-medium text-neg-on-surface-variant ml-1">
              / {bus.capacidad_sentados}
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
            Parados
          </p>
          <p className="font-headline text-xl font-bold text-neg-on-surface">
            {ocupacion.parados}
            <span className="text-sm font-medium text-neg-on-surface-variant ml-1">
              / {bus.capacidad_parados}
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-neg-on-surface-variant">
            Disponibles
          </p>
          <p className="font-headline text-xl font-bold text-neg-on-surface">
            {disp.total}
          </p>
          <p className="text-[10px] text-neg-on-surface-variant mt-0.5">
            {disp.sentados} sent · {disp.parados} par
          </p>
        </div>
      </div>

      <div>
        <div className="h-2 rounded-full bg-white/80 overflow-hidden">
          <div
            className={`h-full ${puede_abordar ? "bg-emerald-600" : "bg-rose-600"}`}
            style={{ width: `${pctOcupado}%` }}
          />
        </div>
        <p className="text-[11px] text-neg-on-surface-variant mt-1">
          {pctOcupado}% de ocupación
        </p>
      </div>
    </div>
  );
}
