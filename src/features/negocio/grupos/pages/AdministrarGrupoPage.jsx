import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  cambiarBloqueoMiembro,
  cambiarRolMiembro,
  listHistorialGrupo,
  listMiembrosGrupo,
  removerMiembroGrupo,
} from "../gruposService";

const ACCION_LABEL = {
  ingreso: "Ingresó al grupo",
  salida_voluntaria: "Abandonó voluntariamente",
  removido: "Fue removido del grupo",
  promovido_admin: "Promovido a administrador",
  degradado_miembro: "Degradado a miembro",
  bloqueado: "Fue bloqueado",
  desbloqueado: "Fue desbloqueado",
};

const ACCION_ICON = {
  ingreso: "login",
  salida_voluntaria: "logout",
  removido: "person_remove",
  promovido_admin: "shield_person",
  degradado_miembro: "person",
  bloqueado: "block",
  desbloqueado: "lock_open",
};

const formatFechaHora = (valor) => {
  if (!valor) return "—";
  try {
    return new Date(valor).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(valor);
  }
};

const formatFecha = (valor) => {
  if (!valor) return "—";
  try {
    return new Date(valor).toLocaleDateString("es-CO", {
      dateStyle: "medium",
    });
  } catch {
    return String(valor);
  }
};

/**
 * HU 3-010 — Administracion de miembros del grupo.
 *
 * Pantalla dividida en dos tabs:
 *  - Miembros: lista con buscador, chips de rol/bloqueo, acciones
 *    (promover/degradar, bloquear/desbloquear, remover).
 *  - Historial: log completo de cambios de membresia del grupo.
 *
 * Solo accesible para administradores activos del grupo (el backend lo
 * valida con 403 si no lo eres; el front muestra el error).
 *
 * Refresca automaticamente al escuchar los eventos WS relevantes:
 *  - grupo:miembro-agregado, grupo:miembro-removido,
 *    grupo:cambio-rol, grupo:bloqueado, grupo:desbloqueado.
 */
