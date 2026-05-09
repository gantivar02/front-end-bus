import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegInput,
  NegTextarea,
  NegSelect,
  NegSectionHeader,
  NegChip,
} from "../../../../components/negocio";
import GravedadRadioCards from "../components/GravedadRadioCards";
import PhotoUploader from "../components/PhotoUploader";
import { TIPOS_INCIDENTE } from "../../_mocks/catalogos";
import { listConductores } from "../../_services/catalogosService";
import { reporteRapidoIncidente } from "../../_services/incidentesService";

const INITIAL = {
  conductor_id: "",
  tipo: "",
  descripcion: "",
  gravedad: "medio",
  latitud: "",
  longitud: "",
};

function nombreConductor(c) {
  const persona = c.persona ?? {};
  const nombre = `${persona.nombre ?? ""} ${persona.apellido ?? ""}`.trim();
  return nombre || `Conductor #${c.id}`;
}

export default function ReporteRapidoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [photos, setPhotos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [loadingConductores, setLoadingConductores] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [geoState, setGeoState] = useState("idle");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;
    listConductores()
      .then((data) => {
        if (!alive) return;
        setConductores(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err?.response?.data?.message ??
            "No se pudo cargar la lista de conductores.",
        );
      })
      .finally(() => {
        if (alive) setLoadingConductores(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField("latitud", pos.coords.latitude.toFixed(6));
        setField("longitud", pos.coords.longitude.toFixed(6));
        setGeoState("ok");
      },
      () => setGeoState("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const isValid =
    form.conductor_id &&
    form.tipo &&
    form.gravedad &&
    form.latitud !== "" &&
    form.longitud !== "" &&
    !Number.isNaN(Number(form.latitud)) &&
    !Number.isNaN(Number(form.longitud));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await reporteRapidoIncidente({
        conductor_id: Number(form.conductor_id),
        tipo: form.tipo,
        gravedad: form.gravedad,
        descripcion: form.descripcion || undefined,
        latitud: Number(form.latitud),
        longitud: Number(form.longitud),
        fotos: photos,
      });
      setResult(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No se pudo registrar el incidente. Intentá de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL);
    setPhotos([]);
    setGeoState("idle");
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className="max-w-2xl">
        <NegCard variant="elevated" padding="lg" className="text-center">
          <div className="w-16 h-16 rounded-full bg-neg-primary-container text-neg-on-primary-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">
              check_circle
            </span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-neg-on-surface mb-1">
            Incidente #{result.id} reportado
          </h2>
          <p className="text-sm text-neg-on-surface-variant mb-6">
            Se registró como <strong>{result.gravedad?.toUpperCase()}</strong>{" "}
            con estado <strong>{result.estado?.toUpperCase()}</strong>.
          </p>
          <div className="flex items-center justify-center gap-2">
            <NegButton variant="outlined" onClick={resetForm} icon="add">
              Nuevo reporte
            </NegButton>
            <NegButton
              onClick={() => navigate("/negocio/incidentes/bus")}
              icon="list"
            >
              Ver incidentes
            </NegButton>
          </div>
        </NegCard>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <NegPageHeader
        eyebrow="HU 2-007"
        title="Reporte rápido de incidente"
        subtitle="Registra un incidente con la información mínima para que operaciones pueda actuar."
        actions={
          <NegButton
            variant="text"
            icon="close"
            onClick={() => navigate("/negocio")}
          >
            Cancelar
          </NegButton>
        }
      />

      <div className="space-y-6">
        <NegCard>
          <NegSectionHeader
            title="Conductor y tipo"
            hint="El bus se detecta automáticamente desde el turno activo."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NegSelect
              label="Conductor"
              name="conductor_id"
              value={form.conductor_id}
              onChange={(e) => setField("conductor_id", e.target.value)}
              placeholder={
                loadingConductores
                  ? "Cargando conductores..."
                  : "Seleccioná un conductor"
              }
              disabled={loadingConductores}
              options={conductores.map((c) => ({
                value: c.id,
                label: nombreConductor(c),
              }))}
            />
            <NegSelect
              label="Tipo de incidente"
              name="tipo"
              value={form.tipo}
              onChange={(e) => setField("tipo", e.target.value)}
              placeholder="Seleccioná un tipo"
              options={TIPOS_INCIDENTE.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
            />
          </div>
        </NegCard>

        <NegCard>
          <NegSectionHeader
            title="Detalles"
            hint="Describe brevemente qué pasó (opcional)."
          />
          <NegTextarea
            label="Descripción"
            name="descripcion"
            value={form.descripcion}
            onChange={(e) => setField("descripcion", e.target.value)}
            placeholder="Qué observaste, cuándo y dónde ocurrió."
            rows={4}
            maxLength={500}
            hint={`${form.descripcion.length}/500`}
          />
        </NegCard>

        <NegCard>
          <NegSectionHeader
            title="Ubicación"
            hint="Requerida. Usá la geolocalización o ingresá manualmente."
            actions={
              <NegButton
                type="button"
                variant="outlined"
                icon={geoState === "loading" ? "hourglass_top" : "my_location"}
                onClick={requestGeolocation}
                disabled={geoState === "loading"}
              >
                {geoState === "loading"
                  ? "Obteniendo..."
                  : "Usar mi ubicación"}
              </NegButton>
            }
          />
          {geoState === "error" && (
            <p className="text-xs text-neg-error mb-3">
              No se pudo obtener la ubicación. Ingresala manualmente.
            </p>
          )}
          {geoState === "unsupported" && (
            <p className="text-xs text-neg-error mb-3">
              Tu navegador no soporta geolocalización.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NegInput
              label="Latitud"
              name="latitud"
              value={form.latitud}
              onChange={(e) => setField("latitud", e.target.value)}
              placeholder="4.710989"
              inputMode="decimal"
              iconStart="location_on"
            />
            <NegInput
              label="Longitud"
              name="longitud"
              value={form.longitud}
              onChange={(e) => setField("longitud", e.target.value)}
              placeholder="-74.072092"
              inputMode="decimal"
              iconStart="location_on"
            />
          </div>
        </NegCard>

        <NegCard>
          <NegSectionHeader title="Gravedad" />
          <GravedadRadioCards
            value={form.gravedad}
            onChange={(v) => setField("gravedad", v)}
          />
        </NegCard>

        <NegCard>
          <NegSectionHeader
            title="Evidencia fotográfica"
            hint="Opcional — hasta 5 imágenes (JPG/PNG)."
          />
          <PhotoUploader photos={photos} onChange={setPhotos} max={5} />
        </NegCard>

        {error && (
          <NegCard className="border border-neg-error text-neg-error">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>
              {error}
            </div>
          </NegCard>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neg-on-surface-variant">
            <NegChip tone="neutral" icon="info">
              Gravedades ALTO/CRÍTICO notifican al supervisor
            </NegChip>
          </div>
          <div className="flex items-center gap-2">
            <NegButton
              variant="outlined"
              type="button"
              onClick={resetForm}
              disabled={submitting}
            >
              Limpiar
            </NegButton>
            <NegButton
              type="submit"
              icon={submitting ? "hourglass_top" : "send"}
              disabled={!isValid || submitting}
            >
              {submitting ? "Enviando..." : "Reportar incidente"}
            </NegButton>
          </div>
        </div>
      </div>
    </form>
  );
}
