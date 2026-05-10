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
import {
  listConductores,
  getConductorMe,
  getMisBuses,
  getBusesPorConductor,
} from "../../_services/catalogosService";
import { reporteRapidoIncidente } from "../../_services/incidentesService";
import { useAuth } from "../../../../context/AuthContext";

const INITIAL = {
  conductor_id: "",
  bus_id: "",
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

function etiquetaBus(b) {
  const placa = b.placa ?? `Bus #${b.id}`;
  const modelo = b.modelo ? ` · ${b.modelo}` : "";
  return `${placa}${modelo}`;
}

export default function ReporteRapidoPage() {
  const navigate = useNavigate();
  const { isAdmin, isConductor } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [photos, setPhotos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loadingConductores, setLoadingConductores] = useState(isAdmin);
  const [loadingBuses, setLoadingBuses] = useState(isConductor);
  const [conductorMe, setConductorMe] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [geoState, setGeoState] = useState("idle");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Admin: cargar lista de conductores
  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    setLoadingConductores(true);
    listConductores()
      .then((data) => {
        if (alive) setConductores(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (alive)
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
  }, [isAdmin]);

  // Conductor: cargar su propio perfil + buses asignados
  useEffect(() => {
    if (!isConductor) return;
    let alive = true;
    setLoadingBuses(true);
    Promise.all([getConductorMe(), getMisBuses()])
      .then(([me, misBuses]) => {
        if (!alive) return;
        setConductorMe(me);
        setBuses(Array.isArray(misBuses) ? misBuses : []);
      })
      .catch((err) => {
        if (alive)
          setError(
            err?.response?.data?.message ??
              "No se pudieron cargar tus buses asignados.",
          );
      })
      .finally(() => {
        if (alive) setLoadingBuses(false);
      });
    return () => {
      alive = false;
    };
  }, [isConductor]);

  // Admin: cuando elige conductor, cargar buses de ese conductor
  useEffect(() => {
    if (!isAdmin || !form.conductor_id) {
      if (isAdmin) setBuses([]);
      return;
    }
    let alive = true;
    setLoadingBuses(true);
    getBusesPorConductor(Number(form.conductor_id))
      .then((data) => {
        if (alive) setBuses(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (alive)
          setError(
            err?.response?.data?.message ??
              "No se pudieron cargar los buses del conductor.",
          );
      })
      .finally(() => {
        if (alive) setLoadingBuses(false);
      });
    return () => {
      alive = false;
    };
  }, [isAdmin, form.conductor_id]);

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
    (isConductor || (isAdmin && form.conductor_id)) &&
    form.bus_id &&
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
      const payload = {
        bus_id: Number(form.bus_id),
        tipo: form.tipo,
        gravedad: form.gravedad,
        descripcion: form.descripcion || undefined,
        latitud: Number(form.latitud),
        longitud: Number(form.longitud),
        fotos: photos,
      };
      if (isAdmin && form.conductor_id) {
        payload.conductor_id = Number(form.conductor_id);
      }
      const data = await reporteRapidoIncidente(payload);
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
      <div className="max-w-2xl mx-auto">
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
            {!isConductor && (
              <NegButton
                onClick={() => navigate("/negocio/incidentes/bus")}
                icon="list"
              >
                Ver incidentes
              </NegButton>
            )}
          </div>
        </NegCard>
      </div>
    );
  }

  const conductorActualNombre = conductorMe
    ? `${conductorMe.persona?.nombre ?? ""} ${
        conductorMe.persona?.apellido ?? ""
      }`.trim()
    : "";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
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
            title={isAdmin ? "Conductor, bus y tipo" : "Bus y tipo"}
            hint={
              isConductor
                ? "Estás reportando como conductor. Elegí el bus que estás operando."
                : "Seleccioná el conductor y el bus involucrados."
            }
          />

          {isConductor && conductorMe && (
            <div className="mb-4 p-3 rounded-lg bg-neg-surface-container-low">
              <p className="text-xs text-neg-on-surface-variant uppercase tracking-wider font-semibold">
                Conductor
              </p>
              <p className="text-sm font-semibold text-neg-on-surface mt-0.5">
                {conductorActualNombre || `Conductor #${conductorMe.id}`}
                {conductorMe.persona?.email && (
                  <span className="ml-2 font-normal text-neg-on-surface-variant">
                    · {conductorMe.persona.email}
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdmin && (
              <NegSelect
                label="Conductor"
                name="conductor_id"
                value={form.conductor_id}
                onChange={(e) => {
                  setField("conductor_id", e.target.value);
                  setField("bus_id", "");
                }}
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
            )}
            <NegSelect
              label="Bus"
              name="bus_id"
              value={form.bus_id}
              onChange={(e) => setField("bus_id", e.target.value)}
              placeholder={
                loadingBuses
                  ? "Cargando buses..."
                  : isAdmin && !form.conductor_id
                    ? "Elegí primero un conductor"
                    : buses.length === 0
                      ? "Sin buses asignados"
                      : "Seleccioná un bus"
              }
              disabled={
                loadingBuses ||
                (isAdmin && !form.conductor_id) ||
                buses.length === 0
              }
              options={buses.map((b) => ({
                value: b.id,
                label: etiquetaBus(b),
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
