import { useEffect, useState } from "react";
import {
  NegCard,
  NegButton,
  NegStatusBadge,
  NegTextarea,
  NegSectionHeader,
  NegAvatar,
  NegSelect,
} from "../../../../components/negocio";
import { formatDateTime } from "../../_utils/format";
import { ESTADOS_INCIDENTE, TIPO_INCIDENTE_LABEL } from "../../_mocks/catalogos";
import {
  listarComentarios,
  crearComentario,
} from "../../_services/comentariosService";
import { resolveStaticUrl } from "../../../../services/negocioApi";

const ESTADOS_SELECT = ESTADOS_INCIDENTE.map((e) => ({
  value: e.value,
  label: e.label,
}));

export default function IncidenteDetail({ incidente, onChangeEstado }) {
  const [comentario, setComentario] = useState("");
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!incidente?.id) {
      setComentarios([]);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    listarComentarios(incidente.id)
      .then((data) => {
        if (alive) setComentarios(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setError("No se pudieron cargar los comentarios.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [incidente?.id]);

  const handlePublicar = async () => {
    if (!comentario.trim() || posting || !incidente) return;
    setPosting(true);
    setError(null);
    try {
      const nuevo = await crearComentario({
        incidente_id: incidente.id,
        texto: comentario.trim(),
      });
      setComentarios((prev) => [...prev, nuevo]);
      setComentario("");
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No se pudo publicar el comentario.",
      );
    } finally {
      setPosting(false);
    }
  };

  if (!incidente) {
    return (
      <NegCard className="h-full flex items-center justify-center text-center py-16">
        <div>
          <div className="w-14 h-14 rounded-full bg-neg-surface-container-high text-neg-on-surface-variant flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[28px]">
              touch_app
            </span>
          </div>
          <p className="font-semibold text-neg-on-surface">
            Selecciona un incidente
          </p>
          <p className="text-sm text-neg-on-surface-variant max-w-xs mx-auto mt-1">
            Elegí un incidente del listado para ver el detalle, cambiar su
            estado y agregar comentarios.
          </p>
        </div>
      </NegCard>
    );
  }

  const nombreConductor = incidente.conductor
    ? `${incidente.conductor.nombre} ${incidente.conductor.apellido}`.trim()
    : "Sin conductor";

  return (
    <div className="space-y-4">
      <NegCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono text-neg-on-surface-variant">
              #{incidente.id}
            </p>
            <h3 className="font-headline text-xl font-bold text-neg-on-surface mt-0.5">
              {TIPO_INCIDENTE_LABEL[incidente.tipo] ?? "Incidente"}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <NegStatusBadge value={incidente.estado} />
              <NegStatusBadge kind="gravedad" value={incidente.gravedad} />
            </div>
          </div>
          <NegSelect
            name="estado"
            value={incidente.estado}
            onChange={(e) => onChangeEstado?.(incidente.id, e.target.value)}
            options={ESTADOS_SELECT}
            className="w-44"
          />
        </div>

        <p className="text-sm text-neg-on-surface mt-4 leading-relaxed">
          {incidente.descripcion || "(sin descripción)"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-neg-on-surface-variant">Conductor</p>
            <div className="flex items-center gap-2 mt-1">
              <NegAvatar name={nombreConductor} size="sm" />
              <div className="min-w-0">
                <p className="font-semibold text-neg-on-surface truncate">
                  {nombreConductor}
                </p>
                {incidente.conductor?.email && (
                  <p className="text-[11px] text-neg-on-surface-variant truncate">
                    {incidente.conductor.email}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div>
            <p className="text-neg-on-surface-variant">Fecha</p>
            <p className="font-semibold text-neg-on-surface mt-1">
              {formatDateTime(incidente.fecha)}
            </p>
          </div>
          <div>
            <p className="text-neg-on-surface-variant">Ubicación</p>
            <p className="font-semibold text-neg-on-surface mt-1">
              {incidente.latitud?.toFixed?.(5) ?? incidente.latitud},{" "}
              {incidente.longitud?.toFixed?.(5) ?? incidente.longitud}
            </p>
          </div>
          <div>
            <p className="text-neg-on-surface-variant">Fotos</p>
            <p className="font-semibold text-neg-on-surface mt-1">
              {incidente.fotos?.length ?? 0}
            </p>
          </div>
        </div>

        {incidente.fotos?.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {incidente.fotos.map((url, idx) => {
              const full = resolveStaticUrl(url);
              return (
                <a
                  key={`${url}-${idx}`}
                  href={full}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border border-neg-outline-variant block"
                >
                  <img
                    src={full}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              );
            })}
          </div>
        )}
      </NegCard>

      <NegCard>
        <NegSectionHeader
          title="Comentarios"
          hint={
            loading
              ? "Cargando comentarios..."
              : `${comentarios.length} comentario${
                  comentarios.length === 1 ? "" : "s"
                }`
          }
        />
        {comentarios.length === 0 && !loading ? (
          <p className="text-sm text-neg-on-surface-variant">
            Aún no hay comentarios.
          </p>
        ) : (
          <ul className="space-y-3">
            {comentarios.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-neg-outline-variant p-3"
              >
                <div className="flex items-center justify-between text-[11px] text-neg-on-surface-variant">
                  <span>Autor #{c.autor_id ?? "—"}</span>
                  <span>{formatDateTime(c.fecha)}</span>
                </div>
                <p className="text-sm text-neg-on-surface mt-1 whitespace-pre-line">
                  {c.texto}
                </p>
              </li>
            ))}
          </ul>
        )}
      </NegCard>

      <NegCard>
        <NegSectionHeader title="Nuevo comentario" />
        <NegTextarea
          name="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Agregá información o próximos pasos..."
          rows={3}
        />
        {error && (
          <p className="text-xs text-neg-error mt-2">{error}</p>
        )}
        <div className="flex items-center justify-end mt-3">
          <NegButton
            icon={posting ? "hourglass_top" : "send"}
            disabled={!comentario.trim() || posting}
            onClick={handlePublicar}
          >
            {posting ? "Publicando..." : "Publicar"}
          </NegButton>
        </div>
      </NegCard>
    </div>
  );
}
