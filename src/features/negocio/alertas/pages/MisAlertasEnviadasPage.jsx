import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegChip,
  NegEmptyState,
  NegSectionHeader,
} from "../../../../components/negocio";
import { listMisAlertasEnviadas } from "../alertasService";

const ESTADO_LABEL = {
  borrador: "Borrador",
  programada: "Programada",
  enviada: "Enviada",
  cancelada: "Cancelada",
};

const ESTADO_TONE = {
  borrador: "neutral",
  programada: "secondary",
  enviada: "success",
  cancelada: "danger",
};

const ALCANCE_LABEL = {
  todos: "Todos los usuarios",
  por_ruta: "Por ruta",
  por_ciudad: "Por ciudad",
};

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
 * HU 3-008 — Mis alertas enviadas + estadisticas.
 * Lista las alertas creadas por el admin con su contador de
 * destinatarios, leidos y porcentaje de lectura.
 */
export default function MisAlertasEnviadasPage() {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    listMisAlertasEnviadas()
      .then((data) => {
        if (activo) setAlertas(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (activo) {
          setError(
            err?.response?.data?.message ??
              "No se pudieron cargar las alertas.",
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

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-008"
        title="Mis alertas enviadas"
        subtitle="Consulta el estado, el alcance y las estadisticas de entrega y lectura de tus alertas masivas."
        actions={
          <NegButton
            variant="filled"
            icon="campaign"
            onClick={() => navigate("/negocio/alertas/nueva")}
          >
            Nueva alerta
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
          title="Alertas"
          hint={
            loading
              ? "Cargando..."
              : `${alertas.length} alerta${alertas.length === 1 ? "" : "s"}`
          }
        />

        {loading ? (
          <div className="py-10 text-center text-sm text-neg-on-surface-variant">
            Cargando...
          </div>
        ) : alertas.length === 0 ? (
          <NegEmptyState
            icon="campaign"
            title="Aun no has enviado alertas"
            description="Cuando crees una alerta apareceran aqui con sus estadisticas."
          />
        ) : (
          <ul className="space-y-3">
            {alertas.map((a) => {
              const pct =
                a.total_destinatarios > 0
                  ? Math.round((a.total_leidos / a.total_destinatarios) * 100)
                  : 0;
              return (
                <li
                  key={a.id}
                  className="rounded-2xl border border-neg-outline-variant bg-neg-surface-container-lowest p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-neg-on-surface">
                          {a.titulo}
                        </h3>
                        {a.urgente && (
                          <NegChip tone="danger" icon="priority_high">
                            Urgente
                          </NegChip>
                        )}
                        <NegChip
                          tone={ESTADO_TONE[a.estado] ?? "neutral"}
                          icon="info"
                        >
                          {ESTADO_LABEL[a.estado] ?? a.estado}
                        </NegChip>
                      </div>
                      <p className="text-sm text-neg-on-surface-variant mt-2 line-clamp-2">
                        {a.contenido}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-neg-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            adjust
                          </span>
                          {ALCANCE_LABEL[a.alcance] ?? a.alcance}
                          {a.ruta_nombre ? ` · ${a.ruta_nombre}` : ""}
                          {a.ciudad ? ` · ${a.ciudad}` : ""}
                        </span>
                        {a.programada_para && (
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              schedule
                            </span>
                            Programada para {formatFechaHora(a.programada_para)}
                          </span>
                        )}
                        {a.enviada_en && (
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              send
                            </span>
                            Enviada el {formatFechaHora(a.enviada_en)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {a.estado === "enviada" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-neg-outline-variant/60">
                      <div className="rounded-xl bg-neg-surface-container p-3">
                        <p className="text-xs text-neg-on-surface-variant">
                          Destinatarios
                        </p>
                        <p className="text-lg font-semibold text-neg-on-surface">
                          {a.total_destinatarios}
                        </p>
                      </div>
                      <div className="rounded-xl bg-neg-surface-container p-3">
                        <p className="text-xs text-neg-on-surface-variant">
                          Leidos
                        </p>
                        <p className="text-lg font-semibold text-neg-on-surface">
                          {a.total_leidos}
                        </p>
                      </div>
                      <div className="rounded-xl bg-neg-surface-container p-3">
                        <p className="text-xs text-neg-on-surface-variant">
                          % lectura
                        </p>
                        <p className="text-lg font-semibold text-neg-on-surface">
                          {pct}%
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </NegCard>
    </section>
  );
}
