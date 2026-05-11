import { useEffect, useMemo, useRef, useState } from "react";
import {
  NegButton,
  NegCard,
  NegChip,
  NegEmptyState,
  NegPageHeader,
  NegSectionHeader,
} from "../../../../components/negocio";
import ParaderosCercanosMap from "../components/ParaderosCercanosMap";
import { listParaderosCercanos } from "../paraderosService";

const RESULTS_LIMIT = 5;
const SIGNIFICANT_MOVE_METERS = 100;

function haversineMeters(from, to) {
  const R = 6371000;
  const dLat = ((to.latitud - from.latitud) * Math.PI) / 180;
  const dLng = ((to.longitud - from.longitud) * Math.PI) / 180;
  const lat1 = (from.latitud * Math.PI) / 180;
  const lat2 = (to.latitud * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatMeters(value) {
  return `${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value ?? 0)} m`;
}

function formatCoords(location) {
  if (!location) return "Sin ubicación";
  return `${location.latitud.toFixed(5)}, ${location.longitud.toFixed(5)}`;
}

function geolocationMessage(error) {
  switch (error?.code) {
    case 1:
      return "Necesitamos permiso para acceder a tu ubicación y mostrar los paraderos más cercanos.";
    case 2:
      return "No pudimos determinar tu ubicación actual. Verifica el GPS o tu conexión.";
    case 3:
      return "La búsqueda de tu ubicación tardó demasiado. Intenta nuevamente.";
    default:
      return "No fue posible obtener tu ubicación actual.";
  }
}

export default function ParaderosCercanosPage() {
  const [geoRequestKey, setGeoRequestKey] = useState(0);
  const [geoState, setGeoState] = useState("requesting");
  const [geoMessage, setGeoMessage] = useState(
    "Estamos solicitando acceso a tu ubicación actual.",
  );
  const [userLocation, setUserLocation] = useState(null);
  const [queryLocation, setQueryLocation] = useState(null);
  const [paraderos, setParaderos] = useState([]);
  const [selectedParaderoId, setSelectedParaderoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [lastRefreshDistance, setLastRefreshDistance] = useState(null);

  const lastFetchedLocationRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState("unsupported");
      setGeoMessage("Tu navegador no soporta geolocalización.");
      return;
    }

    setGeoState("requesting");
    setGeoMessage("Autoriza el uso del GPS para buscar paraderos cercanos.");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          latitud: Number(position.coords.latitude.toFixed(7)),
          longitud: Number(position.coords.longitude.toFixed(7)),
        };

        setUserLocation(nextLocation);
        setGeoState("ready");
        setGeoMessage(
          `Seguimiento activo. La lista se actualiza si te desplazas más de ${SIGNIFICANT_MOVE_METERS} m.`,
        );

        const previousQueryLocation = lastFetchedLocationRef.current;
        const movedDistance = previousQueryLocation
          ? haversineMeters(previousQueryLocation, nextLocation)
          : null;

        if (
          !previousQueryLocation ||
          (movedDistance != null && movedDistance >= SIGNIFICANT_MOVE_METERS)
        ) {
          lastFetchedLocationRef.current = nextLocation;
          setLastRefreshDistance(
            movedDistance != null ? Math.round(movedDistance) : null,
          );
          setQueryLocation(nextLocation);
        }
      },
      (error) => {
        setGeoState(error?.code === 1 ? "denied" : "error");
        setGeoMessage(geolocationMessage(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [geoRequestKey]);

  useEffect(() => {
    if (!queryLocation) return;

    setLoading(true);
    setListError(null);

    listParaderosCercanos({
      latitud: queryLocation.latitud,
      longitud: queryLocation.longitud,
      limite: RESULTS_LIMIT,
    })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setParaderos(list);
        setSelectedParaderoId((current) =>
          list.some((paradero) => paradero.id === current)
            ? current
            : list[0]?.id ?? null,
        );
      })
      .catch((error) => {
        setListError(
          error?.response?.data?.message ??
            "No se pudieron cargar los paraderos cercanos.",
        );
      })
      .finally(() => setLoading(false));
  }, [queryLocation]);

  const selectedParadero = useMemo(
    () => paraderos.find((paradero) => paradero.id === selectedParaderoId) ?? null,
    [paraderos, selectedParaderoId],
  );

  const retryGeolocation = () => {
    lastFetchedLocationRef.current = null;
    setParaderos([]);
    setSelectedParaderoId(null);
    setQueryLocation(null);
    setLastRefreshDistance(null);
    setGeoRequestKey((value) => value + 1);
  };

  const emptyAction = (
    <NegButton variant="outlined" icon="my_location" onClick={retryGeolocation}>
      Reintentar ubicación
    </NegButton>
  );

  return (
    <div className="max-w-6xl">
      <NegPageHeader
        eyebrow="HU 2-002"
        title="Paraderos cercanos"
        subtitle="Consulta los 5 paraderos más cercanos a tu ubicación actual, las rutas que pasan por ellos y su posición en el mapa."
        actions={
          <NegButton variant="outlined" icon="my_location" onClick={retryGeolocation}>
            Actualizar ubicación
          </NegButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <NegCard variant="subtle" padding="sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
            Tu ubicación
          </p>
          <p className="font-medium text-neg-on-surface mt-1">
            {formatCoords(userLocation)}
          </p>
        </NegCard>
        <NegCard variant="subtle" padding="sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
            Seguimiento
          </p>
          <p className="font-medium text-neg-on-surface mt-1">
            {geoState === "ready" ? "Activo" : "Pendiente"}
          </p>
          <p className="text-xs text-neg-on-surface-variant mt-1">{geoMessage}</p>
        </NegCard>
        <NegCard variant="subtle" padding="sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
            Resultados
          </p>
          <p className="font-medium text-neg-on-surface mt-1">
            {paraderos.length} de {RESULTS_LIMIT} cercanos
          </p>
          <p className="text-xs text-neg-on-surface-variant mt-1">
            {lastRefreshDistance == null
              ? "Primera búsqueda basada en tu ubicación actual."
              : `Última actualización por desplazamiento de ${formatMeters(lastRefreshDistance)}.`}
          </p>
        </NegCard>
      </div>

      {listError && (
        <NegCard className="mb-5 border border-neg-error" padding="sm">
          <div className="flex items-center gap-2 text-sm text-neg-error font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {listError}
          </div>
        </NegCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <NegCard className="xl:h-fit">
          <NegSectionHeader
            title="Paraderos cercanos"
            hint="Selecciona un paradero para resaltarlo en el mapa."
          />

          {geoState === "unsupported" ? (
            <NegEmptyState
              icon="location_off"
              title="Geolocalización no disponible"
              description={geoMessage}
              action={emptyAction}
            />
          ) : geoState === "denied" ? (
            <NegEmptyState
              icon="location_disabled"
              title="Permiso de ubicación denegado"
              description={geoMessage}
              action={emptyAction}
            />
          ) : loading && paraderos.length === 0 ? (
            <NegEmptyState
              icon="progress_activity"
              title="Buscando paraderos cercanos"
              description="Estamos consultando los paraderos más próximos a tu ubicación."
            />
          ) : paraderos.length === 0 ? (
            <NegEmptyState
              icon="pin_drop"
              title="Sin resultados cercanos"
              description="No encontramos paraderos con coordenadas disponibles cerca de tu ubicación actual."
            />
          ) : (
            <div className="space-y-3">
              {paraderos.map((paradero, index) => {
                const isSelected = paradero.id === selectedParaderoId;
                return (
                  <button
                    key={paradero.id}
                    type="button"
                    onClick={() => setSelectedParaderoId(paradero.id)}
                    className={`w-full text-left rounded-2xl border px-4 py-4 transition-colors ${
                      isSelected
                        ? "border-neg-primary bg-neg-primary/5"
                        : "border-neg-outline-variant/50 hover:border-neg-primary/40 hover:bg-neg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-7 h-7 rounded-full bg-neg-primary-container text-neg-on-primary-container text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <p className="font-semibold text-neg-on-surface">
                            {paradero.nombre}
                          </p>
                          {isSelected && (
                            <NegChip tone="primary" icon="location_searching">
                              Seleccionado
                            </NegChip>
                          )}
                        </div>
                        <p className="text-xs text-neg-on-surface-variant mt-2">
                          {paradero.codigo_paradero} · {paradero.tipo}
                        </p>
                      </div>
                      <NegChip tone="secondary" icon="straighten">
                        {formatMeters(paradero.distancia_metros)}
                      </NegChip>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neg-on-surface-variant mb-2">
                        Rutas disponibles
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {paradero.rutas?.length ? (
                          paradero.rutas.map((ruta) => (
                            <NegChip key={ruta.id} tone="neutral">
                              {ruta.nombre}
                            </NegChip>
                          ))
                        ) : (
                          <span className="text-xs text-neg-on-surface-variant">
                            Sin rutas asociadas.
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </NegCard>

        <NegCard>
          <NegSectionHeader
            title="Mapa de paraderos"
            hint="Tu ubicación aparece como 'Tú' y los paraderos se numeran según cercanía."
          />

          {!userLocation ? (
            <NegEmptyState
              icon="explore_off"
              title="Esperando ubicación"
              description="Autoriza el acceso al GPS para visualizar los paraderos cercanos en el mapa."
              action={emptyAction}
            />
          ) : (
            <div className="space-y-4">
              <ParaderosCercanosMap
                userLocation={userLocation}
                paraderos={paraderos}
                selectedParaderoId={selectedParaderoId}
                onSelect={setSelectedParaderoId}
              />

              {selectedParadero ? (
                <div className="rounded-2xl border border-neg-outline-variant/50 bg-neg-surface-container-low px-4 py-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                        Paradero destacado
                      </p>
                      <p className="font-semibold text-neg-on-surface mt-1">
                        {selectedParadero.nombre}
                      </p>
                      <p className="text-xs text-neg-on-surface-variant mt-1">
                        {selectedParadero.codigo_paradero} · {selectedParadero.tipo}
                      </p>
                    </div>
                    <NegChip tone="secondary" icon="straighten">
                      {formatMeters(selectedParadero.distancia_metros)}
                    </NegChip>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neg-on-surface-variant mb-2">
                      Rutas que pasan por este paradero
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedParadero.rutas?.length ? (
                        selectedParadero.rutas.map((ruta) => (
                          <NegChip key={ruta.id} tone="primary">
                            {ruta.nombre}
                          </NegChip>
                        ))
                      ) : (
                        <span className="text-xs text-neg-on-surface-variant">
                          Sin rutas asociadas.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <NegEmptyState
                  icon="map"
                  title="Sin paradero seleccionado"
                  description="Elige uno de los resultados para ver sus detalles y resaltarlo en el mapa."
                />
              )}
            </div>
          )}
        </NegCard>
      </div>
    </div>
  );
}
