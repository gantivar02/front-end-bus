import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegButton,
  NegCard,
  NegChip,
  NegEmptyState,
  NegPageHeader,
  NegRadioCard,
  NegSectionHeader,
  NegTextarea,
} from "../../../../components/negocio";
import { getMiTurnoActual, iniciarMiTurno } from "../turnosService";

const INITIAL_FORM = {
  estado_bus: "operativo",
  observaciones: "",
  latitud: "",
  longitud: "",
};

function formatDateTime(value) {
  if (!value) return "Sin información";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin información";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortWindow(inicio, fin) {
  if (!inicio || !fin) return "Sin horario";
  const start = new Date(inicio);
  const end = new Date(fin);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Sin horario";
  }
  const hourFmt = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${hourFmt.format(start)} - ${hourFmt.format(end)}`;
}

export default function InicioTurnoPage() {
  const navigate = useNavigate();
  const [turno, setTurno] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [geoState, setGeoState] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getMiTurnoActual()
      .then((data) => {
        if (!alive) return;
        setTurno(data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err?.response?.data?.message ??
            "No se pudo cargar tu turno programado.",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((current) => ({
          ...current,
          latitud: pos.coords.latitude.toFixed(6),
          longitud: pos.coords.longitude.toFixed(6),
        }));
        setGeoState("ok");
      },
      () => setGeoState("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (loading || error || result) return;
    requestGeolocation();
  }, [loading, error, result]);

  const isValid = useMemo(() => {
    if (!turno || turno.estado === "en_curso") return false;
    if (
      form.estado_bus === "con_observaciones" &&
      !form.observaciones.trim()
    ) {
      return false;
    }
    return true;
  }, [form.estado_bus, form.observaciones, turno]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        estado_bus: form.estado_bus,
        observaciones: form.observaciones.trim() || undefined,
      };
      if (form.latitud !== "" && form.longitud !== "") {
        payload.latitud = Number(form.latitud);
        payload.longitud = Number(form.longitud);
      }
      const data = await iniciarMiTurno(payload);
      setResult(data);
      setTurno((prev) =>
        prev
          ? {
              ...prev,
              estado: data.estado,
              fecha_inicio_real: data.fecha_inicio_real,
              observaciones: data.observaciones,
              gps_activo: data.gps_activo,
              bus: { ...prev.bus, ...data.bus },
            }
          : prev,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No se pudo iniciar el turno. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <NegCard className="animate-pulse">
          <div className="h-6 w-52 bg-neg-surface-container-high rounded mb-3" />
          <div className="h-4 w-72 bg-neg-surface-container-high rounded" />
        </NegCard>
      </div>
    );
  }

  if (!turno) {
    return (
      <div className="max-w-4xl mx-auto">
        <NegPageHeader
          eyebrow="HU 2-006"
          title="Inicio de turno"
          subtitle="Confirma el bus asignado y activa el seguimiento operativo."
        />
        <NegCard>
          <NegEmptyState
            icon="event_busy"
            title="No tienes un turno programado ahora"
            description={
              error ??
              "Cuando tengas un turno vigente para esta fecha y hora, podrás iniciarlo aquí."
            }
          />
        </NegCard>
      </div>
    );
  }

  if (result || turno.estado === "en_curso") {
    const respuesta = result ?? {
      mensaje: "Tu turno ya está en curso",
      fecha_inicio_real: turno.fecha_inicio_real,
      bus: turno.bus,
      observaciones: turno.observaciones,
      gps_activo: turno.gps_activo,
    };

    return (
      <div className="max-w-3xl mx-auto">
        <NegCard variant="elevated" padding="lg" className="text-center">
          <div className="w-16 h-16 rounded-full bg-neg-primary-container text-neg-on-primary-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">
              route
            </span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-neg-on-surface mb-2">
            {respuesta.mensaje === "Turno iniciado correctamente"
              ? "Turno en curso"
              : "Turno activo"}
          </h2>
          <p className="text-sm text-neg-on-surface-variant mb-6">
            {respuesta.mensaje === "Turno iniciado correctamente"
              ? "El GPS del bus quedó activo y ya estás listo para operar."
              : "Este bus ya quedó registrado como tu vehículo operativo para el turno actual."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-6">
            <div className="rounded-2xl bg-neg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                Bus
              </p>
              <p className="text-xl font-bold text-neg-on-surface mt-1">
                {respuesta.bus?.placa ?? "Sin bus"}
              </p>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                {respuesta.bus?.modelo ?? "Sin modelo"}
              </p>
            </div>
            <div className="rounded-2xl bg-neg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                Inicio real
              </p>
              <p className="text-lg font-bold text-neg-on-surface mt-1">
                {formatDateTime(respuesta.fecha_inicio_real)}
              </p>
            </div>
            <div className="rounded-2xl bg-neg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                Tracking GPS
              </p>
              <p className="text-lg font-bold text-neg-on-surface mt-1">
                {respuesta.gps_activo ? "Activo" : "Pendiente"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
            <NegChip tone="success" icon="directions_bus">
              Estado bus: {respuesta.bus?.estado ?? "Sin información"}
            </NegChip>
            {respuesta.observaciones && (
              <NegChip tone="warning" icon="sticky_note_2">
                Con observaciones
              </NegChip>
            )}
          </div>

          {respuesta.observaciones && (
            <div className="rounded-2xl bg-neg-surface-container-low text-left p-4 mb-6">
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant mb-1">
                Observaciones registradas
              </p>
              <p className="text-sm text-neg-on-surface">
                {respuesta.observaciones}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            <NegButton
              variant="outlined"
              icon="arrow_back"
              onClick={() => navigate("/negocio")}
            >
              Volver al inicio
            </NegButton>
            <NegButton
              icon="report"
              onClick={() => navigate("/negocio/incidentes/reportar")}
            >
              Reportar incidente
            </NegButton>
          </div>
        </NegCard>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <NegPageHeader
        eyebrow="HU 2-006"
        title="Inicio de turno"
        subtitle="Confirma el estado del bus asignado y activa el seguimiento del turno."
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
            title="Turno programado"
            hint="El sistema ya identificó tu turno vigente para esta fecha y hora."
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-neg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                Bus asignado
              </p>
              <p className="text-xl font-bold text-neg-on-surface mt-1">
                {turno.bus?.placa ?? "Sin bus"}
              </p>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                {turno.bus?.modelo ?? "Sin modelo"}
              </p>
            </div>
            <div className="rounded-2xl bg-neg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                Conductor
              </p>
              <p className="text-base font-bold text-neg-on-surface mt-1 break-words">
                {turno.conductor?.nombre ?? "Sin información"}
              </p>
              <p
                className="text-xs text-neg-on-surface-variant mt-1 break-all"
                title={turno.conductor?.email ?? ""}
              >
                {turno.conductor?.email ?? ""}
              </p>
            </div>
            <div className="rounded-2xl bg-neg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                Horario
              </p>
              <p className="text-lg font-bold text-neg-on-surface mt-1">
                {formatShortWindow(turno.inicio_programado, turno.fin_programado)}
              </p>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                {formatDateTime(turno.inicio_programado).split(",")[0]}
              </p>
            </div>
            <div className="rounded-2xl bg-neg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                GPS actual
              </p>
              <p className="text-lg font-bold text-neg-on-surface mt-1">
                {turno.gps_activo ? "Ya activo" : "Por activar"}
              </p>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                {turno.gps_activo
                  ? "Existe seguimiento para este bus."
                  : "Se activará al iniciar el turno."}
              </p>
            </div>
          </div>
        </NegCard>

        <NegCard>
          <NegSectionHeader
            title="Estado del bus"
            hint="Confirma si el bus sale operativo o si necesitas dejar observaciones."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NegRadioCard
              name="estado_bus"
              value="operativo"
              checked={form.estado_bus === "operativo"}
              onChange={(value) =>
                setForm((current) => ({ ...current, estado_bus: value }))
              }
              icon="check_circle"
              title="Operativo"
              description="El vehículo está listo para iniciar el recorrido."
              accent="primary"
            />
            <NegRadioCard
              name="estado_bus"
              value="con_observaciones"
              checked={form.estado_bus === "con_observaciones"}
              onChange={(value) =>
                setForm((current) => ({ ...current, estado_bus: value }))
              }
              icon="warning"
              title="Con observaciones"
              description="Registra una nota para dejar constancia del hallazgo."
              accent="warning"
            />
          </div>
          <div className="mt-4">
            <NegTextarea
              label="Observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  observaciones: e.target.value,
                }))
              }
              placeholder="Ej. puerta trasera con cierre lento, ruido en suspensión, luz interna intermitente..."
              rows={4}
              maxLength={1000}
              hint={
                form.estado_bus === "con_observaciones"
                  ? `${form.observaciones.length}/1000 · Obligatorio`
                  : `${form.observaciones.length}/1000`
              }
            />
          </div>
        </NegCard>

        <NegCard>
          <NegSectionHeader
            title="GPS y ubicación inicial"
            hint="La ubicación actual ayuda a iniciar el tracking con una referencia real del bus."
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
          <div className="flex flex-wrap gap-2 mb-4">
            <NegChip tone={geoState === "ok" ? "success" : "neutral"} icon="location_on">
              {geoState === "ok"
                ? "Ubicación lista"
                : "La ubicación es opcional, pero recomendada"}
            </NegChip>
            {form.latitud && form.longitud && (
              <NegChip tone="neutral" icon="route">
                {form.latitud}, {form.longitud}
              </NegChip>
            )}
          </div>
          {geoState === "error" && (
            <p className="text-sm text-neg-error">
              No se pudo obtener la ubicación actual. Puedes iniciar el turno de todas formas.
            </p>
          )}
          {geoState === "unsupported" && (
            <p className="text-sm text-neg-error">
              Este navegador no soporta geolocalización.
            </p>
          )}
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
          <div className="text-xs text-neg-on-surface-variant">
            Al iniciar, el turno pasa a <strong>en curso</strong> y se registra la hora exacta de inicio.
          </div>
          <div className="flex items-center gap-2">
            <NegButton
              variant="outlined"
              type="button"
              onClick={() => navigate("/negocio")}
              disabled={submitting}
            >
              Volver
            </NegButton>
            <NegButton
              type="submit"
              icon={submitting ? "hourglass_top" : "play_arrow"}
              disabled={!isValid || submitting}
            >
              {submitting ? "Iniciando..." : "Iniciar turno"}
            </NegButton>
          </div>
        </div>
      </div>
    </form>
  );
}
