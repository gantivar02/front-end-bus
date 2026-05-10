import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corrige el problema de íconos rotos con Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function numberedIcon(numero, tone) {
  const bg =
    tone === "inicio" ? "#16a34a" : tone === "fin" ? "#dc2626" : "#2563eb";
  return L.divIcon({
    html: `<div style="
      background:${bg};
      color:#fff;
      border-radius:50%;
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;
      border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
    ">${numero}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [48, 48] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [map, positions]);
  return null;
}

export default function RutaMapa({ rutaParaderos = [] }) {
  const paradas = rutaParaderos
    .filter(
      (rp) =>
        rp.paradero?.latitud != null && rp.paradero?.longitud != null,
    )
    .sort((a, b) => a.orden - b.orden);

  if (paradas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-neg-on-surface-variant">
        <span className="material-symbols-outlined text-[52px] mb-3 opacity-30">
          location_off
        </span>
        <p className="text-sm font-semibold">Sin coordenadas disponibles</p>
        <p className="text-xs mt-1 opacity-60 text-center max-w-xs">
          Editá los paraderos de esta ruta y agregá latitud y longitud para
          visualizarlos en el mapa.
        </p>
      </div>
    );
  }

  const positions = paradas.map((rp) => [
    Number(rp.paradero.latitud),
    Number(rp.paradero.longitud),
  ]);

  return (
    <div className="space-y-3">
      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-neg-on-surface-variant px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
          Inicio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          Intermedio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
          Final
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="material-symbols-outlined text-[14px]">
            timeline
          </span>
          {paradas.length} de {rutaParaderos.length} parada
          {rutaParaderos.length !== 1 ? "s" : ""} con coordenadas
        </span>
      </div>

      {/* Mapa */}
      <MapContainer
        center={positions[0]}
        zoom={13}
        style={{ height: 440, borderRadius: "0.75rem" }}
        className="w-full border border-neg-outline-variant/40"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />

        {/* Línea conectando paraderos */}
        <Polyline
          positions={positions}
          color="#2563eb"
          weight={4}
          opacity={0.75}
          dashArray="10 5"
        />

        {/* Marcadores numerados */}
        {paradas.map((rp, idx) => {
          const tone =
            idx === 0
              ? "inicio"
              : idx === paradas.length - 1
                ? "fin"
                : "medio";
          return (
            <Marker
              key={rp.id ?? idx}
              position={[
                Number(rp.paradero.latitud),
                Number(rp.paradero.longitud),
              ]}
              icon={numberedIcon(rp.orden, tone)}
            >
              <Popup>
                <div style={{ minWidth: 170, fontFamily: "inherit" }}>
                  <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                    {rp.orden}. {rp.paradero.nombre}
                  </p>
                  <p style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>
                    Tipo: <strong>{rp.paradero.tipo}</strong>
                  </p>
                  {rp.distancia_desde_anterior != null ? (
                    <p style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>
                      Distancia anterior: {rp.distancia_desde_anterior} km
                    </p>
                  ) : (
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>
                      Inicio de ruta
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "#555" }}>
                    Tiempo: {rp.tiempo_estimado_min} min
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
