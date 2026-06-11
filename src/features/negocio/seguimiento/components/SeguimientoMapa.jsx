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
  const bg = bus.muy_retrasado ? "#dc2626" : bus.sin_senal ? "#d97706" : "#16a34a";
  return L.divIcon({
    html: `<div style="background:${bg};color:#fff;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:800;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap;display:flex;align-items:center;gap:4px;">
      <span style="font-size:14px;">🚌</span>${bus.placa}
    </div>`,
    className: "",
    iconAnchor: [0, 0],
    popupAnchor: [0, -12],
  });
}

function stopIcon(orden, isSelected) {
  const bg = isSelected ? "#2563eb" : "#6366f1";
  const size = isSelected ? 36 : 26;
  return L.divIcon({
    html: `<div style="background:${bg};color:#fff;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${isSelected ? 13 : 10}px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);">${orden}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

function FitBounds({ paraderos }) {
  const map = useMap();
  useEffect(() => {
    const points = paraderos
      .filter((rp) => rp.paradero.latitud && rp.paradero.longitud)
      .map((rp) => [Number(rp.paradero.latitud), Number(rp.paradero.longitud)]);
    if (points.length >= 2) map.fitBounds(points, { padding: [48, 48] });
    else if (points.length === 1) map.setView(points[0], 15);
    else map.setView(DEFAULT_CENTER, 13);
  }, [map, paraderos]);
  return null;
}

export default function SeguimientoMapa({ buses = [], paraderos = [], selectedParaderoId }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={13}
      style={{ height: 500, borderRadius: "0.75rem" }}
      className="w-full border border-neg-outline-variant/40"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds paraderos={paraderos} />

      {buses.map((bus) => (
        <Marker key={bus.bus_id} position={[bus.latitud, bus.longitud]} icon={busIcon(bus)}>
          <Popup>
            <div style={{ minWidth: 210, fontFamily: "inherit" }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                🚌 {bus.placa}
              </p>
              <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{bus.modelo}</p>
              {bus.paradero_cercano && (
                <p style={{ fontSize: 12, color: "#444", marginBottom: 4 }}>
                  Cerca de: <strong>{bus.paradero_cercano.nombre}</strong>
                  <br />
                  <span style={{ color: "#888" }}>({bus.paradero_cercano.distancia_m} m)</span>
                </p>
              )}
              {bus.tiempo_al_paradero_min != null && (
                <p style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, marginBottom: 4 }}>
                  ≈ {bus.tiempo_al_paradero_min} min para llegar a tu paradero
                </p>
              )}
              {bus.muy_retrasado && (
                <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, marginBottom: 2 }}>
                  🔴 Sin señal hace {bus.minutos_sin_actualizacion} min
                </p>
              )}
              {!bus.muy_retrasado && bus.sin_senal && (
                <p style={{ fontSize: 12, color: "#d97706", fontWeight: 600, marginBottom: 2 }}>
                  ⚠ Sin señal hace {bus.minutos_sin_actualizacion} min
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {paraderos.map((rp) =>
        rp.paradero.latitud && rp.paradero.longitud ? (
          <Marker
            key={rp.id}
            position={[Number(rp.paradero.latitud), Number(rp.paradero.longitud)]}
            icon={stopIcon(rp.orden, rp.paradero.id === selectedParaderoId)}
          >
            <Popup>
              <div style={{ minWidth: 170, fontFamily: "inherit" }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  Paradero {rp.orden}: {rp.paradero.nombre}
                </p>
                <p style={{ fontSize: 12, color: "#666" }}>{rp.paradero.codigo_paradero}</p>
                {rp.paradero.id === selectedParaderoId && (
                  <p style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, marginTop: 4 }}>
                    📍 Tu paradero
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ) : null,
      )}
    </MapContainer>
  );
}
