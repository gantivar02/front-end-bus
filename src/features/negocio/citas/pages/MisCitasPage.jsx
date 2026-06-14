import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegEmptyState,
  NegChip,
  NegSectionHeader,
} from "../../../../components/negocio";
import { cancelarMiCita, listMisCitas } from "../citasService";

const ESTADO_TONE = {
  agendada: "secondary",
  confirmada: "primary",
  completada: "neutral",
  cancelada: "danger",
};

const ESTADO_LABEL = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

const formatFechaHora = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
};

const esCancelable = (cita) => {
  if (cita.estado === "cancelada" || cita.estado === "completada") return false;
  return new Date(cita.fecha_inicio).getTime() > Date.now();
};

/**
 * HU 3-012a — Mis citas.
 * Lista las citas del ciudadano (activas + historicas), permite abrir
 * el enlace de Meet (si la cita es virtual) y cancelar las que aun no
 * han pasado. Al cancelar, el backend tambien elimina el evento en
 * Google Calendar para notificar al asesor.
 */
export default function MisCitasPage() {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [confirmando, setConfirmando] = useState(null);

  useEffect(() => {
    let activo = true;
    listMisCitas()
      .then((data) => {
        if (activo) setCitas(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (activo) {
          setError(
            err?.response?.data?.message ?? "No se pudieron cargar tus citas.",
          );
        }
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const handleCancelar = async () => {
    if (!confirmando) return;
    setCancelando(confirmando.id);
    setError(null);
    try {
      await cancelarMiCita(confirmando.id);
      setCitas((prev) =>
        prev.map((c) =>
          c.id === confirmando.id ? { ...c, estado: "cancelada" } : c,
        ),
      );
      setConfirmando(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "No se pudo cancelar la cita.",
      );
    } finally {
      setCancelando(null);
    }
  };

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-012a"
        title="Mis citas"
        subtitle="Consulta, abre el enlace de Meet o cancela tus citas con el asesor."
        actions={
          <NegButton
            variant="filled"
            icon="event"
            onClick={() => navigate("/negocio/citas/agendar")}
          >
            Agendar nueva
          </NegButton>
        }
      />

      {error && (
        <NegCard
          variant="outlined"
          className="border-neg-error/40 bg-neg-error-container/40 text-neg-on-error-container"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-neg-error">
              error
            </span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </NegCard>
      )}

      <NegCard>
        <NegSectionHeader
          title="Tus citas"
          hint={
            loading
              ? "Cargando..."
              : `${citas.length} en total`
          }
        />

        {loading ? (
          <div className="py-10 text-center text-sm text-neg-on-surface-variant">
            Cargando citas...
          </div>
        ) : citas.length === 0 ? (
          <NegEmptyState
            icon="event_busy"
            title="Aun no tienes citas"
            description="Cuando agendes una cita aparecera aqui."
          />
        ) : (
          <ul className="space-y-3">
            {citas.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-neg-outline-variant p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-neg-on-surface">
                        {c.tipo_atencion === "virtual"
                          ? "Cita virtual"
                          : "Cita presencial"}
                      </h3>
                      <NegChip
                        tone={ESTADO_TONE[c.estado] ?? "neutral"}
                        icon="info"
                      >
                        {ESTADO_LABEL[c.estado] ?? c.estado}
                      </NegChip>
                      {c.tipo_consulta && (
                        <NegChip tone="neutral" icon="label">
                          {c.tipo_consulta.replace(/_/g, " ")}
                        </NegChip>
                      )}
                    </div>
                    <p className="text-sm text-neg-on-surface mt-2">
                      <span className="material-symbols-outlined text-[14px] align-middle mr-1">
                        schedule
                      </span>
                      {formatFechaHora(c.fecha_inicio)} ·{" "}
                      {c.duracion_min} min
                    </p>
                    {c.motivo && (
                      <p className="text-sm text-neg-on-surface-variant mt-2 line-clamp-3">
                        {c.motivo}
                      </p>
                    )}
                    {c.gmeet_link && c.estado !== "cancelada" && (
                      <a
                        href={c.gmeet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-neg-primary underline break-all mt-2 inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          videocam
                        </span>
                        Abrir enlace de Meet
                      </a>
                    )}
                  </div>
                  <div className="md:shrink-0 flex flex-wrap gap-2">
                    {esCancelable(c) && (
                      <NegButton
                        variant="outlined"
                        icon="cancel"
                        onClick={() => setConfirmando(c)}
                      >
                        Cancelar
                      </NegButton>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </NegCard>

      {confirmando && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4">
          <NegCard
            className="w-full max-w-md space-y-4"
            variant="elevated"
            padding="lg"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-neg-error text-3xl">
                event_busy
              </span>
              <div>
                <h2 className="text-lg font-semibold text-neg-on-surface">
                  ¿Cancelar esta cita?
                </h2>
                <p className="mt-1 text-sm text-neg-on-surface-variant">
                  Eliminaremos el evento del calendario del asesor y se le
                  notificara automaticamente.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <NegButton
                variant="text"
                onClick={() => setConfirmando(null)}
                disabled={cancelando === confirmando.id}
              >
                Mantener
              </NegButton>
              <NegButton
                variant="filled"
                icon={
                  cancelando === confirmando.id ? "hourglass_top" : "cancel"
                }
                onClick={handleCancelar}
                disabled={cancelando === confirmando.id}
              >
                {cancelando === confirmando.id
                  ? "Cancelando..."
                  : "Si, cancelar"}
              </NegButton>
            </div>
          </NegCard>
        </div>
      )}
    </section>
  );
}
