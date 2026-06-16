import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NegButton,
  NegCard,
  NegChip,
  NegEmptyState,
  NegInput,
  NegPageHeader,
  NegSegmentedControl,
  NegTextarea,
} from "../../../../components/negocio";
import { useAuth } from "../../../../context/AuthContext";
import { useMessageNotifications } from "../messageNotificationsContext";
import {
  deleteGroupMessage,
  getMessageDetail,
  getUnreadCount,
  listInbox,
  listMyGroups,
  listSent,
  searchPersonas,
  sendDirectMessage,
  sendGroupMessage,
} from "../mensajeriaService";
import { subscribeMessagingEvents } from "../messagingRealtime";

const FEED_OPTIONS = [
  { value: "recibidos", label: "Recibidos" },
  { value: "enviados", label: "Enviados" },
];

const COMPOSE_OPTIONS = [
  { value: "directo", label: "Mensaje directo" },
  { value: "grupo", label: "Mensaje a grupo" },
];

const MESSAGING_EVENTS = new Set([
  "mensaje:nuevo",
  "mensaje:grupo",
  "mensaje:leido",
  "mensaje:grupo-eliminado",
  "grupo:bienvenida",
  "grupo:miembro-agregado",
  "grupo:miembro-removido",
]);

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function getMessageTarget(detail) {
  if (!detail) return null;
  if (detail.tipo === "grupo") return detail.grupo;
  return detail.enviado_por_mi ? detail.destinatario : detail.emisor;
}

