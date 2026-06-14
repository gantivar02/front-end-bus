import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegInput,
  NegSectionHeader,
  NegEmptyState,
} from "../../../../components/negocio";
import { agendarCita, obtenerDisponibilidad } from "../citasService";

const TIPOS_ATENCION = [
  {
    valor: "presencial",
    icono: "store",
    titulo: "Presencial",
    descripcion: "Te atendemos en nuestra oficina.",
  },
  {
    valor: "virtual",
    icono: "videocam",
    titulo: "Virtual",
    descripcion: "Por Google Meet (link automatico).",
  },
];

const TIPOS_CONSULTA = [
  { valor: "auto", label: "Que la IA lo decida por mi" },
  { valor: "problema_tarjeta", label: "Problema con tarjeta" },
  { valor: "reclamo", label: "Reclamo" },
  { valor: "reembolso", label: "Reembolso" },
  { valor: "otro", label: "Otro" },
];

const todayIso = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDaysIso = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatHora = (iso) =>
  new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * HU 3-012a — Agendar cita con el asesor.
 * Wizard de 4 pasos: tipo de atencion -> fecha -> slot -> motivo +
 * confirmacion. Si tipo_consulta queda en "auto", el backend usa
 * LangChain para deducirlo a partir del texto del motivo.
 */
