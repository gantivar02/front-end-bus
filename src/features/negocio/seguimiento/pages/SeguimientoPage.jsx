import { useEffect, useRef, useState } from "react";
import { NegPageHeader, NegCard } from "../../../../components/negocio";
import SeguimientoMapa from "../components/SeguimientoMapa";
import {
  listRutas,
  listParaderosPorRuta,
  getSeguimiento,
} from "../seguimientoService";

const INTERVALO_SEG = 10;

export default function SeguimientoPage() {
  const [rutas, setRutas] = useState([]);
  const [rutaId, setRutaId] = useState("");
  const [paraderos, setParaderos] = useState([]);
  const [paraderoId, setParaderoId] = useState("");

  const [buses, setBuses] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(INTERVALO_SEG);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const countdownRef = useRef(null);
  const fetchRef = useRef(null);

  useEffect(() => {
    listRutas()
      .then((data) => setRutas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!rutaId) return;
    setParaderoId("");
    setParaderos([]);
    listParaderosPorRuta(rutaId)
      .then((data) => setParaderos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [rutaId]);

  useEffect(() => {
    if (!rutaId) {
      setBuses([]);
      setError(null);
      return;
    }

    const fetchData = () => {
      setCargando(true);
      setError(null);
      getSeguimiento(rutaId, paraderoId || undefined)
        .then((data) => {
          setBuses(Array.isArray(data) ? data : []);
          setUltimaActualizacion(new Date());
          setCountdown(INTERVALO_SEG);
        })
        .catch((err) =>
          setError(err?.response?.data?.message ?? "No se pudo obtener la ubicación de los buses."),
        )
        .finally(() => setCargando(false));
    };

    fetchData();
    clearInterval(fetchRef.current);
    clearInterval(countdownRef.current);

    fetchRef.current = setInterval(fetchData, INTERVALO_SEG * 1000);
    countdownRef.current = setInterval(
      () => setCountdown((c) => (c > 1 ? c - 1 : INTERVALO_SEG)),
      1000,
    );

    return () => {
      clearInterval(fetchRef.current);
      clearInterval(countdownRef.current);
    };
  }, [rutaId, paraderoId]);

  const busesConAlerta = buses.filter((b) => b.sin_senal || b.muy_retrasado);
  const selectedParaderoId = paraderoId ? Number(paraderoId) : undefined;
  const rutaSeleccionada = rutas.find((r) => r.id === Number(rutaId));

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-neg-outline bg-neg-surface text-neg-on-surface text-sm focus:outline-none focus:border-neg-primary focus:ring-2 focus:ring-neg-primary/20";

  return (
    <div className="max-w-6xl">
      <NegPageHeader
        eyebrow="HU 3-001"
        title="Seguimiento en tiempo real"
        subtitle="Monitoreá la ubicación actual de los buses de una ruta. El mapa se actualiza automáticamente cada 10 segundos."
      />

      {/* Selectores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-neg-on-surface mb-1.5">
            Ruta
          </label>
          <select value={rutaId} onChange={(e) => setRutaId(e.target.value)} className={inputCls}>
            <option value="">Seleccionar ruta</option>
            {rutas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre} ({r.codigo_ruta})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neg-on-surface mb-1.5">
            ¿En qué paradero estás? <span className="text-neg-on-surface-variant text-xs">(opcional · para calcular tiempo de llegada)</span>
          </label>
          <select
            value={paraderoId}
            onChange={(e) => setParaderoId(e.target.value)}
            disabled={!rutaId || paraderos.length === 0}
            className={inputCls + " disabled:opacity-50"}
          >
            <option value="">Sin seleccionar</option>
            {paraderos.map((rp) => (
              <option key={rp.id} value={rp.paradero.id}>
                {rp.orden}. {rp.paradero.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Barra de estado */}
      {rutaId && (
        <NegCard padding="sm" className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${cargando ? "bg-yellow-400 animate-pulse" : "bg-green-500"}`}
              />
              <span className="text-sm font-medium text-neg-on-surface">
                {buses.length === 0
                  ? "Sin buses activos en esta ruta"
                  : `${buses.length} bus${buses.length > 1 ? "es" : ""} activo${buses.length > 1 ? "s" : ""}`}
                {rutaSeleccionada && (
                  <span className="text-neg-on-surface-variant font-normal ml-1">
                    · {rutaSeleccionada.nombre}
                  </span>
                )}
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
      )}

      {/* Alertas */}
      {busesConAlerta.map((bus) => (
        <NegCard
          key={bus.bus_id}
          padding="sm"
          className={`mb-3 border ${bus.muy_retrasado ? "border-neg-error bg-neg-error-container/20" : "border-yellow-400 bg-yellow-50"}`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">
              {bus.muy_retrasado ? "error" : "warning"}
            </span>
            <span className={bus.muy_retrasado ? "text-neg-error" : "text-yellow-700"}>
              Bus <strong>{bus.placa}</strong> —{" "}
              {bus.muy_retrasado
                ? `sin señal hace ${bus.minutos_sin_actualizacion} minutos. Posible retraso grave o avería.`
                : `señal GPS débil (${bus.minutos_sin_actualizacion} min sin actualización).`}
            </span>
          </div>
        </NegCard>
      ))}

      {/* Error */}
      {error && (
        <NegCard className="mb-4 border border-neg-error" padding="sm">
          <div className="flex items-center gap-2 text-sm text-neg-error font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </NegCard>
      )}

      {!rutaId ? (
        <NegCard>
          <div className="py-16 text-center text-neg-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] block mb-3 opacity-40">
              directions_bus
            </span>
            <p className="text-sm">Seleccioná una ruta para ver los buses en tiempo real.</p>
          </div>
        </NegCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
          {/* Mapa */}
          <NegCard padding="none" className="overflow-hidden">
            <SeguimientoMapa
              buses={buses}
              paraderos={paraderos}
              selectedParaderoId={selectedParaderoId}
            />
          </NegCard>

          {/* Panel lateral de buses */}
          <div className="space-y-3">
            {buses.length === 0 && !cargando ? (
              <NegCard>
                <div className="py-10 text-center text-neg-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-[36px] block mb-2 opacity-40">
                    search_off
                  </span>
                  No hay buses activos en esta ruta ahora.
                </div>
              </NegCard>
            ) : (
              buses.map((bus) => (
                <NegCard key={bus.bus_id} padding="sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="font-mono text-sm font-bold text-neg-on-surface">
                        {bus.placa}
                      </span>
                      <span className="block text-xs text-neg-on-surface-variant">
                        {bus.modelo}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        bus.muy_retrasado
                          ? "bg-neg-error-container/60 text-neg-error"
                          : bus.sin_senal
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {bus.muy_retrasado ? "Sin señal" : bus.sin_senal ? "Señal débil" : "En ruta"}
                    </span>
                  </div>

                  {bus.paradero_cercano && (
                    <div className="flex items-center gap-1.5 text-xs text-neg-on-surface-variant mb-1">
                      <span className="material-symbols-outlined text-[14px]">near_me</span>
                      <span>
                        Cerca de <strong className="text-neg-on-surface">{bus.paradero_cercano.nombre}</strong>
                        {" "}({bus.paradero_cercano.distancia_m} m)
                      </span>
                    </div>
                  )}

                  {bus.tiempo_al_paradero_min != null && (
                    <div className="flex items-center gap-1.5 text-xs text-neg-primary font-semibold mt-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>
                        {bus.tiempo_al_paradero_min === 0
                          ? "Ya pasó por tu paradero"
                          : `≈ ${bus.tiempo_al_paradero_min} min para llegar a tu paradero`}
                      </span>
                    </div>
                  )}
                </NegCard>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