export default function AdministrarGrupoPage() {
  const navigate = useNavigate();
  const { grupoId } = useParams();
  const grupoIdNum = Number(grupoId);

  const [tab, setTab] = useState("miembros"); // "miembros" | "historial"
  const [miembros, setMiembros] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [accionando, setAccionando] = useState(null); // { tipo, personaId }
  const [confirmando, setConfirmando] = useState(null); // {tipo, miembro}

  const { on } = useNegocioSocket();

  const cargarMiembros = useCallback(
    (q) => {
      if (!grupoIdNum) return;
      setLoading(true);
      setError(null);
      listMiembrosGrupo(grupoIdNum, { search: q })
        .then((data) => setMiembros(Array.isArray(data) ? data : []))
        .catch((err) => {
          setError(
            err?.response?.data?.message ??
              "No se pudieron cargar los miembros.",
          );
          setMiembros([]);
        })
        .finally(() => setLoading(false));
    },
    [grupoIdNum],
  );

  const cargarHistorial = useCallback(() => {
    if (!grupoIdNum) return;
    setLoading(true);
    setError(null);
    listHistorialGrupo(grupoIdNum)
      .then((data) => setHistorial(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(
          err?.response?.data?.message ??
            "No se pudo cargar el historial.",
        );
        setHistorial([]);
      })
      .finally(() => setLoading(false));
  }, [grupoIdNum]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (tab === "miembros") cargarMiembros(searchDebounced);
    else cargarHistorial();
  }, [tab, searchDebounced, cargarMiembros, cargarHistorial]);

  // Refresco automatico ante eventos del grupo
  useEffect(() => {
    const eventos = [
      "grupo:miembro-agregado",
      "grupo:miembro-removido",
      "grupo:cambio-rol",
      "grupo:bloqueado",
      "grupo:desbloqueado",
    ];
    const unsubs = eventos.map((ev) =>
      on(ev, (payload) => {
        if (Number(payload?.grupo_id) !== grupoIdNum) return;
        if (tab === "miembros") cargarMiembros(searchDebounced);
        else cargarHistorial();
      }),
    );
    return () => unsubs.forEach((fn) => fn());
  }, [on, tab, grupoIdNum, searchDebounced, cargarMiembros, cargarHistorial]);

  const ejecutarAccion = async (tipo, miembro) => {
    setAccionando({ tipo, personaId: miembro.persona_id });
    setError(null);
    try {
      if (tipo === "promover") {
        await cambiarRolMiembro(grupoIdNum, miembro.persona_id, "admin");
        setNotice(`${miembro.nombre} ahora es administrador del grupo.`);
      } else if (tipo === "degradar") {
        await cambiarRolMiembro(grupoIdNum, miembro.persona_id, "miembro");
        setNotice(`${miembro.nombre} ya no es administrador.`);
      } else if (tipo === "remover") {
        await removerMiembroGrupo(grupoIdNum, miembro.persona_id);
        setNotice(`${miembro.nombre} fue removido del grupo.`);
      } else if (tipo === "bloquear") {
        await cambiarBloqueoMiembro(grupoIdNum, miembro.persona_id, true);
        setNotice(`${miembro.nombre} fue bloqueado del grupo.`);
      } else if (tipo === "desbloquear") {
        await cambiarBloqueoMiembro(grupoIdNum, miembro.persona_id, false);
        setNotice(
          `${miembro.nombre} fue desbloqueado. Puede volver a unirse si el grupo es publico.`,
        );
      }
      setConfirmando(null);
      cargarMiembros(searchDebounced);
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No fue posible completar la accion.",
      );
    } finally {
      setAccionando(null);
    }
  };

  const ordenados = useMemo(() => {
    return [...miembros].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      if (a.rol !== b.rol) return a.rol === "admin" ? -1 : 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [miembros]);

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-010"
        title="Administrar miembros del grupo"
        subtitle="Gestiona los miembros, sus roles, bloqueos y consulta el historial completo de cambios."
        actions={
          <NegButton
            variant="text"
            icon="arrow_back"
            onClick={() => navigate("/negocio/grupos/mios")}
          >
            Volver a mis grupos
          </NegButton>
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
              <p className="text-sm font-medium">{notice}</p>
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

      <NegCard padding="none">
        <div className="flex border-b border-neg-outline-variant">
          <button
            type="button"
            onClick={() => setTab("miembros")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              tab === "miembros"
                ? "border-b-2 border-neg-primary text-neg-primary"
                : "text-neg-on-surface-variant hover:bg-neg-surface-container"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                group
              </span>
              Miembros
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("historial")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              tab === "historial"
                ? "border-b-2 border-neg-primary text-neg-primary"
                : "text-neg-on-surface-variant hover:bg-neg-surface-container"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                history
              </span>
              Historial
            </span>
          </button>
        </div>

        <div className="p-6">
          {tab === "miembros" ? (
            <>
              <div className="mb-4">
                <NegInput
                  label="Buscar miembro"
                  placeholder="Nombre, apellido o email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  iconStart="search"
                />
              </div>

              {loading ? (
                <div className="py-10 text-center text-sm text-neg-on-surface-variant">
                  Cargando miembros...
                </div>
              ) : ordenados.length === 0 ? (
                <NegEmptyState
                  icon="group_off"
                  title="No hay miembros"
                  description="Cuando alguien se una al grupo aparecera aqui."
                />
              ) : (
                <ul className="divide-y divide-neg-outline-variant">
                  {ordenados.map((m) => (
                    <li
                      key={m.grupo_persona_id}
                      className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-neg-primary-container text-neg-on-primary-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined">
                            {m.rol === "admin" ? "shield_person" : "person"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neg-on-surface truncate">
                            {m.nombre} {m.apellido}
                          </p>
                          <p className="text-xs text-neg-on-surface-variant truncate">
                            {m.email}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <NegChip
                              tone={m.rol === "admin" ? "primary" : "neutral"}
                              icon={
                                m.rol === "admin" ? "shield_person" : "person"
                              }
                            >
                              {m.rol === "admin" ? "Administrador" : "Miembro"}
                            </NegChip>
                            {m.activo ? (
                              <NegChip tone="success" icon="check_circle">
                                Activo
                              </NegChip>
                            ) : (
                              <NegChip tone="neutral" icon="logout">
                                Inactivo
                              </NegChip>
                            )}
                            {m.bloqueado && (
                              <NegChip tone="danger" icon="block">
                                Bloqueado
                              </NegChip>
                            )}
                            <span className="text-xs text-neg-on-surface-variant inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">
                                calendar_today
                              </span>
                              Unido el {formatFecha(m.fecha_union)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 md:shrink-0">
                        {m.activo && !m.bloqueado && (
                          <>
                            {m.rol === "miembro" ? (
                              <NegButton
                                variant="outlined"
                                icon="shield_person"
                                onClick={() =>
                                  setConfirmando({ tipo: "promover", miembro: m })
                                }
                              >
                                Promover a admin
                              </NegButton>
                            ) : (
                              <NegButton
                                variant="outlined"
                                icon="person"
                                onClick={() =>
                                  setConfirmando({ tipo: "degradar", miembro: m })
                                }
                              >
                                Degradar a miembro
                              </NegButton>
                            )}
                            <NegButton
                              variant="outlined"
                              icon="person_remove"
                              onClick={() =>
                                setConfirmando({ tipo: "remover", miembro: m })
                              }
                            >
                              Remover
                            </NegButton>
                          </>
                        )}
                        {!m.bloqueado ? (
                          <NegButton
                            variant="outlined"
                            icon="block"
                            onClick={() =>
                              setConfirmando({ tipo: "bloquear", miembro: m })
                            }
                          >
                            Bloquear
                          </NegButton>
                        ) : (
                          <NegButton
                            variant="outlined"
                            icon="lock_open"
                            onClick={() =>
                              setConfirmando({ tipo: "desbloquear", miembro: m })
                            }
                          >
                            Desbloquear
                          </NegButton>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <NegSectionHeader
                title="Log de cambios de membresia"
                hint={
                  loading
                    ? "Cargando..."
                    : `${historial.length} evento${historial.length === 1 ? "" : "s"} registrado${historial.length === 1 ? "" : "s"}`
                }
              />

              {loading ? (
                <div className="py-10 text-center text-sm text-neg-on-surface-variant">
                  Cargando historial...
                </div>
              ) : historial.length === 0 ? (
                <NegEmptyState
                  icon="history_toggle_off"
                  title="Sin eventos"
                  description="Cuando se promueva, remueva o bloquee a alguien aparecera aqui."
                />
              ) : (
                <ol className="space-y-3">
                  {historial.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest"
                    >
                      <div className="w-9 h-9 rounded-xl bg-neg-primary-container text-neg-on-primary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">
                          {ACCION_ICON[h.accion] ?? "info"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neg-on-surface">
                          {h.persona_afectada
                            ? `${h.persona_afectada.nombre} ${h.persona_afectada.apellido}`
                            : "Persona desconocida"}{" "}
                          —{" "}
                          <span className="font-normal text-neg-on-surface-variant">
                            {ACCION_LABEL[h.accion] ?? h.accion}
                          </span>
                        </p>
                        <p className="text-xs text-neg-on-surface-variant mt-1">
                          {h.ejecutor
                            ? `Por ${h.ejecutor.nombre} ${h.ejecutor.apellido}`
                            : "Por el sistema"}{" "}
                          · {formatFechaHora(h.fecha)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      </NegCard>

      {confirmando && (
        <ModalConfirmacion
          confirmando={confirmando}
          ejecutando={
            accionando &&
            accionando.tipo === confirmando.tipo &&
            accionando.personaId === confirmando.miembro.persona_id
          }
          onCancelar={() => setConfirmando(null)}
          onConfirmar={() =>
            ejecutarAccion(confirmando.tipo, confirmando.miembro)
          }
        />
      )}
    </section>
  );
}

function ModalConfirmacion({ confirmando, ejecutando, onCancelar, onConfirmar }) {
  const { tipo, miembro } = confirmando;
  const config = {
    promover: {
      icon: "shield_person",
      iconColor: "text-neg-primary",
      titulo: `¿Promover a ${miembro.nombre} a administrador?`,
      desc: "Podra gestionar miembros, cambiar roles, bloquear y ver el historial.",
      cta: "Si, promover",
    },
    degradar: {
      icon: "person",
      iconColor: "text-neg-on-surface-variant",
      titulo: `¿Degradar a ${miembro.nombre} a miembro?`,
      desc: "Dejara de poder administrar el grupo.",
      cta: "Si, degradar",
    },
    remover: {
      icon: "person_remove",
      iconColor: "text-neg-error",
      titulo: `¿Remover a ${miembro.nombre} del grupo?`,
      desc: "Dejara de recibir mensajes y notificaciones. El historial de mensajes se conserva.",
      cta: "Si, remover",
    },
    bloquear: {
      icon: "block",
      iconColor: "text-neg-error",
      titulo: `¿Bloquear a ${miembro.nombre}?`,
      desc: "Saldra del grupo y no podra volver a unirse hasta que sea desbloqueado.",
      cta: "Si, bloquear",
    },
    desbloquear: {
      icon: "lock_open",
      iconColor: "text-neg-primary",
      titulo: `¿Desbloquear a ${miembro.nombre}?`,
      desc: "Podra volver a unirse al grupo si es publico. No se reincorpora automaticamente.",
      cta: "Si, desbloquear",
    },
  }[tipo];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4">
      <NegCard
        className="w-full max-w-md space-y-4"
        variant="elevated"
        padding="lg"
      >
        <div className="flex items-start gap-3">
          <span
            className={`material-symbols-outlined text-3xl ${config.iconColor}`}
          >
            {config.icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-neg-on-surface">
              {config.titulo}
            </h2>
            <p className="mt-1 text-sm text-neg-on-surface-variant">
              {config.desc}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <NegButton variant="text" onClick={onCancelar} disabled={ejecutando}>
            Cancelar
          </NegButton>
          <NegButton
            variant="filled"
            icon={ejecutando ? "hourglass_top" : config.icon}
            onClick={onConfirmar}
            disabled={ejecutando}
          >
            {ejecutando ? "Procesando..." : config.cta}
          </NegButton>
        </div>
      </NegCard>
    </div>
  );
}