function MessageListItem({ message, active, onClick }) {
  const toneClass = !message.leido && !message.enviado_por_mi
    ? "border-neg-primary/40 bg-neg-primary/10"
    : "border-neg-outline-variant/40 bg-neg-surface-container-lowest";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-colors hover:border-neg-primary/40 hover:bg-neg-primary/5 ${toneClass} ${
        active ? "ring-2 ring-neg-primary/20" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-neg-on-surface">
              {message.tipo === "grupo"
                ? message.grupo?.nombre
                : message.enviado_por_mi
                  ? message.destinatario?.nombre_completo
                  : message.emisor?.nombre_completo}
            </p>
            <NegChip tone={message.tipo === "grupo" ? "secondary" : "primary"}>
              {message.tipo === "grupo" ? "Grupo" : "Directo"}
            </NegChip>
            {!message.leido && !message.enviado_por_mi && (
              <NegChip tone="warning">No leído</NegChip>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-neg-on-surface-variant">
            {message.tipo === "grupo"
              ? `De ${message.emisor?.nombre_completo}`
              : message.enviado_por_mi
                ? `Para ${message.destinatario?.email ?? "sin destinatario"}`
                : message.emisor?.email}
          </p>
        </div>
        <span className="shrink-0 text-[11px] text-neg-on-surface-variant">
          {formatDateTime(message.fecha_envio)}
        </span>
      </div>

      <p className="line-clamp-2 text-sm text-neg-on-surface-variant">
        {message.preview}
      </p>

      {message.enviado_por_mi && message.tipo === "directo" && (
        <p className="mt-3 text-[11px] text-neg-on-surface-variant">
          {message.leido
            ? `Leído el ${formatDateTime(message.leido_en)}`
            : "Pendiente de lectura"}
        </p>
      )}
    </button>
  );
}

function GroupSelectionCard({ group, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(group.id)}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        selected
          ? "border-neg-primary bg-neg-primary/10"
          : "border-neg-outline-variant/40 bg-neg-surface-container-lowest hover:border-neg-primary/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neg-primary-container text-neg-on-primary-container">
            {group.imagen_url ? (
              <img
                src={group.imagen_url}
                alt={`Grupo ${group.nombre}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined">groups</span>
            )}
          </div>
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-neg-on-surface">
              {group.nombre}
            </p>
            <NegChip tone={group.puede_gestionar ? "primary" : "neutral"}>
              {group.puede_gestionar ? "Admin" : "Miembro"}
            </NegChip>
          </div>
          <p className="mt-1 text-xs text-neg-on-surface-variant">
            {group.descripcion?.trim() || "Sin descripción registrada."}
          </p>
        </div>
        </div>
        <NegChip tone="secondary">
          {group.total_miembros ?? 0} miembros
        </NegChip>
      </div>
    </button>
  );
}

export default function MensajeriaPage() {
  const { token } = useAuth();
  const { unreadCount, syncUnreadCount } = useMessageNotifications();

  const [feedTab, setFeedTab] = useState("recibidos");
  const [composeMode, setComposeMode] = useState("directo");
  const [filters, setFilters] = useState({
    tipo: "",
    soloNoLeidos: false,
    fechaDesde: "",
    fechaHasta: "",
  });

  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [groupError, setGroupError] = useState("");

  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [directSearchQuery, setDirectSearchQuery] = useState("");
  const [directResults, setDirectResults] = useState([]);
  const [directRecipient, setDirectRecipient] = useState(null);
  const [directMessage, setDirectMessage] = useState("");
  const [directCoords, setDirectCoords] = useState(null);
  const [directLocationState, setDirectLocationState] = useState("");
  const [directSubmitting, setDirectSubmitting] = useState(false);
  const [directError, setDirectError] = useState("");
  const [directSuccess, setDirectSuccess] = useState("");

  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [groupMessage, setGroupMessage] = useState("");
  const [groupCoords, setGroupCoords] = useState(null);
  const [groupLocationState, setGroupLocationState] = useState("");
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [groupComposeError, setGroupComposeError] = useState("");
  const [groupComposeSuccess, setGroupComposeSuccess] = useState("");

  const currentFeed = feedTab === "recibidos" ? inbox : sent;
  const selectedGroupIdsSet = useMemo(
    () => new Set(selectedGroupIds),
    [selectedGroupIds],
  );

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    setFeedError("");
    try {
      const [inboxData, sentData, unread] = await Promise.all([
        listInbox(filters),
        listSent(),
        getUnreadCount(),
      ]);
      setInbox(Array.isArray(inboxData) ? inboxData : []);
      setSent(Array.isArray(sentData) ? sentData : []);
      syncUnreadCount(Number(unread ?? 0));
    } catch (error) {
      setFeedError(
        error?.response?.data?.message ??
          "No se pudo cargar la bandeja de mensajes.",
      );
    } finally {
      setLoadingFeed(false);
    }
  }, [filters, syncUnreadCount]);

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    setGroupError("");
    try {
      const data = await listMyGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      setGroupError(
        error?.response?.data?.message ??
          "No se pudieron cargar tus grupos.",
      );
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const refreshSelectedDetail = useCallback(async () => {
    if (!selectedMessageId) return;
    try {
      const data = await getMessageDetail(selectedMessageId);
      setSelectedMessage(data);
    } catch {
      setSelectedMessage(null);
    }
  }, [selectedMessageId]);

  useEffect(() => {
    loadFeed();
    loadGroups();
  }, [loadFeed, loadGroups]);

  useEffect(() => {
    if (!selectedMessageId) {
      setSelectedMessage(null);
      setDetailError("");
      return;
    }

    let active = true;
    setDetailLoading(true);
    setDetailError("");

    getMessageDetail(selectedMessageId)
      .then((data) => {
        if (!active) return;
        setSelectedMessage(data);
        loadFeed();
      })
      .catch((error) => {
        if (!active) return;
        setSelectedMessage(null);
        setDetailError(
          error?.response?.data?.message ??
            "No se pudo cargar el detalle del mensaje.",
        );
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMessageId, loadFeed]);

  useEffect(() => {
    const q = directSearchQuery.trim();
    if (!q) {
      setDirectResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchPersonas(q)
        .then((data) => setDirectResults(Array.isArray(data) ? data : []))
        .catch(() => setDirectResults([]));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [directSearchQuery]);

  useEffect(() => {
    if (!token) return undefined;

    return subscribeMessagingEvents(({ type, payload }) => {
      if (!MESSAGING_EVENTS.has(type)) return;

      if (
        type === "mensaje:grupo-eliminado" &&
        Number(payload?.mensaje_id) === Number(selectedMessageId)
      ) {
        setSelectedMessageId(null);
        setSelectedMessage(null);
        setDetailError("El mensaje grupal fue eliminado del grupo.");
      } else {
        void refreshSelectedDetail();
      }

      void loadFeed();
      if (
        type === "mensaje:grupo" ||
        type === "mensaje:grupo-eliminado" ||
        type === "grupo:bienvenida" ||
        type === "grupo:miembro-agregado" ||
        type === "grupo:miembro-removido"
      ) {
        void loadGroups();
      }
    });
  }, [token, selectedMessageId, loadFeed, loadGroups, refreshSelectedDetail]);

  function toggleGroupSelection(groupId) {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  }

  function attachLocation(setCoords, setStatus) {
    if (!navigator.geolocation) {
      setStatus("Tu navegador no soporta geolocalización.");
      return;
    }

    setStatus("Obteniendo ubicación actual...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        });
        setStatus("Ubicación adjuntada correctamente.");
      },
      () => {
        setStatus("No fue posible obtener tu ubicación actual.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSendDirect(event) {
    event.preventDefault();
    setDirectError("");
    setDirectSuccess("");

    if (!directRecipient) {
      setDirectError("Selecciona una persona destinataria.");
      return;
    }

    if (!directMessage.trim()) {
      setDirectError("Escribe un mensaje antes de enviarlo.");
      return;
    }

    setDirectSubmitting(true);
    try {
      const detail = await sendDirectMessage({
        destinatario_id: directRecipient.id,
        contenido: directMessage.trim(),
        latitud: directCoords?.latitud,
        longitud: directCoords?.longitud,
      });
      setDirectMessage("");
      setDirectCoords(null);
      setDirectLocationState("");
      setDirectSuccess("Mensaje enviado correctamente.");
      setSelectedMessageId(detail?.id ?? null);
      setFeedTab("enviados");
      loadFeed();
    } catch (error) {
      setDirectError(
        error?.response?.data?.message ??
          "No se pudo enviar el mensaje directo.",
      );
    } finally {
      setDirectSubmitting(false);
    }
  }

  async function handleSendGroup(event) {
    event.preventDefault();
    setGroupComposeError("");
    setGroupComposeSuccess("");

    if (selectedGroupIds.length === 0) {
      setGroupComposeError("Selecciona al menos un grupo destinatario.");
      return;
    }

    if (!groupMessage.trim()) {
      setGroupComposeError("Escribe un mensaje para los grupos seleccionados.");
      return;
    }

    setGroupSubmitting(true);
    try {
      const response = await sendGroupMessage({
        grupos_ids: selectedGroupIds,
        contenido: groupMessage.trim(),
        latitud: groupCoords?.latitud,
        longitud: groupCoords?.longitud,
      });

      setGroupMessage("");
      setGroupCoords(null);
      setGroupLocationState("");
      setGroupComposeSuccess(
        `Mensaje enviado a ${response.length} grupo${response.length === 1 ? "" : "s"}.`,
      );
      setFeedTab("enviados");
      setSelectedMessageId(response[0]?.id ?? null);
      loadFeed();
    } catch (error) {
      setGroupComposeError(
        error?.response?.data?.message ??
          "No se pudo enviar el mensaje grupal.",
      );
    } finally {
      setGroupSubmitting(false);
    }
  }

  async function handleDeleteSelectedGroupMessage() {
    if (!selectedMessage?.grupo?.id) return;
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este mensaje del grupo?",
    );
    if (!confirmed) return;

    try {
      await deleteGroupMessage(selectedMessage.grupo.id, selectedMessage.id);
      setSelectedMessageId(null);
      setSelectedMessage(null);
      setDetailError("");
      loadFeed();
    } catch (error) {
      setDetailError(
        error?.response?.data?.message ??
          "No se pudo eliminar el mensaje del grupo.",
      );
    }
  }

  function prepareReply() {
    if (!selectedMessage) return;

    if (selectedMessage.tipo === "grupo" && selectedMessage.grupo) {
      setComposeMode("grupo");
      setSelectedGroupIds([selectedMessage.grupo.id]);
      return;
    }

    const target = getMessageTarget(selectedMessage);
    if (!target?.id) return;

    setComposeMode("directo");
    setDirectRecipient(target);
    setDirectSearchQuery("");
    setDirectResults([]);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <NegPageHeader
        eyebrow="HU 3-004 · HU 3-005"
        title="Comunicación y mensajería"
        subtitle="Consulta tu bandeja, envía mensajes directos o a grupos y revisa el estado de lectura en tiempo real."
        actions={(
          <NegChip tone="primary" icon="mail">
            {unreadCount} no leído{unreadCount === 1 ? "" : "s"}
          </NegChip>
        )}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <NegCard>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Bandeja y enviados
                </h2>
                <p className="mt-1 text-sm text-neg-on-surface-variant">
                  Abre un mensaje para marcarlo como leído y responder desde el detalle.
                </p>
              </div>
              <NegSegmentedControl
                value={feedTab}
                onChange={setFeedTab}
                options={FEED_OPTIONS}
              />
            </div>

            {feedTab === "recibidos" && (
              <div className="mb-4 grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-neg-on-surface">
                    <input
                      type="checkbox"
                      checked={filters.soloNoLeidos}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          soloNoLeidos: event.target.checked,
                        }))
                      }
                    />
                    Solo no leídos
                  </label>

                  <select
                    value={filters.tipo}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        tipo: event.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border border-neg-outline-variant bg-neg-surface-container-lowest px-3 text-sm text-neg-on-surface"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="directo">Directos</option>
                    <option value="grupo">Grupales</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NegInput
                    type="date"
                    label="Desde"
                    value={filters.fechaDesde}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        fechaDesde: event.target.value,
                      }))
                    }
                  />
                  <NegInput
                    type="date"
                    label="Hasta"
                    value={filters.fechaHasta}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        fechaHasta: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {feedError && (
              <div className="mb-4 rounded-xl border border-neg-error bg-neg-error-container/30 px-4 py-3 text-sm text-neg-error">
                {feedError}
              </div>
            )}

            {loadingFeed ? (
              <div className="py-12 text-center text-sm text-neg-on-surface-variant">
                Cargando mensajes...
              </div>
            ) : currentFeed.length === 0 ? (
              <NegEmptyState
                icon="mail"
                title="Sin mensajes para mostrar"
                description="Cuando recibas o envíes mensajes, aparecerán aquí."
              />
            ) : (
              <div className="max-h-[740px] space-y-3 overflow-y-auto pr-1">
                {currentFeed.map((message) => (
                  <MessageListItem
                    key={`${feedTab}-${message.id}`}
                    message={message}
                    active={selectedMessageId === message.id}
                    onClick={() => setSelectedMessageId(message.id)}
                  />
                ))}
              </div>
            )}
          </NegCard>

          <NegCard>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Mis grupos
                </h2>
                <p className="mt-1 text-sm text-neg-on-surface-variant">
                  Selecciona uno o varios grupos de los que eres miembro para comunicar novedades.
                </p>
              </div>
              <NegChip tone="secondary">{groups.length} grupos</NegChip>
            </div>

            {groupError && (
              <div className="mb-4 rounded-xl border border-neg-error bg-neg-error-container/30 px-4 py-3 text-sm text-neg-error">
                {groupError}
              </div>
            )}

            {loadingGroups ? (
              <div className="py-10 text-center text-sm text-neg-on-surface-variant">
                Cargando grupos...
              </div>
            ) : groups.length === 0 ? (
              <NegEmptyState
                icon="groups"
                title="Sin grupos activos"
                description="Cuando pertenezcas a un grupo, aparecerá aquí para enviar mensajes grupales."
              />
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <GroupSelectionCard
                    key={group.id}
                    group={group}
                    selected={selectedGroupIdsSet.has(group.id)}
                    onToggle={(groupId) => {
                      setComposeMode("grupo");
                      toggleGroupSelection(groupId);
                    }}
                  />
                ))}
              </div>
            )}
          </NegCard>
        </div>

        <div className="space-y-5">
          <NegCard>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Detalle del mensaje
                </h2>
                <p className="mt-1 text-sm text-neg-on-surface-variant">
                  Al abrir un mensaje recibido se marca automáticamente como leído.
                </p>
              </div>

              {selectedMessage && (
                <div className="flex flex-wrap gap-2">
                  <NegButton
                    size="sm"
                    variant="outlined"
                    icon="reply"
                    onClick={prepareReply}
                  >
                    Responder
                  </NegButton>
                  {selectedMessage.tipo === "grupo" && selectedMessage.puede_eliminar && (
                    <NegButton
                      size="sm"
                      variant="danger-tonal"
                      icon="delete"
                      onClick={handleDeleteSelectedGroupMessage}
                    >
                      Eliminar
                    </NegButton>
                  )}
                </div>
              )}
            </div>

            {detailError && (
              <div className="mb-4 rounded-xl border border-neg-error bg-neg-error-container/30 px-4 py-3 text-sm text-neg-error">
                {detailError}
              </div>
            )}

            {detailLoading ? (
              <div className="py-16 text-center text-sm text-neg-on-surface-variant">
                Cargando detalle...
              </div>
            ) : !selectedMessage ? (
              <NegEmptyState
                icon="mark_email_read"
                title="Sin mensaje seleccionado"
                description="Elige un mensaje de la bandeja o de enviados para ver su información completa."
              />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <NegChip tone={selectedMessage.tipo === "grupo" ? "secondary" : "primary"}>
                    {selectedMessage.tipo === "grupo" ? "Mensaje grupal" : "Mensaje directo"}
                  </NegChip>
                  <NegChip tone={selectedMessage.leido ? "success" : "warning"}>
                    {selectedMessage.leido ? "Leído" : "Pendiente"}
                  </NegChip>
                  <NegChip tone="neutral">
                    {formatDateTime(selectedMessage.fecha_envio)}
                  </NegChip>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <NegCard variant="subtle" padding="sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neg-on-surface-variant">
                      Emisor
                    </p>
                    <p className="mt-1 font-semibold text-neg-on-surface">
                      {selectedMessage.emisor?.nombre_completo}
                    </p>
                    <p className="text-sm text-neg-on-surface-variant">
                      {selectedMessage.emisor?.email}
                    </p>
                  </NegCard>
                  <NegCard variant="subtle" padding="sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neg-on-surface-variant">
                      Destino
                    </p>
                    <p className="mt-1 font-semibold text-neg-on-surface">
                      {selectedMessage.tipo === "grupo"
                        ? selectedMessage.grupo?.nombre
                        : selectedMessage.destinatario?.nombre_completo}
                    </p>
                    <p className="text-sm text-neg-on-surface-variant">
                      {selectedMessage.tipo === "grupo"
                        ? `Grupo ${selectedMessage.grupo?.visibilidad}`
                        : selectedMessage.destinatario?.email}
                    </p>
                  </NegCard>
                </div>

                {selectedMessage.tipo === "grupo" && selectedMessage.enviado_por_mi && (
                  <div className="rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest px-4 py-3 text-sm text-neg-on-surface-variant">
                    {selectedMessage.total_destinatarios ?? 0} destinatario
                    {(selectedMessage.total_destinatarios ?? 0) === 1 ? "" : "s"} ·{" "}
                    {selectedMessage.total_leidos ?? 0} lectura
                    {(selectedMessage.total_leidos ?? 0) === 1 ? "" : "s"} registrada
                    {(selectedMessage.total_leidos ?? 0) === (selectedMessage.total_destinatarios ?? -1)
                      ? ". Todos lo han leído."
                      : ". Aún hay miembros pendientes por leerlo."}
                  </div>
                )}

                {selectedMessage.tipo === "directo" && selectedMessage.enviado_por_mi && (
                  <div className="rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest px-4 py-3 text-sm text-neg-on-surface-variant">
                    {selectedMessage.leido
                      ? `El destinatario leyó este mensaje el ${formatDateTime(selectedMessage.leido_en)}.`
                      : "El destinatario aún no ha leído este mensaje."}
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-semibold text-neg-on-surface">
                    Contenido
                  </p>
                  <div className="whitespace-pre-wrap rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest px-4 py-4 text-sm leading-relaxed text-neg-on-surface">
                    {selectedMessage.contenido}
                  </div>
                </div>

                {(selectedMessage.latitud != null || selectedMessage.longitud != null) && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-neg-on-surface">
                      Ubicación adjunta
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <NegChip tone="tertiary" icon="location_on">
                        Lat {selectedMessage.latitud}
                      </NegChip>
                      <NegChip tone="tertiary" icon="location_on">
                        Lng {selectedMessage.longitud}
                      </NegChip>
                    </div>
                  </div>
                )}

                {selectedMessage.tipo === "grupo" && (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-neg-on-surface">
                        Lecturas del grupo
                      </p>
                      <NegChip tone="secondary">
                        {selectedMessage.lecturas?.filter((item) => item.leido).length ?? 0}
                        {" / "}
                        {selectedMessage.lecturas?.length ?? 0}
                      </NegChip>
                    </div>

                    {selectedMessage.lecturas?.length ? (
                      <div className="space-y-2">
                        {selectedMessage.lecturas.map((reader) => (
                          <div
                            key={`${selectedMessage.id}-${reader.id}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-neg-on-surface">
                                {reader.nombre_completo}
                              </p>
                              <p className="truncate text-xs text-neg-on-surface-variant">
                                {reader.email} · {reader.rol}
                              </p>
                            </div>
                            <NegChip tone={reader.leido ? "success" : "warning"}>
                              {reader.leido
                                ? `Leído ${formatDateTime(reader.leido_en)}`
                                : "Sin leer"}
                            </NegChip>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neg-on-surface-variant">
                        No hay miembros para mostrar en este grupo.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </NegCard>

          <NegCard>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Redactar mensaje
                </h2>
                <p className="mt-1 text-sm text-neg-on-surface-variant">
                  Elige si enviarás un mensaje privado o a uno o varios grupos.
                </p>
              </div>
              <NegSegmentedControl
                value={composeMode}
                onChange={setComposeMode}
                options={COMPOSE_OPTIONS}
              />
            </div>

            {composeMode === "directo" ? (
              <form onSubmit={handleSendDirect} className="space-y-4">
                <NegInput
                  label="Buscar persona por nombre o email"
                  value={directSearchQuery}
                  onChange={(event) => setDirectSearchQuery(event.target.value)}
                  placeholder="Ej. Ana, Pedro, correo@ejemplo.com"
                  iconStart="search"
                />

                {directRecipient && (
                  <div className="flex flex-wrap items-center gap-2">
                    <NegChip tone="primary" icon="person">
                      {directRecipient.nombre_completo}
                    </NegChip>
                    <button
                      type="button"
                      className="text-sm text-neg-primary"
                      onClick={() => setDirectRecipient(null)}
                    >
                      Cambiar destinatario
                    </button>
                  </div>
                )}

                {!directRecipient && directResults.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest divide-y divide-neg-outline-variant/20">
                    {directResults.map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-neg-primary/5"
                        onClick={() => {
                          setDirectRecipient(persona);
                          setDirectSearchQuery("");
                          setDirectResults([]);
                        }}
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

                <NegTextarea
                  label="Mensaje"
                  rows={5}
                  value={directMessage}
                  onChange={(event) => setDirectMessage(event.target.value)}
                  placeholder="Escribe tu mensaje privado..."
                  hint={`${directMessage.length}/500 caracteres`}
                  maxLength={500}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <NegButton
                    type="button"
                    variant="outlined"
                    icon="location_on"
                    onClick={() =>
                      attachLocation(setDirectCoords, setDirectLocationState)
                    }
                  >
                    Adjuntar ubicación
                  </NegButton>
                  {directCoords && (
                    <NegChip tone="tertiary">
                      {directCoords.latitud.toFixed(5)}, {directCoords.longitud.toFixed(5)}
                    </NegChip>
                  )}
                  {directLocationState && (
                    <span className="text-xs text-neg-on-surface-variant">
                      {directLocationState}
                    </span>
                  )}
                </div>

                {directError && (
                  <div className="rounded-xl border border-neg-error bg-neg-error-container/30 px-4 py-3 text-sm text-neg-error">
                    {directError}
                  </div>
                )}
                {directSuccess && (
                  <div className="rounded-xl border border-neg-primary bg-neg-primary/10 px-4 py-3 text-sm text-neg-primary">
                    {directSuccess}
                  </div>
                )}

                <div className="flex justify-end">
                  <NegButton
                    type="submit"
                    icon={directSubmitting ? "hourglass_top" : "send"}
                    disabled={directSubmitting}
                  >
                    {directSubmitting ? "Enviando..." : "Enviar mensaje directo"}
                  </NegButton>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSendGroup} className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-neg-on-surface">
                    Selecciona uno o varios grupos
                  </p>
                  {groups.length === 0 ? (
                    <p className="text-sm text-neg-on-surface-variant">
                      Aún no perteneces a ningún grupo.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {groups.map((group) => (
                        <GroupSelectionCard
                          key={`compose-${group.id}`}
                          group={group}
                          selected={selectedGroupIdsSet.has(group.id)}
                          onToggle={toggleGroupSelection}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <NegTextarea
                  label="Mensaje al grupo"
                  rows={5}
                  value={groupMessage}
                  onChange={(event) => setGroupMessage(event.target.value)}
                  placeholder="Comparte retrasos, cambios de ruta o novedades para los pasajeros..."
                  hint={`${groupMessage.length}/500 caracteres`}
                  maxLength={500}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <NegButton
                    type="button"
                    variant="outlined"
                    icon="location_on"
                    onClick={() =>
                      attachLocation(setGroupCoords, setGroupLocationState)
                    }
                  >
                    Adjuntar ubicación
                  </NegButton>
                  {groupCoords && (
                    <NegChip tone="tertiary">
                      {groupCoords.latitud.toFixed(5)}, {groupCoords.longitud.toFixed(5)}
                    </NegChip>
                  )}
                  {groupLocationState && (
                    <span className="text-xs text-neg-on-surface-variant">
                      {groupLocationState}
                    </span>
                  )}
                </div>

                {groupComposeError && (
                  <div className="rounded-xl border border-neg-error bg-neg-error-container/30 px-4 py-3 text-sm text-neg-error">
                    {groupComposeError}
                  </div>
                )}
                {groupComposeSuccess && (
                  <div className="rounded-xl border border-neg-primary bg-neg-primary/10 px-4 py-3 text-sm text-neg-primary">
                    {groupComposeSuccess}
                  </div>
                )}

                <div className="flex justify-end">
                  <NegButton
                    type="submit"
                    icon={groupSubmitting ? "hourglass_top" : "campaign"}
                    disabled={groupSubmitting}
                  >
                    {groupSubmitting ? "Enviando..." : "Enviar a grupos"}
                  </NegButton>
                </div>
              </form>
            )}
          </NegCard>
        </div>
      </div>
    </div>
  );
}
