import { useEffect, useRef, useState } from "react";
import { NegPageHeader, NegCard } from "../../../../components/negocio";
import PanelMapa from "../components/PanelMapa";
import { getDashboard } from "../panelService";

const INTERVALO_SEG = 30;

const GRAVEDAD_COLOR = {
  baja: "bg-green-100 text-green-700",
  media: "bg-yellow-100 text-yellow-700",
  alta: "bg-neg-error-container/60 text-neg-error",
  critica: "bg-red-200 text-red-800",
};

export default function PanelControlPage() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(INTERVALO_SEG);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [busSeleccionado, setBusSeleccionado] = useState(null);

  const fetchRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchData = () => {
    setCargando(true);
    setError(null);
    getDashboard()
      .then((data) => {
        setDatos(data);
        setUltimaActualizacion(new Date());
        setCountdown(INTERVALO_SEG);
      })
      .catch(() => setError("No se pudo obtener los datos del panel."))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    fetchData();
    fetchRef.current = setInterval(fetchData, INTERVALO_SEG * 1000);
    countdownRef.current = setInterval(
      () => setCountdown((c) => (c > 1 ? c - 1 : INTERVALO_SEG)),
      1000,
    );
    return () => {
      clearInterval(fetchRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  const buses = datos?.buses ?? [];
  const incidentes = datos?.incidentes_activos ?? [];
  const totalPasajeros = datos?.total_pasajeros ?? 0;
  const busesConIncidente = buses.filter((b) => b.tiene_incidente).length;
  const busesOcupacionMaxima = buses.filter((b) => b.ocupacion_maxima).length;

  const statCls = "bg-neg-surface-container rounded-2xl p-4 flex flex-col gap-1";

  return (
    <div className="max-w-7xl">
      <NegPageHeader
        eyebrow="HU 3-002"
        title="Panel de control en tiempo real"
        subtitle="Estado actual de toda la flota. Se actualiza automáticamente cada 30 segundos."
      />

      {/* Barra de estado */}
      <NegCard padding="sm" className="mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${cargando ? "bg-yellow-400 animate-pulse" : "bg-green-500"}`}
            />
            <span className="text-sm font-medium text-neg-on-surface">
              {buses.length} bus{buses.length !== 1 ? "es" : ""} activo{buses.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neg-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">autorenew</span>
            <span>Actualiza en {countdown}s</span>
            {ultimaActualizacion && (
              <span className="hidden sm:inline">
                · Última:{" "}
                {ultimaActualizacion.toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </NegCard>

      {error && (
        <NegCard className="mb-4 border border-neg-error" padding="sm">
          <div className="flex items-center gap-2 text-sm text-neg-error font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </NegCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className={statCls}>
          <span className="text-2xl font-bold text-neg-on-surface">{buses.length}</span>
          <span className="text-xs text-neg-on-surface-variant">Buses activos</span>
        </div>
        <div className={statCls}>
          <span className="text-2xl font-bold text-neg-on-surface">{totalPasajeros}</span>
          <span className="text-xs text-neg-on-surface-variant">Pasajeros en tránsito</span>
        </div>
        <div className={`${statCls} ${incidentes.length > 0 ? "border border-neg-error/40" : ""}`}>
          <span className={`text-2xl font-bold ${incidentes.length > 0 ? "text-neg-error" : "text-neg-on-surface"}`}>
            {incidentes.length}
          </span>
          <span className="text-xs text-neg-on-surface-variant">Incidentes activos</span>
        </div>
        <div className={`${statCls} ${busesOcupacionMaxima > 0 ? "border border-yellow-400/60" : ""}`}>
          <span className={`text-2xl font-bold ${busesOcupacionMaxima > 0 ? "text-yellow-600" : "text-neg-on-surface"}`}>
            {busesOcupacionMaxima}
          </span>
          <span className="text-xs text-neg-on-surface-variant">Con ocupación máxima</span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="text-xs text-neg-on-surface-variant font-medium uppercase tracking-wide">Leyenda:</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded bg-green-600 inline-block" />
          <span className="text-neg-on-surface-variant">Normal</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded bg-red-600 inline-block" />
          <span className="text-neg-on-surface-variant">Con incidente</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded bg-amber-700 inline-block" />
          <span className="text-neg-on-surface-variant">Sin señal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
        {/* Mapa */}
        <NegCard padding="none" className="overflow-hidden">
          <PanelMapa buses={buses} onSelectBus={setBusSeleccionado} />
        </NegCard>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Bus seleccionado */}
          {busSeleccionado && (
            <NegCard padding="sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-neg-on-surface">Detalle del bus</span>
                <button
                  onClick={() => setBusSeleccionado(null)}
                  className="text-neg-on-surface-variant hover:text-neg-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <p className="font-mono text-base font-bold text-neg-on-surface">{busSeleccionado.placa}</p>
              <p className="text-xs text-neg-on-surface-variant mb-3">{busSeleccionado.modelo}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-neg-on-surface-variant">Pasajeros</span>
                  <span className="font-semibold">
                    {busSeleccionado.pasajeros_actuales} / {busSeleccionado.capacidad}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neg-on-surface-variant">Estado señal</span>
                  <span className={`font-semibold ${busSeleccionado.muy_retrasado ? "text-amber-700" : busSeleccionado.sin_senal ? "text-yellow-600" : "text-green-600"}`}>
                    {busSeleccionado.muy_retrasado ? "Sin señal" : busSeleccionado.sin_senal ? "Señal débil" : "Normal"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neg-on-surface-variant">Incidente activo</span>
                  <span className={`font-semibold ${busSeleccionado.tiene_incidente ? "text-neg-error" : "text-green-600"}`}>
                    {busSeleccionado.tiene_incidente ? "Sí" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neg-on-surface-variant">Ocupación máxima</span>
                  <span className={`font-semibold ${busSeleccionado.ocupacion_maxima ? "text-yellow-600" : "text-green-600"}`}>
                    {busSeleccionado.ocupacion_maxima ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            </NegCard>
          )}

          {/* Incidentes activos */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neg-on-surface-variant mb-2">
              Incidentes no resueltos
            </p>
            {incidentes.length === 0 ? (
              <NegCard padding="sm">
                <div className="py-6 text-center text-neg-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-[32px] block mb-1 opacity-40">check_circle</span>
                  Sin incidentes activos
                </div>
              </NegCard>
            ) : (
              <div className="space-y-2">
                {incidentes.map((inc) => (
                  <NegCard key={inc.id} padding="sm" className="border border-neg-error/30">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-neg-on-surface">{inc.bus_placa}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${GRAVEDAD_COLOR[inc.gravedad] ?? "bg-gray-100 text-gray-700"}`}>
                        {inc.gravedad}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-neg-on-surface capitalize">{inc.tipo.replace(/_/g, " ")}</p>
                    {inc.descripcion && (
                      <p className="text-xs text-neg-on-surface-variant mt-0.5 line-clamp-2">{inc.descripcion}</p>
                    )}
                    <p className="text-[10px] text-neg-on-surface-variant mt-1">
                      {new Date(inc.fecha).toLocaleString("es-CO", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      <span className="capitalize">{inc.estado.replace(/_/g, " ")}</span>
                    </p>
                  </NegCard>
                ))}
              </div>
            )}
          </div>

          {/* Alertas de ocupación máxima */}
          {busesConIncidente > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-neg-on-surface-variant mb-2">
                Alertas de ocupación
              </p>
              <div className="space-y-2">
                {buses
                  .filter((b) => b.ocupacion_maxima)
                  .map((b) => (
                    <NegCard key={b.bus_id} padding="sm" className="border border-yellow-400/60">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[18px] text-yellow-600">warning</span>
                        <div>
                          <span className="font-mono font-bold text-neg-on-surface">{b.placa}</span>
                          <span className="text-xs text-neg-on-surface-variant ml-1">
                            {b.pasajeros_actuales}/{b.capacidad} pasajeros
                          </span>
                        </div>
                      </div>
                    </NegCard>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