export default function AgendarCitaPage() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);
  const [tipoAtencion, setTipoAtencion] = useState(null);
  const [tipoConsulta, setTipoConsulta] = useState("auto");
  const [fecha, setFecha] = useState(todayIso());
  const [slots, setSlots] = useState([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState(null);
  const [motivo, setMotivo] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  const minFecha = todayIso();
  const maxFecha = addDaysIso(10);

  useEffect(() => {
    if (paso !== 3) return;
    setLoadingSlots(true);
    setErrorSlots(null);
    setSlots([]);
    obtenerDisponibilidad(fecha)
      .then((data) => setSlots(Array.isArray(data.slots) ? data.slots : []))
      .catch((err) =>
        setErrorSlots(
          err?.response?.data?.message ??
            "No se pudo cargar la disponibilidad.",
        ),
      )
      .finally(() => setLoadingSlots(false));
  }, [paso, fecha]);

  const puedeAvanzar = useMemo(() => {
    if (paso === 1) return Boolean(tipoAtencion);
    if (paso === 2) return Boolean(fecha);
    if (paso === 3) return Boolean(slotSeleccionado);
    return motivo.trim().length > 0;
  }, [paso, tipoAtencion, fecha, slotSeleccionado, motivo]);

  const handleConfirmar = async () => {
    if (!puedeAvanzar) return;
    setEnviando(true);
    setError(null);
    try {
      const payload = {
        tipo_atencion: tipoAtencion,
        fecha_inicio: slotSeleccionado.inicio,
        motivo: motivo.trim(),
      };
      if (tipoConsulta !== "auto") payload.tipo_consulta = tipoConsulta;
      const data = await agendarCita(payload);
      setResultado(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "No se pudo agendar la cita.",
      );
    } finally {
      setEnviando(false);
    }
  };

  if (resultado) {
    return (
      <section className="space-y-6">
        <NegPageHeader
          eyebrow="HU 3-012a"
          title="Cita agendada"
          subtitle="Hemos enviado los detalles a tu correo y al calendario del asesor."
        />
        <NegCard className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-3xl">
              event_available
            </span>
            <div>
              <h2 className="text-lg font-semibold text-neg-on-surface">
                Tu cita esta confirmada
              </h2>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                Recibiras un correo con la invitacion. Tambien puedes verla en
                la seccion <strong>Mis citas</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-neg-outline-variant/60">
            <div className="rounded-xl bg-neg-surface-container p-3">
              <p className="text-xs text-neg-on-surface-variant">
                Tipo de atencion
              </p>
              <p className="text-sm font-semibold text-neg-on-surface capitalize">
                {resultado.cita.tipo_atencion}
              </p>
            </div>
            <div className="rounded-xl bg-neg-surface-container p-3">
              <p className="text-xs text-neg-on-surface-variant">
                Categoria detectada
              </p>
              <p className="text-sm font-semibold text-neg-on-surface">
                {resultado.tipo_consulta_detectado.replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-xl bg-neg-surface-container p-3">
              <p className="text-xs text-neg-on-surface-variant">Fecha</p>
              <p className="text-sm font-semibold text-neg-on-surface">
                {new Date(resultado.cita.fecha_inicio).toLocaleString("es-CO")}
              </p>
            </div>
            <div className="rounded-xl bg-neg-surface-container p-3">
              <p className="text-xs text-neg-on-surface-variant">Estado</p>
              <p className="text-sm font-semibold text-neg-on-surface capitalize">
                {resultado.cita.estado}
              </p>
            </div>
          </div>

          {resultado.meet_link && (
            <div className="rounded-xl border border-neg-primary/40 bg-neg-primary-container/30 p-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-neg-primary">
                videocam
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neg-on-surface-variant">
                  Enlace de Google Meet
                </p>
                <a
                  href={resultado.meet_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-neg-primary underline break-all"
                >
                  {resultado.meet_link}
                </a>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <NegButton
              variant="outlined"
              icon="list_alt"
              onClick={() => navigate("/negocio/citas/mis-citas")}
            >
              Ver mis citas
            </NegButton>
            {resultado.evento_url && (
              <NegButton
                variant="filled"
                icon="open_in_new"
                onClick={() => window.open(resultado.evento_url, "_blank")}
              >
                Abrir en Calendar
              </NegButton>
            )}
          </div>
        </NegCard>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-012a"
        title="Agendar cita de atencion"
        subtitle="Reserva tu cita con el asesor en 4 pasos. Crearemos el evento en Google Calendar."
        actions={
          <NegButton
            variant="text"
            icon="list_alt"
            onClick={() => navigate("/negocio/citas/mis-citas")}
          >
            Ver mis citas
          </NegButton>
        }
      />

      <NegCard padding="none">
        <div className="flex border-b border-neg-outline-variant text-sm">
          {[1, 2, 3, 4].map((p) => (
            <div
              key={p}
              className={`flex-1 px-4 py-3 text-center ${
                paso === p
                  ? "border-b-2 border-neg-primary text-neg-primary font-semibold"
                  : "text-neg-on-surface-variant"
              }`}
            >
              {p}.{" "}
              {p === 1
                ? "Tipo"
                : p === 2
                  ? "Fecha"
                  : p === 3
                    ? "Hora"
                    : "Motivo"}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-neg-error/40 bg-neg-error-container/40 px-4 py-3 text-sm text-neg-on-error-container flex items-center gap-2">
              <span className="material-symbols-outlined text-neg-error text-[18px]">
                error
              </span>
              {error}
            </div>
          )}

          {paso === 1 && (
            <>
              <NegSectionHeader
                title="Tipo de atencion"
                hint="Como prefieres que sea la cita."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TIPOS_ATENCION.map((t) => (
                  <button
                    key={t.valor}
                    type="button"
                    onClick={() => setTipoAtencion(t.valor)}
                    className={`text-left rounded-2xl border p-4 transition-colors ${
                      tipoAtencion === t.valor
                        ? "border-neg-primary bg-neg-primary-container/30"
                        : "border-neg-outline-variant hover:bg-neg-surface-container"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-2xl ${
                          tipoAtencion === t.valor
                            ? "text-neg-primary"
                            : "text-neg-on-surface-variant"
                        }`}
                      >
                        {t.icono}
                      </span>
                      <div>
                        <p className="font-semibold text-neg-on-surface">
                          {t.titulo}
                        </p>
                        <p className="text-xs text-neg-on-surface-variant">
                          {t.descripcion}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <NegSectionHeader
                title="Selecciona el dia"
                hint="Horario laboral lunes a viernes, proximos 10 dias."
              />
              <NegInput
                label="Fecha"
                type="date"
                min={minFecha}
                max={maxFecha}
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value);
                  setSlotSeleccionado(null);
                }}
              />
            </>
          )}

          {paso === 3 && (
            <>
              <NegSectionHeader
                title="Selecciona una hora"
                hint="Cruzamos la agenda del asesor con las citas ya reservadas."
              />
              {loadingSlots ? (
                <div className="py-10 text-center text-sm text-neg-on-surface-variant">
                  Cargando disponibilidad...
                </div>
              ) : errorSlots ? (
                <div className="text-sm text-neg-error">{errorSlots}</div>
              ) : slots.length === 0 ? (
                <NegEmptyState
                  icon="event_busy"
                  title="No hay slots disponibles"
                  description="Prueba con otra fecha. El asesor no atiende sabados ni domingos."
                />
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {slots.map((s) => {
                    const seleccionado =
                      slotSeleccionado?.inicio === s.inicio;
                    return (
                      <button
                        key={s.inicio}
                        type="button"
                        onClick={() => setSlotSeleccionado(s)}
                        className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                          seleccionado
                            ? "border-neg-primary bg-neg-primary text-neg-on-primary font-semibold"
                            : "border-neg-outline-variant hover:bg-neg-surface-container"
                        }`}
                      >
                        {formatHora(s.inicio)}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {paso === 4 && (
            <>
              <NegSectionHeader
                title="Cuentanos tu motivo"
                hint="Describe brevemente la razon de la cita. La IA detectara la categoria si no la eliges."
              />
              <div className="space-y-2">
                <label className="text-xs font-medium text-neg-on-surface-variant">
                  Categoria
                </label>
                <select
                  className="w-full h-11 rounded-lg border border-neg-outline-variant bg-neg-surface-container-lowest px-3 text-sm"
                  value={tipoConsulta}
                  onChange={(e) => setTipoConsulta(e.target.value)}
                >
                  {TIPOS_CONSULTA.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-neg-on-surface-variant">
                  Motivo
                </label>
                <textarea
                  className="w-full rounded-2xl border border-neg-outline-variant bg-neg-surface-container-lowest p-3 text-sm text-neg-on-surface"
                  rows={4}
                  maxLength={300}
                  placeholder="Ej. Mi tarjeta civica no me deja recargar saldo desde hace tres dias..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                <p className="text-xs text-neg-on-surface-variant text-right">
                  {motivo.length}/300
                </p>
              </div>

              <NegCard
                variant="outlined"
                className="bg-neg-surface-container-low"
              >
                <NegSectionHeader
                  title="Resumen"
                  hint="Confirma antes de agendar."
                />
                <ul className="text-sm text-neg-on-surface space-y-1">
                  <li>
                    <strong>Tipo:</strong> {tipoAtencion}
                  </li>
                  <li>
                    <strong>Fecha:</strong> {fecha}
                  </li>
                  <li>
                    <strong>Hora:</strong>{" "}
                    {slotSeleccionado
                      ? `${formatHora(slotSeleccionado.inicio)} - ${formatHora(
                          slotSeleccionado.fin,
                        )}`
                      : "—"}
                  </li>
                </ul>
              </NegCard>
            </>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <NegButton
              variant="text"
              onClick={() => setPaso((p) => Math.max(1, p - 1))}
              disabled={paso === 1 || enviando}
            >
              Anterior
            </NegButton>
            {paso < 4 ? (
              <NegButton
                variant="filled"
                icon="arrow_forward"
                onClick={() => setPaso((p) => Math.min(4, p + 1))}
                disabled={!puedeAvanzar}
              >
                Siguiente
              </NegButton>
            ) : (
              <NegButton
                variant="filled"
                icon={enviando ? "hourglass_top" : "event_available"}
                onClick={handleConfirmar}
                disabled={!puedeAvanzar || enviando}
              >
                {enviando ? "Agendando..." : "Confirmar cita"}
              </NegButton>
            )}
          </div>
        </div>
      </NegCard>
    </section>
  );
}
