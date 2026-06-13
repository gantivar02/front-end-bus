import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegEmptyState,
  NegChip,
  NegSectionHeader,
} from "../../../../components/negocio";
import { useNegocioSocket } from "../../../../hooks/useNegocioSocket";
import { abandonarGrupo, listMisGrupos } from "../gruposService";

const ROL_LABEL = {
  admin: "Administrador",
  miembro: "Miembro",
};

const VISIBILIDAD_LABEL = {
  publico: "Público",
  privado: "Privado",
};

/**
 * HU 3-011 — Mis grupos + salida voluntaria de un grupo.
 *
 * Muestra los grupos en los que el usuario es miembro activo y permite
 * abandonar cada uno con confirmacion previa. Escucha el evento
 * "grupo:miembro-salio" del WebSocket para refrescar el listado cuando
 * el usuario abandona desde otro dispositivo.
 */
export default function MisGruposPage() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [abandonando, setAbandonando] = useState(false);
  const [notice, setNotice] = useState(null);

  const { on } = useNegocioSocket();

  const cargar = useCallback(() => {
    setLoading(true);
    setError(null);
    listMisGrupos()
      .then((data) => setGrupos(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(
          err?.response?.data?.message ??
            "No se pudieron cargar tus grupos.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    return on("grupo:miembro-salio", () => {
      cargar();
    });
  }, [on, cargar]);

  const handleConfirmar = async () => {
    if (!confirmando) return;
    setAbandonando(true);
    setError(null);
    try {
      const respuesta = await abandonarGrupo(confirmando.grupo_id);
      setNotice({
        kind: "success",
        text:
          respuesta?.mensaje ??
          `Has abandonado el grupo "${confirmando.nombre}".`,
      });
      setConfirmando(null);
      cargar();
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No fue posible abandonar el grupo. Intenta nuevamente.",
      );
    } finally {
      setAbandonando(false);
    }
  };

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-011"
        title="Mis grupos"
        subtitle="Consulta los grupos a los que perteneces y abandona los que ya no te interesen."
      />

      {notice && (
        <NegCard
          variant="outlined"
          className="border-emerald-300 bg-emerald-50/80 text-emerald-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-700">
                task_alt
              </span>
              <p className="text-sm font-medium">{notice.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
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
          title="Grupos donde eres miembro"
          hint={
            loading
              ? "Cargando..."
              : `${grupos.length} grupo${grupos.length === 1 ? "" : "s"} activo${
                  grupos.length === 1 ? "" : "s"
                }`
          }
        />

        {loading ? (
          <div className="py-10 text-center text-sm text-neg-on-surface-variant">
            Cargando grupos...
          </div>
        ) : grupos.length === 0 ? (
          <NegEmptyState
            icon="group_off"
            title="No perteneces a ningún grupo"
            description="Cuando te unas a un grupo público o seas agregado a uno privado aparecerá aquí."
          />
        ) : (
          <ul className="divide-y divide-neg-outline-variant">
            {grupos.map((grupo) => (
              <li
                key={grupo.grupo_persona_id}
                className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neg-primary-container text-neg-on-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">groups</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neg-on-surface truncate">
                      {grupo.nombre}
                    </p>
                    <p className="text-xs text-neg-on-surface-variant line-clamp-2">
                      {grupo.descripcion || "Sin descripción"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <NegChip
                        tone={grupo.rol === "admin" ? "primary" : "neutral"}
                        icon={
                          grupo.rol === "admin"
                            ? "shield_person"
                            : "person"
                        }
                      >
                        {ROL_LABEL[grupo.rol] ?? grupo.rol}
                      </NegChip>
                      <NegChip
                        tone="neutral"
                        icon={
                          grupo.visibilidad === "publico"
                            ? "public"
                            : "lock"
                        }
                      >
                        {VISIBILIDAD_LABEL[grupo.visibilidad] ??
                          grupo.visibilidad}
                      </NegChip>
                    </div>
                  </div>
                </div>
                <div className="md:shrink-0 flex flex-wrap gap-2">
                  {grupo.rol === "admin" && (
                    <NegButton
                      variant="outlined"
                      icon="shield_person"
                      onClick={() =>
                        navigate(`/negocio/grupos/${grupo.grupo_id}/administrar`)
                      }
                    >
                      Administrar
                    </NegButton>
                  )}
                  <NegButton
                    variant="outlined"
                    icon="logout"
                    onClick={() => setConfirmando(grupo)}
                  >
                    Abandonar grupo
                  </NegButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </NegCard>

      {confirmando && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4">
          <NegCard
            className="w-full max-w-md space-y-4"
            variant="elevated"
            padding="lg"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-neg-error text-3xl">
                logout
              </span>
              <div>
                <h2 className="text-lg font-semibold text-neg-on-surface">
                  ¿Abandonar &laquo;{confirmando.nombre}&raquo;?
                </h2>
                <p className="mt-1 text-sm text-neg-on-surface-variant">
                  Dejarás de recibir mensajes y notificaciones del grupo. Los
                  mensajes anteriores seguirán en tu historial.
                </p>
                {confirmando.visibilidad === "publico" && (
                  <p className="mt-2 text-xs text-neg-on-surface-variant">
                    Como es un grupo público, podrás volver a unirte más tarde.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <NegButton
                variant="text"
                onClick={() => setConfirmando(null)}
                disabled={abandonando}
              >
                Cancelar
              </NegButton>
              <NegButton
                variant="filled"
                icon={abandonando ? "hourglass_top" : "logout"}
                onClick={handleConfirmar}
                disabled={abandonando}
              >
                {abandonando ? "Abandonando..." : "Sí, abandonar"}
              </NegButton>
            </div>
          </NegCard>
        </div>
      )}
    </section>
  );
}
