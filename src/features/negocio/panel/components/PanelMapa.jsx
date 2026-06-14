import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [4.6097, -74.0817];

function busIcon(bus) {
  const bg = bus.tiene_incidente ? "#dc2626" : bus.muy_retrasado ? "#b45309" : "#16a34a";
  return L.divIcon({
    html: `<div style="background:${bg};color:#fff;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:800;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap;display:flex;align-items:center;gap:4px;">
      <span style="font-size:14px;">🚌</span>${bus.placa}
    </div>`,
    className: "",
    iconAnchor: [0, 0],
    popupAnchor: [0, -12],
  });
}

function FitBounds({ buses }) {
  const map = useMap();
  useEffect(() => {
    const points = buses
      .filter((b) => b.latitud && b.longitud)
      .map((b) => [b.latitud, b.longitud]);
    if (points.length >= 2) map.fitBounds(points, { padding: [60, 60] });
    else if (points.length === 1) map.setView(points[0], 15);
    else map.setView(DEFAULT_CENTER, 13);
  }, [map, buses]);
  return null;
}

export default function PanelMapa({ buses = [], onSelectBus }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={13}
      style={{ height: 480, borderRadius: "0.75rem" }}
      className="w-full border border-neg-outline-variant/40"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds buses={buses} />

      {buses.map((bus) => (
        <Marker
          key={bus.bus_id}
          position={[bus.latitud, bus.longitud]}
          icon={busIcon(bus)}
          eventHandlers={{ click: () => onSelectBus?.(bus) }}
        >
          <Popup>
            <div style={{ minWidth: 200, fontFamily: "inherit" }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                🚌 {bus.placa}
              </p>
              <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{bus.modelo}</p>
              <p style={{ fontSize: 12, color: "#444", marginBottom: 4 }}>
                Pasajeros: <strong>{bus.pasajeros_actuales}</strong> / {bus.capacidad}
              </p>
              {bus.tiene_incidente && (
                <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
                  🔴 Con incidente activo
                </p>
              )}
              {bus.ocupacion_maxima && (
                <p style={{ fontSize: 12, color: "#d97706", fontWeight: 700 }}>
                  ⚠ Ocupación máxima
                </p>
              )}
              {bus.muy_retrasado && (
                <p style={{ fontSize: 12, color: "#b45309", fontWeight: 600 }}>
                  ⏱ Sin señal hace {Math.round((Date.now() - new Date(bus.fecha_registro).getTime()) / 60000)} min
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
