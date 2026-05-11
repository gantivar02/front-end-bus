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

function userIcon() {
  return L.divIcon({
    html: `<div style="
      background:#0f766e;
      color:#fff;
      border-radius:999px;
      min-width:36px;height:36px;
      padding:0 10px;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:800;
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.28);
    ">Tú</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function stopIcon(index, selected) {
  const bg = selected ? "#2563eb" : "#1d4ed8";
  const ring = selected ? "#bfdbfe" : "#ffffff";
  return L.divIcon({
    html: `<div style="
      background:${bg};
      color:#fff;
      border-radius:50%;
      width:34px;height:34px;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:800;
      border:3px solid ${ring};
      box-shadow:0 2px 8px rgba(0,0,0,.25);
    ">${index}</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function FitBounds({ userLocation, paraderos }) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (userLocation) {
      points.push([userLocation.latitud, userLocation.longitud]);
    }

    for (const paradero of paraderos) {
      if (paradero.latitud != null && paradero.longitud != null) {
        points.push([Number(paradero.latitud), Number(paradero.longitud)]);
      }
    }

    if (points.length >= 2) {
      map.fitBounds(points, { padding: [48, 48] });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.setView(DEFAULT_CENTER, 13);
    }
  }, [map, paraderos, userLocation]);

  return null;
}

export default function ParaderosCercanosMap({
  userLocation,
  paraderos = [],
  selectedParaderoId,
  onSelect,
}) {
  const center = userLocation
    ? [userLocation.latitud, userLocation.longitud]
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: 480, borderRadius: "0.75rem" }}
      className="w-full border border-neg-outline-variant/40"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds userLocation={userLocation} paraderos={paraderos} />

      {userLocation && (
        <Marker
          position={[userLocation.latitud, userLocation.longitud]}
          icon={userIcon()}
        >
          <Popup>
            <div style={{ minWidth: 150 }}>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Tu ubicación actual</p>
              <p style={{ fontSize: 12, color: "#555" }}>
                {userLocation.latitud.toFixed(5)}, {userLocation.longitud.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {paraderos.map((paradero, index) => (
        <Marker
          key={paradero.id}
          position={[Number(paradero.latitud), Number(paradero.longitud)]}
          icon={stopIcon(index + 1, paradero.id === selectedParaderoId)}
          eventHandlers={{
            click: () => onSelect?.(paradero.id),
          }}
        >
          <Popup>
            <div style={{ minWidth: 190, fontFamily: "inherit" }}>
              <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                {index + 1}. {paradero.nombre}
              </p>
              <p style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
                {paradero.codigo_paradero} · {paradero.distancia_metros} m
              </p>
              <p style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
                Tipo: <strong>{paradero.tipo}</strong>
              </p>
              <p style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
                Rutas:
              </p>
              {paradero.rutas?.length ? (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#333" }}>
                  {paradero.rutas.map((ruta) => (
                    <li key={ruta.id}>
                      {ruta.nombre} ({ruta.codigo_ruta})
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                  Sin rutas asociadas.
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
