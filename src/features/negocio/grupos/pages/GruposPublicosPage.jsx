import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegEmptyState,
  NegChip,
  NegSectionHeader,
  NegInput,
} from "../../../../components/negocio";
import { useNegocioSocket } from "../../../../hooks/useNegocioSocket";
import { listGruposPublicos, unirseAGrupo } from "../gruposService";

/**
 * HU 3-009 — Directorio de grupos publicos + union a un grupo.
 *
 * - Lista los grupos publicos disponibles con su cantidad de miembros.
 * - Buscador libre por nombre o descripcion (debounce 300ms).
 * - Al hacer click en un grupo se expande mostrando la descripcion completa
 *   y un boton "Unirse" si aun no soy miembro.
 * - Al unirme, muestro la notificacion de bienvenida que llega por WS
 *   ("grupo:bienvenida") y refresco el directorio.
 */
export default function GruposPublicosPage() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [uniendoseId, setUniendoseId] = useState(null);
  const [bienvenida, setBienvenida] = useState(null);

  const { on } = useNegocioSocket();

  const cargar = useCallback((q) => {
    setLoading(true);
    setError(null);
    listGruposPublicos({ search: q })
      .then((data) => setGrupos(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(
          err?.response?.data?.message ??
            "No se pudieron cargar los grupos publicos.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  // Debounce de 300ms sobre el campo de busqueda.
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    cargar(searchDebounced);
  }, [cargar, searchDebounced]);

  // Escucha la notificacion de bienvenida emitida por el backend al unirse.
  useEffect(() => {
    return on("grupo:bienvenida", (payload) => {
      setBienvenida(payload);
    });
  }, [on]);

  const handleUnirse = async (grupo) => {
    setUniendoseId(grupo.id);
    setError(null);
    try {
      await unirseAGrupo(grupo.id);
      cargar(searchDebounced);
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No fue posible unirte al grupo. Intenta nuevamente.",
      );
    } finally {
      setUniendoseId(null);
    }
  };

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-009"
        title="Directorio de grupos"
        subtitle="Explora los grupos publicos del sistema y unete a los que te interesen."
      />

      {bienvenida && (
        <NegCard
          variant="outlined"
          className="border-emerald-300 bg-emerald-50/80 text-emerald-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-700">
                celebration
              </span>
              <div>
                <p className="font-semibold">
                  ¡Bienvenido a &laquo;{bienvenida.grupo_nombre}&raquo;!
                </p>
                <p className="text-sm">{bienvenida.mensaje}</p>
                <button
                  type="button"
                  onClick={() => navigate("/negocio/grupos/mios")}
                  className="mt-2 text-sm font-semibold underline text-emerald-800 hover:text-emerald-950"
                >
                  Ver mis grupos
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBienvenida(null)}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        </NegCard>
      )}

      {error && (
        <NegCard
          variant="outlined"
          className="border-neg-error/40 bg-neg-error-container/40 text-neg-on-error-container"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-neg-error">
              error
            </span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </NegCard>
      )}

      <NegCard>
        <NegSectionHeader
          title="Grupos publicos disponibles"
          hint={
            loading
              ? "Cargando..."
              : `${grupos.length} grupo${grupos.length === 1 ? "" : "s"} encontrado${
                  grupos.length === 1 ? "" : "s"
                }`
          }
        />

        <div className="mb-4">
          <NegInput
            label="Buscar"
            placeholder="Nombre o descripcion del grupo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            iconStart="search"
          />
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-neg-on-surface-variant">
            Cargando grupos...
          </div>
        ) : grupos.length === 0 ? (
          <NegEmptyState
            icon="search_off"
            title="No hay grupos para tu busqueda"
            description="Prueba con otros terminos o consulta mas tarde, los administradores publican nuevos grupos cada cierto tiempo."
          />
        ) : (
          <ul className="space-y-3">
            {grupos.map((grupo) => {
              const abierto = expandido === grupo.id;
              const uniendose = uniendoseId === grupo.id;
              return (
                <li
                  key={grupo.id}
                  className="rounded-2xl border border-neg-outline-variant bg-neg-surface-container-lowest overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandido((prev) => (prev === grupo.id ? null : grupo.id))
                    }
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neg-surface-container transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-neg-primary-container text-neg-on-primary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">groups</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neg-on-surface truncate">
                        {grupo.nombre}
                      </p>
                      <p className="text-xs text-neg-on-surface-variant line-clamp-1">
                        {grupo.descripcion || "Sin descripcion"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <NegChip tone="neutral" icon="person">
                        {grupo.total_miembros}{" "}
                        {grupo.total_miembros === 1 ? "miembro" : "miembros"}
                      </NegChip>
                      {grupo.ya_soy_miembro && (
                        <NegChip tone="primary" icon="check">
                          Ya eres miembro
                        </NegChip>
                      )}
                    </div>
                    <span
                      className="material-symbols-outlined text-neg-on-surface-variant transition-transform"
                      style={{
                        transform: abierto ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      expand_more
                    </span>
                  </button>

                  {abierto && (
                    <div className="px-4 pb-4 pt-2 border-t border-neg-outline-variant/60 bg-neg-surface-container-low">
                      <p className="text-sm text-neg-on-surface whitespace-pre-line">
                        {grupo.descripcion ||
                          "Este grupo no tiene una descripcion detallada."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-neg-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            category
                          </span>
                          Tipo: {grupo.tipo}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            public
                          </span>
                          Visibilidad: Publico
                        </span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        {grupo.ya_soy_miembro ? (
                          <NegButton
                            variant="outlined"
                            icon="arrow_forward"
                            onClick={() => navigate("/negocio/grupos/mios")}
                          >
                            Ir a mis grupos
                          </NegButton>
                        ) : (
                          <NegButton
                            variant="filled"
                            icon={uniendose ? "hourglass_top" : "person_add"}
                            onClick={() => handleUnirse(grupo)}
                            disabled={uniendose}
                          >
                            {uniendose ? "Uniendote..." : "Unirme al grupo"}
                          </NegButton>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </NegCard>
    </section>
  );
}
