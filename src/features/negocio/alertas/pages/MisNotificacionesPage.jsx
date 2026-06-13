import { useCallback, useEffect, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegChip,
  NegEmptyState,
  NegSectionHeader,
} from "../../../../components/negocio";
import { useNegocioSocket } from "../../../../hooks/useNegocioSocket";
import {
  listMisNotificaciones,
  marcarNotificacionLeida,
} from "../alertasService";

const formatFechaHora = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(v);
  }
};

/**
 * HU 3-008 (lado ciudadano) — bandeja de notificaciones.
 * Lista las alertas masivas que el ciudadano ha recibido y permite
 * marcarlas como leidas. Escucha "alerta:masiva" por WebSocket para
 * mostrar las nuevas en tiempo real sin recargar.
 */
export default function MisNotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marcando, setMarcando] = useState(null);

  const { on } = useNegocioSocket();

  const cargar = useCallback(() => {
    setLoading(true);
    setError(null);
    listMisNotificaciones()
      .then((data) =>
        setNotificaciones(Array.isArray(data) ? data : []),
      )
      .catch((err) =>
        setError(
          err?.response?.data?.message ??
            "No se pudieron cargar las notificaciones.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Recarga la lista cuando llega una nueva alerta por WS.
  useEffect(() => {
    return on("alerta:masiva", () => {
      cargar();
    });
  }, [on, cargar]);

  const handleMarcarLeida = async (n) => {
    if (n.leido) return;
    setMarcando(n.destinatario_id);
    try {
      await marcarNotificacionLeida(n.destinatario_id);
      setNotificaciones((prev) =>
        prev.map((item) =>
          item.destinatario_id === n.destinatario_id
            ? { ...item, leido: true }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No se pudo marcar como leida.",
      );
    } finally {
      setMarcando(null);
    }
  };

  const noLeidos = notificaciones.filter((n) => !n.leido).length;

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="Bandeja"
        title="Mis notificaciones"
        subtitle="Alertas y novedades importantes del sistema de transporte."
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
          title="Notificaciones"
          hint={
            loading
              ? "Cargando..."
              : `${notificaciones.length} en total · ${noLeidos} sin leer`
          }
        />

        {loading ? (
          <div className="py-10 text-center text-sm text-neg-on-surface-variant">
            Cargando...
          </div>
        ) : notificaciones.length === 0 ? (
          <NegEmptyState
            icon="notifications_off"
            title="Sin notificaciones"
            description="Cuando recibas alertas del sistema apareceran aqui."
          />
        ) : (
          <ul className="space-y-3">
            {notificaciones.map((n) => (
              <li
                key={n.destinatario_id}
                onClick={() => handleMarcarLeida(n)}
                className={`rounded-2xl border p-4 cursor-pointer transition-colors ${
                  n.leido
                    ? "border-neg-outline-variant bg-neg-surface-container-lowest"
                    : "border-neg-primary/40 bg-neg-primary-container/30 hover:bg-neg-primary-container/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      n.urgente
                        ? "bg-neg-error-container text-neg-on-error-container"
                        : "bg-neg-primary-container text-neg-on-primary-container"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {n.urgente ? "priority_high" : "campaign"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`font-semibold ${
                          n.leido
                            ? "text-neg-on-surface-variant"
                            : "text-neg-on-surface"
                        }`}
                      >
                        {n.titulo}
                      </h3>
                      {n.urgente && (
                        <NegChip tone="danger" icon="priority_high">
                          Urgente
                        </NegChip>
                      )}
                      {!n.leido && (
                        <NegChip tone="primary" icon="circle">
                          Nueva
                        </NegChip>
                      )}
                    </div>
                    <p className="text-sm text-neg-on-surface mt-2 whitespace-pre-line">
                      {n.contenido}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-neg-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">
                        schedule
                      </span>
                      {formatFechaHora(n.fecha_envio)}
                      {marcando === n.destinatario_id && (
                        <span className="ml-2">marcando como leida...</span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </NegCard>
    </section>
  );
}
