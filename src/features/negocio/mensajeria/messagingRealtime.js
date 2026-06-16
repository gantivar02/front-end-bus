import { NEGOCIO_STATIC_URL } from "../../../services/negocioApi";

const EVENT_NAME = "mensajeria:event";
const WS_EVENTS = [
  "mensaje:nuevo",
  "mensaje:grupo",
  "mensaje:leido",
  "grupo:bienvenida",
  "grupo:miembro-agregado",
  "grupo:miembro-removido",
  "mensaje:grupo-eliminado",
];

let socketRef = null;
let socketToken = "";
let scriptPromise = null;

function emitBrowserEvent(type, payload) {
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: { type, payload },
    }),
  );
}

function loadSocketScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.io) {
    return Promise.resolve(window.io);
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-socketio-client="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.io ?? null), {
          once: true,
        });
        existing.addEventListener("error", () => reject(new Error("No se pudo cargar Socket.IO")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = `${NEGOCIO_STATIC_URL}/socket.io/socket.io.js`;
      script.async = true;
      script.dataset.socketioClient = "true";
      script.onload = () => resolve(window.io ?? null);
      script.onerror = () =>
        reject(new Error("No se pudo cargar el cliente Socket.IO"));
      document.head.appendChild(script);
    }).catch(() => null);
  }

  return scriptPromise;
}

export async function ensureMessagingSocket(token) {
  if (!token) return null;
  if (socketRef && socketToken === token) return socketRef;

  const ioFactory = await loadSocketScript();
  if (!ioFactory) return null;

  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }

  socketRef = ioFactory(NEGOCIO_STATIC_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  socketToken = token;

  WS_EVENTS.forEach((eventName) => {
    socketRef.on(eventName, (payload) => emitBrowserEvent(eventName, payload));
  });

  return socketRef;
}

export function subscribeMessagingEvents(handler) {
  const listener = (event) => handler(event.detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

export function disconnectMessagingSocket() {
  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }
  socketToken = "";
}
