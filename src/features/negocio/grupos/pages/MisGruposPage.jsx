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
  NegTextarea,
} from "../../../../components/negocio";
import { useNegocioSocket } from "../../../../hooks/useNegocioSocket";
import { ROL_CIUDADANO, useAuth } from "../../../../context/AuthContext";
import {
  abandonarGrupo,
  createCommunicationGroup,
  listMisGrupos,
  searchPersonasGrupo,
} from "../gruposService";

const ROL_LABEL = {
  admin: "Administrador",
  miembro: "Miembro",
};

const VISIBILIDAD_LABEL = {
  publico: "Público",
  privado: "Privado",
};

/**
 * HU 3-006 + HU 3-011
 *
 * - Muestra los grupos activos del usuario.
 * - Permite a ciudadanos crear un grupo de comunicación con al menos
 *   2 miembros adicionales.
 * - Sigue permitiendo abandonar grupos con confirmación.
 * - Refresca el listado cuando llega la notificación WS de bienvenida
 *   al ser agregado a un grupo desde otra sesión o por otro usuario.
 */
export default function MisGruposPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canCreateGroup = hasRole(ROL_CIUDADANO);

  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmando, setConfirmando] = useState(null);
  const [abandonando, setAbandonando] = useState(false);
  const [notice, setNotice] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState("");
  const [createGroupForm, setCreateGroupForm] = useState({
    nombre: "",
    descripcion: "",
    visibilidad: "publico",
    imagen_url: "",
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

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

  const resetCreateForm = useCallback(() => {
    setCreateGroupForm({
      nombre: "",
      descripcion: "",
      visibilidad: "publico",
      imagen_url: "",
    });
    setMemberSearchQuery("");
    setMemberResults([]);
    setSelectedMembers([]);
    setCreateGroupError("");
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const unsubSalir = on("grupo:miembro-salio", () => {
      cargar();
    });

    const unsubBienvenida = on("grupo:bienvenida", (payload) => {
      setNotice({
        kind: "success",
        text:
          payload?.mensaje ??
          `Ahora formas parte del grupo "${payload?.grupo_nombre ?? "nuevo grupo"}".`,
      });
      cargar();
    });

    return () => {
      unsubSalir();
      unsubBienvenida();
    };
  }, [on, cargar]);

  useEffect(() => {
    const q = memberSearchQuery.trim();
    if (!showCreateForm || !q) {
      setMemberResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchPersonasGrupo(q)
        .then((data) =>
          setMemberResults(
            (Array.isArray(data) ? data : []).filter(
              (persona) =>
                !selectedMembers.some((item) => item.id === persona.id),
            ),
          ),
        )
        .catch(() => setMemberResults([]));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [memberSearchQuery, selectedMembers, showCreateForm]);

  const handleConfirmarAbandono = async () => {
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

  const handleAddMember = (persona) => {
    setSelectedMembers((current) => [...current, persona]);
    setMemberSearchQuery("");
    setMemberResults([]);
  };

  const handleRemoveMember = (personaId) => {
    setSelectedMembers((current) =>
      current.filter((item) => item.id !== personaId),
    );
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setCreateGroupError("");
    setNotice(null);

    if (!createGroupForm.nombre.trim()) {
      setCreateGroupError("El grupo debe tener un nombre.");
      return;
    }

    if (selectedMembers.length < 2) {
      setCreateGroupError(
        "Debes agregar al menos 2 miembros además del creador.",
      );
      return;
    }

    setCreatingGroup(true);
    try {
      const group = await createCommunicationGroup({
        nombre: createGroupForm.nombre.trim(),
        descripcion: createGroupForm.descripcion.trim(),
        visibilidad: createGroupForm.visibilidad,
        imagen_url: createGroupForm.imagen_url.trim(),
        miembro_ids: selectedMembers.map((member) => member.id),
      });

      setNotice({
        kind: "success",
        text: `Grupo "${group?.nombre ?? createGroupForm.nombre.trim()}" creado correctamente. Los miembros agregados recibirán una notificación.`,
      });
      resetCreateForm();
      setShowCreateForm(false);
      cargar();
    } catch (err) {
      setCreateGroupError(
        err?.response?.data?.message ??
          "No se pudo crear el grupo de comunicación.",
      );
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-006 · HU 3-011"
        title="Mis grupos"
        subtitle="Consulta tus grupos activos, crea nuevos espacios de comunicación y abandona los que ya no te interesen."
        actions={
          canCreateGroup ? (
            <NegButton
              variant="filled"
              icon={showCreateForm ? "close" : "group_add"}
              onClick={() => {
                setShowCreateForm((current) => !current);
                setCreateGroupError("");
                setNotice(null);
                if (showCreateForm) resetCreateForm();
              }}
            >
              {showCreateForm ? "Cerrar creación" : "Crear grupo"}
            </NegButton>
          ) : null
        }
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

      {showCreateForm && canCreateGroup && (
        <NegCard>
          <NegSectionHeader
            title="Crear grupo de comunicación"
            hint="Agrega al menos 2 miembros además del creador."
          />

          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NegInput
                label="Nombre del grupo"
                value={createGroupForm.nombre}
                onChange={(event) =>
                  setCreateGroupForm((current) => ({
                    ...current,
                    nombre: event.target.value,
                  }))
                }
                placeholder="Ej. Vecinos Ruta Norte"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neg-on-surface-variant">
                  Visibilidad
                </label>
                <select
                  value={createGroupForm.visibilidad}
                  onChange={(event) =>
                    setCreateGroupForm((current) => ({
                      ...current,
                      visibilidad: event.target.value,
                    }))
                  }
                  className="h-11 rounded-xl border border-neg-outline-variant bg-neg-surface-container-lowest px-3 text-sm text-neg-on-surface"
                >
                  <option value="publico">Público</option>
                  <option value="privado">Privado</option>
                </select>
              </div>
            </div>

            <NegTextarea
              label="Descripción"
              rows={3}
              value={createGroupForm.descripcion}
              onChange={(event) =>
                setCreateGroupForm((current) => ({
                  ...current,
                  descripcion: event.target.value,
                }))
              }
              placeholder="Describe el propósito del grupo."
            />

            <NegInput
              label="Imagen o ícono (URL opcional)"
              value={createGroupForm.imagen_url}
              onChange={(event) =>
                setCreateGroupForm((current) => ({
                  ...current,
                  imagen_url: event.target.value,
                }))
              }
              placeholder="https://..."
              iconStart="image"
            />

            <NegInput
              label="Buscar personas por nombre o email"
              value={memberSearchQuery}
              onChange={(event) => setMemberSearchQuery(event.target.value)}
              placeholder="Ej. Ana, Pedro, correo@ejemplo.com"
              iconStart="search"
            />

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="inline-flex h-8 items-center gap-2 rounded-full bg-neg-primary-container px-3 text-xs font-semibold text-neg-on-primary-container"
                  >
                    {member.nombre_completo}
                    <span className="material-symbols-outlined text-[14px]">
                      close
                    </span>
                  </button>
                ))}
              </div>
            )}

            {memberResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest divide-y divide-neg-outline-variant/20">
                {memberResults.map((persona) => (
                  <button
                    key={`member-${persona.id}`}
                    type="button"
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-neg-primary/5"
                    onClick={() => handleAddMember(persona)}
                  >
                    <p className="font-medium text-neg-on-surface">
                      {persona.nombre_completo}
                    </p>
                    <p className="text-xs text-neg-on-surface-variant">
                      {persona.email}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {createGroupError && (
              <div className="rounded-xl border border-neg-error bg-neg-error-container/30 px-4 py-3 text-sm text-neg-error">
                {createGroupError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <NegButton
                type="button"
                variant="text"
                onClick={() => {
                  resetCreateForm();
                  setShowCreateForm(false);
                }}
                disabled={creatingGroup}
              >
                Cancelar
              </NegButton>
              <NegButton
                type="submit"
                icon={creatingGroup ? "hourglass_top" : "groups"}
                disabled={creatingGroup}
              >
                {creatingGroup ? "Creando..." : "Crear grupo"}
              </NegButton>
            </div>
          </form>
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
            description="Cuando te unas a un grupo público, seas agregado a uno privado o crees el tuyo aparecerá aquí."
          />
        ) : (
          <ul className="divide-y divide-neg-outline-variant">
            {grupos.map((grupo) => (
              <li
                key={grupo.grupo_persona_id}
                className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neg-primary-container text-neg-on-primary-container">
                    {grupo.imagen_url ? (
                      <img
                        src={grupo.imagen_url}
                        alt={`Grupo ${grupo.nombre}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined">groups</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neg-on-surface">
                      {grupo.nombre}
                    </p>
                    <p className="line-clamp-2 text-xs text-neg-on-surface-variant">
                      {grupo.descripcion || "Sin descripción"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <NegChip
                        tone={grupo.rol === "admin" ? "primary" : "neutral"}
                        icon={grupo.rol === "admin" ? "shield_person" : "person"}
                      >
                        {ROL_LABEL[grupo.rol] ?? grupo.rol}
                      </NegChip>
                      <NegChip
                        tone="neutral"
                        icon={grupo.visibilidad === "publico" ? "public" : "lock"}
                      >
                        {VISIBILIDAD_LABEL[grupo.visibilidad] ?? grupo.visibilidad}
                      </NegChip>
                      {typeof grupo.total_miembros === "number" && (
                        <NegChip tone="secondary" icon="group">
                          {grupo.total_miembros} miembros
                        </NegChip>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:shrink-0">
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
              <span className="material-symbols-outlined text-3xl text-neg-error">
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
                onClick={handleConfirmarAbandono}
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
