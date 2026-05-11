import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  NegCard,
  NegButton,
  NegInput,
  NegSelect,
  NegSectionHeader,
} from "../../../../components/negocio";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TIPOS = [
  { value: "terminal", label: "Terminal" },
  { value: "intermedio", label: "Intermedio" },
  { value: "escolar", label: "Escolar" },
  { value: "hospital", label: "Hospital / Salud" },
  { value: "universidad", label: "Universidad" },
  { value: "comercial", label: "Comercial" },
  { value: "residencial", label: "Residencial" },
];

// Centro por defecto: Manizales, Colombia
const DEFAULT_CENTER = [5.0703, -75.5138];

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat.toFixed(7), e.latlng.lng.toFixed(7));
    },
  });
  return null;
}

const EMPTY = { nombre: "", tipo: "", latitud: "", longitud: "" };

export default function ParaderoForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(EMPTY);
  const [geoState, setGeoState] = useState("idle");

  useEffect(() => {
    if (initialData) {
      setForm({
        nombre: initialData.nombre ?? "",
        tipo: initialData.tipo ?? "",
        latitud: initialData.latitud != null ? String(initialData.latitud) : "",
        longitud: initialData.longitud != null ? String(initialData.longitud) : "",
      });
    } else {
      setForm(EMPTY);
      setGeoState("idle");
    }
  }, [initialData]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleMapPick = (lat, lng) => {
    setField("latitud", lat);
    setField("longitud", lng);
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) { setGeoState("unsupported"); return; }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField("latitud", pos.coords.latitude.toFixed(7));
        setField("longitud", pos.coords.longitude.toFixed(7));
        setGeoState("ok");
      },
      () => setGeoState("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const hasCoords =
    form.latitud !== "" &&
    form.longitud !== "" &&
    !isNaN(Number(form.latitud)) &&
    !isNaN(Number(form.longitud));

  const markerPos = hasCoords
    ? [Number(form.latitud), Number(form.longitud)]
    : null;

  const mapCenter = markerPos ?? DEFAULT_CENTER;

  const canSubmit = form.nombre.trim() && form.tipo;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    onSubmit({
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      latitud: hasCoords ? Number(form.latitud) : undefined,
      longitud: hasCoords ? Number(form.longitud) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Información básica */}
      <NegCard>
        <NegSectionHeader title="Información del paradero" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NegInput
            label="Nombre *"
            name="nombre"
            value={form.nombre}
            onChange={(e) => setField("nombre", e.target.value)}
            placeholder="Ej. Terminal Central"
            required
            className="md:col-span-2"
          />
          <NegSelect
            label="Tipo de paradero *"
            name="tipo"
            value={form.tipo}
            onChange={(e) => setField("tipo", e.target.value)}
            placeholder="Seleccioná un tipo"
            options={TIPOS}
            className="md:col-span-2"
          />
        </div>
      </NegCard>

      {/* Ubicación GPS */}
      <NegCard>
        <NegSectionHeader
          title="Ubicación GPS"
          hint="Hacé clic en el mapa o usá tu ubicación actual."
          actions={
            <NegButton
              type="button"
              variant="outlined"
              size="sm"
              icon={geoState === "loading" ? "hourglass_top" : "my_location"}
              onClick={requestGeolocation}
              disabled={geoState === "loading"}
            >
              {geoState === "loading" ? "Obteniendo..." : "Mi ubicación"}
            </NegButton>
          }
        />

        {geoState === "error" && (
          <p className="text-xs text-neg-error mb-3">
            No se pudo obtener la ubicación. Hacé clic en el mapa o ingresala manualmente.
          </p>
        )}
        {geoState === "unsupported" && (
          <p className="text-xs text-neg-error mb-3">
            Tu navegador no soporta geolocalización.
          </p>
        )}

        {/* Mapa interactivo */}
        <div className="mb-4 rounded-xl overflow-hidden border border-neg-outline-variant/40">
          <p className="text-xs text-neg-on-surface-variant bg-neg-surface-container-low px-3 py-1.5 border-b border-neg-outline-variant/30">
            Hacé clic en el mapa para fijar la ubicación del paradero
          </p>
          <MapContainer
            center={mapCenter}
            zoom={markerPos ? 15 : 13}
            style={{ height: 320 }}
            key={`map-${isEdit ? initialData?.id : "new"}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onPick={handleMapPick} />
            {markerPos && <Marker position={markerPos} />}
          </MapContainer>
        </div>

        {/* Campos manuales */}
        <div className="grid grid-cols-2 gap-3">
          <NegInput
            label="Latitud"
            name="latitud"
            type="number"
            step="any"
            value={form.latitud}
            onChange={(e) => setField("latitud", e.target.value)}
            placeholder="5.0703"
            iconStart="location_on"
          />
          <NegInput
            label="Longitud"
            name="longitud"
            type="number"
            step="any"
            value={form.longitud}
            onChange={(e) => setField("longitud", e.target.value)}
            placeholder="-75.5138"
            iconStart="location_on"
          />
        </div>

        {hasCoords && (
          <p className="text-xs text-neg-primary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Ubicación fijada: {Number(form.latitud).toFixed(5)}, {Number(form.longitud).toFixed(5)}
          </p>
        )}
      </NegCard>

      <div className="flex items-center justify-end gap-3 pt-2">
        <NegButton variant="outlined" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </NegButton>
        <NegButton
          type="submit"
          icon={loading ? "hourglass_top" : isEdit ? "save" : "add_location"}
          disabled={!canSubmit || loading}
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar paradero"}
        </NegButton>
      </div>
    </form>
  );
}
