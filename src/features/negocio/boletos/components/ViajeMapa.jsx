import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatDateTime } from "../../_utils/format";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function getTone(validaciones) {
  const tipos = new Set(validaciones.map((item) => item.tipo_evento));
  if (tipos.has("abordaje") && tipos.has("descenso")) return "#0f766e";
  if (tipos.has("abordaje")) return "#16a34a";
  if (tipos.has("descenso")) return "#dc2626";
  return "#2563eb";
}

function markerIcon(orden, validaciones) {
  const bg = getTone(validaciones);
  const hint =
    validaciones.length === 0
      ? ""
      : `<div style="font-size:9px;font-weight:700;line-height:1;color:#0f172a;background:#fff;border-radius:999px;padding:1px 4px;position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);box-shadow:0 1px 4px rgba(0,0,0,.18)">
           ${validaciones.map((item) => item.tipo_evento === "abordaje" ? "A" : "D").join("/")}
         </div>`;

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
      position:relative;
    ">${orden}</div>${hint}`,
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 20],
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

export default function ViajeMapa({ rutaParaderos = [], validaciones = [] }) {
  const paradas = rutaParaderos
    .filter(
      (rp) => rp.paradero?.latitud != null && rp.paradero?.longitud != null,
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
          Esta ruta no tiene suficientes coordenadas para mostrar el recorrido.
        </p>
      </div>
    );
  }

  const validacionesPorParadero = new Map();
  for (const validacion of validaciones) {
    const paraderoId = validacion.paradero?.id;
    if (!paraderoId) continue;
    const current = validacionesPorParadero.get(paraderoId) ?? [];
    current.push(validacion);
    validacionesPorParadero.set(paraderoId, current);
  }

  const positions = paradas.map((rp) => [
    Number(rp.paradero.latitud),
    Number(rp.paradero.longitud),
  ]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-neg-on-surface-variant px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          Ruta completa
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
          Abordaje
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
          Descenso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-700 inline-block" />
          Ambos
        </span>
      </div>

      <MapContainer
        center={positions[0]}
        zoom={13}
        style={{ height: 460, borderRadius: "0.75rem" }}
        className="w-full border border-neg-outline-variant/40"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />

        <Polyline
          positions={positions}
          color="#2563eb"
          weight={4}
          opacity={0.75}
          dashArray="10 5"
        />

        {paradas.map((rp) => {
          const validacionesParadero =
            validacionesPorParadero.get(rp.paradero.id) ?? [];

          return (
            <Marker
              key={rp.id}
              position={[
                Number(rp.paradero.latitud),
                Number(rp.paradero.longitud),
              ]}
              icon={markerIcon(rp.orden, validacionesParadero)}
            >
              <Popup>
                <div style={{ minWidth: 190, fontFamily: "inherit" }}>
                  <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                    {rp.orden}. {rp.paradero.nombre}
                  </p>
                  <p style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
                    Tipo: <strong>{rp.paradero.tipo}</strong>
                  </p>
                  {validacionesParadero.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#666" }}>
                      Sin validaciones registradas en este paradero.
                    </p>
                  ) : (
                    <div style={{ fontSize: 12, color: "#444" }}>
                      {validacionesParadero.map((item, index) => (
                        <p key={`${item.tipo_evento}-${index}`} style={{ marginBottom: 2 }}>
                          <strong>
                            {item.tipo_evento === "abordaje"
                              ? "Abordaje"
                              : "Descenso"}
                          </strong>
                          : {formatDateTime(item.fecha)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
