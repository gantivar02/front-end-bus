import { useCallback, useEffect, useState } from "react";
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
  getMessageDetail,
  getUnreadCount,
  listInbox,
  listSent,
  searchPersonas,
  sendDirectMessage,
} from "../mensajeriaService";
import {
  ensureMessagingSocket,
  subscribeMessagingEvents,
} from "../messagingRealtime";

const FEED_OPTIONS = [
  { value: "recibidos", label: "Recibidos" },
  { value: "enviados", label: "Enviados" },
];

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-neg-on-surface truncate">
              {message.enviado_por_mi
                ? message.destinatario?.nombre_completo
                : message.emisor?.nombre_completo}
            </p>
            <NegChip tone="primary">Directo</NegChip>
            {!message.leido && !message.enviado_por_mi && (
              <NegChip tone="warning">No leído</NegChip>
            )}
          </div>
          <p className="text-xs text-neg-on-surface-variant mt-1 truncate">
            {message.enviado_por_mi
              ? `Para ${message.destinatario?.email}`
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
      {message.enviado_por_mi && (
        <p className="text-[11px] text-neg-on-surface-variant mt-3">
          {message.leido
            ? `Leído el ${formatDateTime(message.leido_en)}`
            : "Pendiente de lectura"}
        </p>
      )}
    </button>
  );
}

