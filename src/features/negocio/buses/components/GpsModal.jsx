import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NegCard, NegButton } from "../../../../components/negocio";
import { upsertGpsBus } from "../busesService";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [4.6097, -74.0817];

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat.toFixed(7), e.latlng.lng.toFixed(7));
    },
  });
  return null;
}

export default function GpsModal({ bus, onClose }) {
  const [latitud, setLatitud] = useState(bus.gps?.latitud ? String(bus.gps.latitud) : "");
  const [longitud, setLongitud] = useState(bus.gps?.longitud ? String(bus.gps.longitud) : "");
  const [geoState, setGeoState] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const hasCoords =
    latitud !== "" && longitud !== "" && !isNaN(Number(latitud)) && !isNaN(Number(longitud));

  const markerPos = hasCoords ? [Number(latitud), Number(longitud)] : null;
  const mapCenter = markerPos ?? DEFAULT_CENTER;

  const handleMapPick = (lat, lng) => {
    setLatitud(lat);
    setLongitud(lng);
    setSaved(false);
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) { setGeoState("unsupported"); return; }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude.toFixed(7));
        setLongitud(pos.coords.longitude.toFixed(7));
        setGeoState("ok");
        setSaved(false);
      },
      () => setGeoState("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSave = async () => {
    if (!hasCoords) return;
    setSaving(true);
    setError(null);
    try {
      await upsertGpsBus(bus.id, Number(latitud), Number(longitud));
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message ?? "No se pudo guardar la posición.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-neg-outline bg-neg-surface text-neg-on-surface text-sm focus:outline-none focus:border-neg-primary focus:ring-2 focus:ring-neg-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <NegCard variant="elevated" padding="lg" className="relative z-10 w-full max-w-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-neg-primary mb-0.5">
              Posición GPS
            </p>
            <h3 className="font-headline text-xl font-bold text-neg-on-surface">
              Bus {bus.placa}
            </h3>
            <p className="text-xs text-neg-on-surface-variant">{bus.modelo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-neg-on-surface-variant">close</span>
          </button>
        </div>

        {/* Mapa */}
        <div className="rounded-xl overflow-hidden border border-neg-outline-variant mb-4" style={{ height: 280 }}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onPick={handleMapPick} />
            {markerPos && <Marker position={markerPos} />}
          </MapContainer>
        </div>

        <p className="text-xs text-neg-on-surface-variant mb-3 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">touch_app</span>
          Hacé clic en el mapa para colocar el bus, o usá tu ubicación actual.
        </p>

        {/* Coordenadas */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-neg-on-surface mb-1">Latitud</label>
            <input
              type="number"
              step="any"
              value={latitud}
              onChange={(e) => { setLatitud(e.target.value); setSaved(false); }}
              placeholder="4.6097000"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neg-on-surface mb-1">Longitud</label>
            <input
              type="number"
              step="any"
              value={longitud}
              onChange={(e) => { setLongitud(e.target.value); setSaved(false); }}
              placeholder="-74.0817000"
              className={inputCls}
            />
          </div>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 rounded-xl border border-neg-error bg-neg-error-container/30 text-neg-error text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-3 px-3 py-2 rounded-xl border border-green-400 bg-green-50 text-green-700 text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Posición guardada correctamente.
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={requestGeolocation}
            disabled={geoState === "loading"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neg-outline text-neg-on-surface-variant hover:bg-neg-surface-container text-xs font-medium transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {geoState === "loading" ? "hourglass_top" : "my_location"}
            </span>
            {geoState === "loading" ? "Obteniendo..." : "Mi ubicación"}
          </button>
          {geoState === "error" && (
            <span className="text-xs text-neg-error">No se pudo obtener la ubicación.</span>
          )}
          <div className="flex-1" />
          <NegButton variant="outlined" onClick={onClose}>Cerrar</NegButton>
          <NegButton
            icon={saving ? "hourglass_top" : "save"}
            onClick={handleSave}
            disabled={!hasCoords || saving}
          >
            {saving ? "Guardando..." : "Guardar posición"}
          </NegButton>
        </div>
      </NegCard>
    </div>
  );
}
