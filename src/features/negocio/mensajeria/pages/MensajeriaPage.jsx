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
import {
  createCommunicationGroup,
  deleteGroupMessage,
  getMessageDetail,
  listInbox,
  listMyGroups,
  listSent,
  searchPersonas,
  sendDirectMessage,
  sendGroupMessage,
} from "../mensajeriaService";
import {
  ensureMessagingSocket,
  subscribeMessagingEvents,
} from "../messagingRealtime";

const FEED_OPTIONS = [
  { value: "recibidos", label: "Recibidos" },
  { value: "enviados", label: "Enviados" },
];

const COMPOSE_OPTIONS = [
  { value: "directo", label: "Mensaje directo" },
  { value: "grupo", label: "Mensaje a grupo" },
];

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
      className={`w-full text-left rounded-2xl border p-4 transition-colors hover:border-neg-primary/40 hover:bg-neg-primary/5 ${toneClass} ${
        active ? "ring-2 ring-neg-primary/20" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-neg-on-surface truncate">
              {message.tipo === "grupo"
                ? message.grupo?.nombre
                : message.emisor?.nombre_completo}
            </p>
            <NegChip tone={message.tipo === "grupo" ? "secondary" : "primary"}>
              {message.tipo === "grupo" ? "Grupo" : "Directo"}
            </NegChip>
            {!message.leido && !message.enviado_por_mi && (
              <NegChip tone="warning">No leído</NegChip>
            )}
          </div>
          <p className="text-xs text-neg-on-surface-variant mt-1 truncate">
            {message.tipo === "grupo"
              ? `De ${message.emisor?.nombre_completo}`
              : message.enviado_por_mi
                ? `Para ${message.destinatario?.nombre_completo ?? "sin destinatario"}`
                : message.emisor?.email}
          </p>
        </div>
        <span className="text-[11px] text-neg-on-surface-variant shrink-0">
          {formatDateTime(message.fecha_envio)}
        </span>
      </div>
      <p className="text-sm text-neg-on-surface-variant line-clamp-2">
        {message.preview}
      </p>
      {message.enviado_por_mi && message.tipo === "directo" && (
        <p className="text-[11px] text-neg-on-surface-variant mt-3">
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
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-neg-on-surface">{group.nombre}</p>
            <NegChip tone={group.puede_gestionar ? "primary" : "neutral"}>
              {group.puede_gestionar ? "Admin" : "Miembro"}
            </NegChip>
          </div>
          <p className="text-xs text-neg-on-surface-variant mt-1">
            {group.descripcion?.trim() || "Sin descripción registrada."}
          </p>
        </div>
        <NegChip tone="secondary">{group.total_miembros} miembros</NegChip>
      </div>
    </button>
  );
}

export default function MensajeriaPage() {
  const { token } = useAuth();
  const [feedTab, setFeedTab] = useState("recibidos");
  const [composeMode, setComposeMode] = useState("directo");
  const [showCreateGroup, setShowCreateGroup] = useState(false);

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

  const [createGroupForm, setCreateGroupForm] = useState({
    nombre: "",
    descripcion: "",
    visibilidad: "publico",
    imagen_url: "",
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState("");
  const [createGroupSuccess, setCreateGroupSuccess] = useState("");

  const currentFeed = feedTab === "recibidos" ? inbox : sent;

  const selectedGroupIdsSet = useMemo(
    () => new Set(selectedGroupIds),
    [selectedGroupIds],
  );

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    setFeedError("");
    try {
      const [inboxData, sentData] = await Promise.all([
        listInbox(filters),
        listSent(),
      ]);
      setInbox(Array.isArray(inboxData) ? inboxData : []);
      setSent(Array.isArray(sentData) ? sentData : []);
    } catch (error) {
      setFeedError(
        error?.response?.data?.message ??
          "No se pudo cargar la bandeja de mensajes.",
      );
    } finally {
      setLoadingFeed(false);
    }
  }, [filters]);

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
    if (!directSearchQuery.trim()) {
      setDirectResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchPersonas(directSearchQuery.trim())
        .then((data) => setDirectResults(data))
        .catch(() => setDirectResults([]));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [directSearchQuery]);

  useEffect(() => {
    if (!memberSearchQuery.trim()) {
      setMemberResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchPersonas(memberSearchQuery.trim())
        .then((data) =>
          setMemberResults(
            data.filter(
              (persona) => !selectedMembers.some((item) => item.id === persona.id),
            ),
          ),
        )
        .catch(() => setMemberResults([]));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [memberSearchQuery, selectedMembers]);

  useEffect(() => {
    if (!token) return;

    ensureMessagingSocket(token);
    return subscribeMessagingEvents(() => {
      loadFeed();
      loadGroups();
      if (selectedMessageId) {
        getMessageDetail(selectedMessageId)
          .then((data) => setSelectedMessage(data))
          .catch(() => {});
      }
    });
  }, [token, selectedMessageId, loadFeed, loadGroups]);

  const unreadInbox = inbox.filter((item) => !item.leido).length;

  function toggleGroupSelection(groupId) {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  }

  function addMember(persona) {
    setSelectedMembers((current) => [...current, persona]);
    setMemberSearchQuery("");
    setMemberResults([]);
  }

  function removeMember(personaId) {
    setSelectedMembers((current) => current.filter((item) => item.id !== personaId));
  }

  async function attachLocation(setCoords, setStatus) {
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

  async function handleCreateGroup(event) {
    event.preventDefault();
    setCreateGroupError("");
    setCreateGroupSuccess("");

    if (!createGroupForm.nombre.trim()) {
      setCreateGroupError("El grupo debe tener un nombre.");
      return;
    }

    if (selectedMembers.length < 2) {
      setCreateGroupError("Agrega al menos 2 miembros además del creador.");
      return;
    }

    setCreatingGroup(true);
    try {
      const group = await createCommunicationGroup({
        ...createGroupForm,
        nombre: createGroupForm.nombre.trim(),
        descripcion: createGroupForm.descripcion.trim(),
        imagen_url: createGroupForm.imagen_url.trim(),
        miembro_ids: selectedMembers.map((member) => member.id),
      });

      setCreateGroupSuccess("Grupo creado correctamente.");
      setCreateGroupForm({
        nombre: "",
        descripcion: "",
        visibilidad: "publico",
        imagen_url: "",
      });
      setSelectedMembers([]);
      setMemberSearchQuery("");
      setMemberResults([]);
      setShowCreateGroup(false);
      setSelectedGroupIds((current) =>
        current.includes(group.id) ? current : [...current, group.id],
      );
      loadGroups();
    } catch (error) {
      setCreateGroupError(
        error?.response?.data?.message ??
          "No se pudo crear el grupo de comunicación.",
      );
    } finally {
      setCreatingGroup(false);
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
    <div className="max-w-7xl mx-auto">
      <NegPageHeader
        eyebrow="HU 3-004 · 3-005 · 3-006 · 3-007"
        title="Comunicación y mensajería"
        subtitle="Consulta tu bandeja, envía mensajes directos o a grupos, y crea grupos de comunicación con otros usuarios del sistema."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NegChip tone="primary" icon="mail">
              {unreadInbox} no leído{unreadInbox === 1 ? "" : "s"}
            </NegChip>
            <NegButton
              size="sm"
              variant="tonal"
              icon="groups"
              onClick={() => setShowCreateGroup((current) => !current)}
            >
              {showCreateGroup ? "Ocultar grupo" : "Crear grupo"}
            </NegButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <div className="space-y-5">
          <NegCard>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Bandeja y enviados
                </h2>
                <p className="text-sm text-neg-on-surface-variant mt-1">
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
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm text-neg-on-surface">
                    <input
                      type="checkbox"
                      checked={filters.soloNoLeidos}
                      onChange={(e) =>
                        setFilters((current) => ({
                          ...current,
                          soloNoLeidos: e.target.checked,
                        }))
                      }
                    />
                    Solo no leídos
                  </label>
                  <select
                    value={filters.tipo}
                    onChange={(e) =>
                      setFilters((current) => ({
                        ...current,
                        tipo: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border border-neg-outline-variant bg-neg-surface-container-lowest px-3 text-sm text-neg-on-surface"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="directo">Directos</option>
                    <option value="grupo">Grupales</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <NegInput
                    type="date"
                    label="Desde"
                    value={filters.fechaDesde}
                    onChange={(e) =>
                      setFilters((current) => ({
                        ...current,
                        fechaDesde: e.target.value,
                      }))
                    }
                  />
                  <NegInput
                    type="date"
                    label="Hasta"
                    value={filters.fechaHasta}
                    onChange={(e) =>
                      setFilters((current) => ({
                        ...current,
                        fechaHasta: e.target.value,
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
              <div className="space-y-3 max-h-[740px] overflow-y-auto pr-1">
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Mis grupos
                </h2>
                <p className="text-sm text-neg-on-surface-variant mt-1">
                  Selecciona grupos para enviar mensajes o revisar sus miembros.
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
                description="Crea un grupo de comunicación o espera a ser agregado a uno."
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Detalle del mensaje
                </h2>
                <p className="text-sm text-neg-on-surface-variant mt-1">
                  Al abrir un mensaje recibido se marca automáticamente como leído.
                </p>
              </div>
              {selectedMessage && (
                <div className="flex flex-wrap gap-2">
                  <NegButton size="sm" variant="outlined" icon="reply" onClick={prepareReply}>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <NegChip tone={selectedMessage.tipo === "grupo" ? "secondary" : "primary"}>
                    {selectedMessage.tipo === "grupo" ? "Mensaje grupal" : "Mensaje directo"}
                  </NegChip>
                  <NegChip tone={selectedMessage.leido ? "success" : "warning"}>
                    {selectedMessage.leido ? "Leído" : "Pendiente"}
                  </NegChip>
                  <NegChip tone="neutral">{formatDateTime(selectedMessage.fecha_envio)}</NegChip>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <NegCard variant="subtle" padding="sm">
                    <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                      Emisor
                    </p>
                    <p className="font-semibold text-neg-on-surface mt-1">
                      {selectedMessage.emisor?.nombre_completo}
                    </p>
                    <p className="text-sm text-neg-on-surface-variant">
                      {selectedMessage.emisor?.email}
                    </p>
                  </NegCard>
                  <NegCard variant="subtle" padding="sm">
                    <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                      Destino
                    </p>
                    <p className="font-semibold text-neg-on-surface mt-1">
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

                <div>
                  <p className="text-sm font-semibold text-neg-on-surface mb-2">
                    Contenido
                  </p>
                  <div className="rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest px-4 py-4 text-sm text-neg-on-surface whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.contenido}
                  </div>
                </div>

                {(selectedMessage.latitud != null || selectedMessage.longitud != null) && (
                  <div>
                    <p className="text-sm font-semibold text-neg-on-surface mb-2">
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
                    <div className="flex items-center justify-between gap-3 mb-3">
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
                            className="rounded-xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest px-4 py-3 flex items-center justify-between gap-3"
                          >
                            <div>
                              <p className="font-medium text-neg-on-surface">
                                {reader.nombre_completo}
                              </p>
                              <p className="text-xs text-neg-on-surface-variant">
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Redactar mensaje
                </h2>
                <p className="text-sm text-neg-on-surface-variant mt-1">
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
                  onChange={(e) => setDirectSearchQuery(e.target.value)}
                  placeholder="Ej. Ana, Pedro, correo@ejemplo.com"
                  iconStart="search"
                />

                {directRecipient && (
                  <div className="flex items-center gap-2 flex-wrap">
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
                  <div className="rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest divide-y divide-neg-outline-variant/20 overflow-hidden">
                    {directResults.map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-neg-primary/5 transition-colors"
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
                  onChange={(e) => setDirectMessage(e.target.value)}
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
                  <p className="text-sm font-semibold text-neg-on-surface mb-2">
                    Selecciona uno o varios grupos
                  </p>
                  {groups.length === 0 ? (
                    <p className="text-sm text-neg-on-surface-variant">
                      Aún no perteneces a ningún grupo.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  onChange={(e) => setGroupMessage(e.target.value)}
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

          {showCreateGroup && (
            <NegCard>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                    Crear grupo de comunicación
                  </h2>
                  <p className="text-sm text-neg-on-surface-variant mt-1">
                    Agrega al menos 2 miembros, define la visibilidad y deja listo el grupo para mensajería.
                  </p>
                </div>
                <NegButton
                  size="sm"
                  variant="text"
                  icon="close"
                  onClick={() => setShowCreateGroup(false)}
                >
                  Cerrar
                </NegButton>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <NegInput
                    label="Nombre del grupo"
                    value={createGroupForm.nombre}
                    onChange={(e) =>
                      setCreateGroupForm((current) => ({
                        ...current,
                        nombre: e.target.value,
                      }))
                    }
                    placeholder="Ej. Ruta Norte 7AM"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-neg-on-surface-variant">
                      Visibilidad
                    </label>
                    <select
                      value={createGroupForm.visibilidad}
                      onChange={(e) =>
                        setCreateGroupForm((current) => ({
                          ...current,
                          visibilidad: e.target.value,
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
                  onChange={(e) =>
                    setCreateGroupForm((current) => ({
                      ...current,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="¿Para qué sirve este grupo?"
                />

                <NegInput
                  label="Imagen o ícono (URL opcional)"
                  value={createGroupForm.imagen_url}
                  onChange={(e) =>
                    setCreateGroupForm((current) => ({
                      ...current,
                      imagen_url: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  iconStart="image"
                />

                <NegInput
                  label="Buscar personas por nombre o email"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Busca personas para agregarlas al grupo"
                  iconStart="search"
                />

                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-neg-primary-container text-neg-on-primary-container text-xs font-semibold"
                      >
                        {member.nombre_completo}
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    ))}
                  </div>
                )}

                {memberResults.length > 0 && (
                  <div className="rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest divide-y divide-neg-outline-variant/20 overflow-hidden max-h-64 overflow-y-auto">
                    {memberResults.map((persona) => (
                      <button
                        key={`member-${persona.id}`}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-neg-primary/5 transition-colors"
                        onClick={() => addMember(persona)}
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
                {createGroupSuccess && (
                  <div className="rounded-xl border border-neg-primary bg-neg-primary/10 px-4 py-3 text-sm text-neg-primary">
                    {createGroupSuccess}
                  </div>
                )}

                <div className="flex justify-end">
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
        </div>
      </div>
    </div>
  );
}