export default function MensajesDirectosPage() {
  const { token } = useAuth();

  const [feedTab, setFeedTab] = useState("recibidos");
  const [soloNoLeidos, setSoloNoLeidos] = useState(false);
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState("");

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

  const currentFeed = feedTab === "recibidos" ? inbox : sent;

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    setFeedError("");
    try {
      const [inboxData, sentData, unread] = await Promise.all([
        listInbox({ tipo: "directo", soloNoLeidos }),
        listSent(),
        getUnreadCount(),
      ]);
      setInbox(Array.isArray(inboxData) ? inboxData : []);
      setSent(Array.isArray(sentData) ? sentData : []);
      setUnreadCount(Number(unread ?? 0));
    } catch (error) {
      setFeedError(
        error?.response?.data?.message ??
          "No se pudo cargar la bandeja de mensajes.",
      );
    } finally {
      setLoadingFeed(false);
    }
  }, [soloNoLeidos]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

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

    ensureMessagingSocket(token);
    return subscribeMessagingEvents(({ type }) => {
      if (type !== "mensaje:nuevo" && type !== "mensaje:leido") return;
      loadFeed();
      if (selectedMessageId) {
        getMessageDetail(selectedMessageId)
          .then((data) => setSelectedMessage(data))
          .catch(() => {});
      }
    });
  }, [token, selectedMessageId, loadFeed]);

  function prepareReply() {
    if (!selectedMessage) return;
    const target = selectedMessage.enviado_por_mi
      ? selectedMessage.destinatario
      : selectedMessage.emisor;
    if (!target?.id) return;
    setDirectRecipient(target);
    setDirectSearchQuery("");
    setDirectResults([]);
  }

  function attachLocation() {
    if (!navigator.geolocation) {
      setDirectLocationState("Tu navegador no soporta geolocalización.");
      return;
    }

    setDirectLocationState("Obteniendo ubicación actual...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDirectCoords({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
        });
        setDirectLocationState("Ubicación adjuntada correctamente.");
      },
      () => {
        setDirectLocationState("No fue posible obtener tu ubicación actual.");
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

  return (
    <div className="max-w-7xl mx-auto">
      <NegPageHeader
        eyebrow="HU 3-004"
        title="Mensajería directa"
        subtitle="Busca personas del sistema, envía mensajes privados con ubicación opcional y consulta el estado de lectura en tiempo real."
        actions={
          <NegChip tone="primary" icon="mail">
            {unreadCount} no leído{unreadCount === 1 ? "" : "s"}
          </NegChip>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <NegCard>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                Bandeja
              </h2>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                Abre un mensaje recibido para marcarlo como leído.
              </p>
            </div>
            <NegSegmentedControl
              value={feedTab}
              onChange={setFeedTab}
              options={FEED_OPTIONS}
            />
          </div>

          {feedTab === "recibidos" && (
            <label className="flex items-center gap-2 text-sm text-neg-on-surface mb-4">
              <input
                type="checkbox"
                checked={soloNoLeidos}
                onChange={(event) => setSoloNoLeidos(event.target.checked)}
              />
              Solo no leídos
            </label>
          )}

          {feedError && (
            <div className="mb-4 rounded-xl border border-neg-error bg-neg-error-container/30 px-4 py-3 text-sm text-neg-error">
              {feedError}
            </div>
          )}

          {loadingFeed ? (
            <div className="py-10 text-center text-sm text-neg-on-surface-variant">
              Cargando mensajes...
            </div>
          ) : currentFeed.length === 0 ? (
            <NegEmptyState
              icon="mail"
              title="Sin mensajes para mostrar"
              description="Cuando recibas o envíes mensajes directos, aparecerán aquí."
            />
          ) : (
            <div className="space-y-3">
              {currentFeed.map((message) => (
                <MessageListItem
                  key={message.id}
                  message={message}
                  active={selectedMessageId === message.id}
                  onClick={() => setSelectedMessageId(message.id)}
                />
              ))}
            </div>
          )}
        </NegCard>

        <div className="space-y-5">
          <NegCard>
            <div className="mb-4">
              <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                Redactar mensaje
              </h2>
              <p className="text-sm text-neg-on-surface-variant mt-1">
                Envía un mensaje privado de hasta 500 caracteres.
              </p>
            </div>

            <form onSubmit={handleSendDirect} className="space-y-4">
              <NegInput
                label="Buscar persona por nombre o email"
                value={directSearchQuery}
                onChange={(event) => setDirectSearchQuery(event.target.value)}
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
                  onClick={attachLocation}
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
          </NegCard>

          <NegCard>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  Detalle del mensaje
                </h2>
                <p className="text-sm text-neg-on-surface-variant mt-1">
                  Revisa el contenido completo y responde rápido al remitente.
                </p>
              </div>
              {selectedMessage && (
                <NegButton size="sm" variant="outlined" icon="reply" onClick={prepareReply}>
                  Responder
                </NegButton>
              )}
            </div>

            {detailError && (
              <div className="mb-4 rounded-xl border border-neg-error bg-neg-error-container/30 px-4 py-3 text-sm text-neg-error">
                {detailError}
              </div>
            )}

            {!selectedMessageId ? (
              <NegEmptyState
                icon="mark_email_read"
                title="Selecciona un mensaje"
                description="Elige un mensaje recibido o enviado para ver su información completa."
              />
            ) : detailLoading ? (
              <div className="py-10 text-center text-sm text-neg-on-surface-variant">
                Cargando detalle...
              </div>
            ) : !selectedMessage ? (
              <NegEmptyState
                icon="error"
                title="No fue posible cargar el detalle"
                description="Intenta seleccionar el mensaje nuevamente."
              />
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <NegChip tone="primary">Mensaje directo</NegChip>
                  <NegChip tone={selectedMessage.leido ? "success" : "warning"}>
                    {selectedMessage.leido ? "Leído" : "Pendiente"}
                  </NegChip>
                  <NegChip tone="neutral">
                    {formatDateTime(selectedMessage.fecha_envio)}
                  </NegChip>
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
                      Destinatario
                    </p>
                    <p className="font-semibold text-neg-on-surface mt-1">
                      {selectedMessage.destinatario?.nombre_completo}
                    </p>
                    <p className="text-sm text-neg-on-surface-variant">
                      {selectedMessage.destinatario?.email}
                    </p>
                  </NegCard>
                </div>

                {selectedMessage.enviado_por_mi && (
                  <div className="rounded-2xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest px-4 py-3 text-sm text-neg-on-surface-variant">
                    {selectedMessage.leido
                      ? `El destinatario leyó este mensaje el ${formatDateTime(selectedMessage.leido_en)}.`
                      : "El destinatario aún no ha leído este mensaje."}
                  </div>
                )}

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
              </div>
            )}
          </NegCard>
        </div>
      </div>
    </div>
  );
}
