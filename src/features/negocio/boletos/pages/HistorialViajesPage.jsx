import { useEffect, useMemo, useState } from "react";
import NegPageHeader from "../../../../components/negocio/NegPageHeader";
import NegCard from "../../../../components/negocio/NegCard";
import ViajeMapa from "../components/ViajeMapa";
import { getMiViajeDetalle, listMisViajes } from "../boletosService";
import { formatDateTime } from "../../_utils/format";

function getErrorMessage(error) {
  const message = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(message)) return message.join(". ");
  return message || "No fue posible cargar el historial de viajes.";
}

export default function HistorialViajesPage() {
  const [viajes, setViajes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadViajes() {
      setLoadingList(true);
      setError("");
      try {
        const data = await listMisViajes();
        if (!active) return;
        setViajes(Array.isArray(data) ? data : []);
        setSelectedId((current) =>
          current ?? (Array.isArray(data) && data.length > 0 ? data[0].id : null),
        );
      } catch (loadError) {
        if (!active) return;
        setError(getErrorMessage(loadError));
      } finally {
        if (active) setLoadingList(false);
      }
    }

    loadViajes();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetalle(null);
      return;
    }

    let active = true;

    async function loadDetalle() {
      setLoadingDetail(true);
      setError("");
      try {
        const data = await getMiViajeDetalle(selectedId);
        if (!active) return;
        setDetalle(data);
      } catch (loadError) {
        if (!active) return;
        setError(getErrorMessage(loadError));
      } finally {
        if (active) setLoadingDetail(false);
      }
    }

    loadDetalle();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const selectedViaje = useMemo(
    () => viajes.find((viaje) => viaje.id === selectedId) ?? null,
    [viajes, selectedId],
  );

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="Uso del servicio"
        title="Historial de viajes"
        subtitle="Selecciona uno de tus viajes completados para ver la ruta completa, los paraderos donde validaste y quién operaba el bus."
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
            <div>
              <p className="font-semibold">No se pudo cargar el historial</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </NegCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.25fr] gap-6">
        <NegCard variant="elevated" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neg-on-surface">
              Mis viajes realizados
            </h2>
            <p className="text-sm text-neg-on-surface-variant mt-1">
              Elige un viaje para ver su recorrido completo.
            </p>
          </div>

          {loadingList ? (
            <div className="py-10 text-center text-sm text-neg-on-surface-variant">
              Cargando historial de viajes...
            </div>
          ) : viajes.length === 0 ? (
            <div className="py-10 text-center text-sm text-neg-on-surface-variant">
              Aún no tienes viajes completados para consultar.
            </div>
          ) : (
            <div className="space-y-3">
              {viajes.map((viaje) => {
                const active = viaje.id === selectedId;
                return (
                  <button
                    key={viaje.id}
                    type="button"
                    onClick={() => setSelectedId(viaje.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                      active
                        ? "border-neg-primary bg-neg-primary-container/30"
                        : "border-neg-outline-variant bg-neg-surface-container-lowest hover:border-neg-outline"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-neg-on-surface">
                          {viaje.ruta?.nombre ?? "Ruta"}
                        </p>
                        <p className="text-sm text-neg-on-surface-variant mt-1">
                          Bus {viaje.bus?.placa ?? "—"} · {viaje.tiempo_total_minutos} min
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-neg-on-surface-variant">
                        #{viaje.id}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-neg-on-surface-variant space-y-1">
                      <p>Abordaje: {formatDateTime(viaje.fecha_abordaje)}</p>
                      <p>Descenso: {formatDateTime(viaje.fecha_finalizacion)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </NegCard>

        <div className="space-y-6">
          {!selectedId ? (
            <NegCard variant="outlined" className="py-14 text-center">
              <p className="text-sm text-neg-on-surface-variant">
                Selecciona un viaje del historial para ver su recorrido.
              </p>
            </NegCard>
          ) : loadingDetail ? (
            <NegCard variant="outlined" className="py-14 text-center">
              <p className="text-sm text-neg-on-surface-variant">
                Cargando detalle del viaje...
              </p>
            </NegCard>
          ) : detalle ? (
            <>
              <NegCard variant="elevated" className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-neg-on-surface">
                    Recorrido detallado
                  </h2>
                  <p className="text-sm text-neg-on-surface-variant mt-1">
                    {selectedViaje?.ruta?.nombre ?? detalle.ruta?.nombre} · Bus{" "}
                    {detalle.bus?.placa ?? "—"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-neg-surface-container p-4">
                    <p className="text-xs uppercase tracking-widest text-neg-on-surface-variant mb-1">
                      Tiempo total
                    </p>
                    <p className="font-semibold text-neg-on-surface">
                      {detalle.viaje?.tiempo_total_minutos ?? 0} min
                    </p>
                  </div>
                  <div className="rounded-xl bg-neg-surface-container p-4">
                    <p className="text-xs uppercase tracking-widest text-neg-on-surface-variant mb-1">
                      Bus
                    </p>
                    <p className="font-semibold text-neg-on-surface">
                      {detalle.bus?.placa ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-neg-surface-container p-4">
                    <p className="text-xs uppercase tracking-widest text-neg-on-surface-variant mb-1">
                      Conductor
                    </p>
                    <p className="font-semibold text-neg-on-surface">
                      {detalle.conductor
                        ? `${detalle.conductor.nombre} ${detalle.conductor.apellido}`.trim()
                        : "Sin información"}
                    </p>
                  </div>
                </div>

                <ViajeMapa
                  rutaParaderos={detalle.ruta?.rutaParaderos ?? []}
                  validaciones={detalle.validaciones ?? []}
                />
              </NegCard>

              <NegCard variant="outlined" className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-neg-on-surface">
                    Validaciones del viaje
                  </h3>
                  <p className="text-sm text-neg-on-surface-variant mt-1">
                    Horas exactas y paraderos donde registraste el abordaje y el
                    descenso.
                  </p>
                </div>

                <div className="space-y-3">
                  {(detalle.validaciones ?? []).map((validacion, index) => (
                    <div
                      key={`${validacion.tipo_evento}-${index}`}
                      className="rounded-xl bg-neg-surface-container p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-neg-on-surface">
                          {validacion.tipo_evento === "abordaje"
                            ? "Abordaje"
                            : "Descenso"}
                        </p>
                        <span className="text-xs text-neg-on-surface-variant">
                          {formatDateTime(validacion.fecha)}
                        </span>
                      </div>
                      <p className="text-sm text-neg-on-surface-variant mt-1">
                        {validacion.paradero?.nombre ?? "Paradero sin resolver"}
                      </p>
                    </div>
                  ))}
                </div>
              </NegCard>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
