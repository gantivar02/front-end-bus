// Cliente WebSocket para el seguimiento de buses en tiempo real
// (HU 3-001 SeguimientoPage y HU 3-002 PanelControlPage).
//
// El backend (SimulacionService) empuja las posiciones por WebSocket:
//   - evento `gps:seguimiento` a la room `ruta:<id>`  (una ruta)
//   - evento `gps:flota`       a la room `flota`       (toda la flota)
//
// Reemplaza el polling: el navegador ya no pregunta cada N segundos;
// el servidor envia las posiciones apenas cambian (cada tick del cron).

import { NEGOCIO_STATIC_URL } from "../../../services/negocioApi";
import { storage } from "../../../utils/storage";

const EVENT_NAME = "seguimiento:event";
const WS_EVENTS = ["gps:seguimiento", "gps:flota"];

let socketRef = null;
let scriptPromise = null;

function emitBrowserEvent(type, payload) {
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, { detail: { type, payload } }),
  );
}

function loadSocketScript() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.io) return Promise.resolve(window.io);

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-socketio-client="true"]',
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(window.io ?? null), {
          once: true,
        });
        existing.addEventListener(
          "error",
          () => reject(new Error("No se pudo cargar Socket.IO")),
          { once: true },
        );
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

async function ensureSocket() {
  const token = storage.getToken();
  if (!token) return null;
  if (socketRef) return socketRef;

  const ioFactory = await loadSocketScript();
  if (!ioFactory) return null;

  socketRef = ioFactory(NEGOCIO_STATIC_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  WS_EVENTS.forEach((ev) =>
    socketRef.on(ev, (payload) => emitBrowserEvent(ev, payload)),
  );

  return socketRef;
}

export async function joinRuta(rutaId) {
  const s = await ensureSocket();
  s?.emit("seguimiento:join", { rutaId });
}

export function leaveRuta(rutaId) {
  socketRef?.emit("seguimiento:leave", { rutaId });
}

export async function joinFlota() {
  const s = await ensureSocket();
  s?.emit("panel:join");
}

export function leaveFlota() {
  socketRef?.emit("panel:leave");
}

// handler recibe { type, payload }
export function subscribeSeguimiento(handler) {
  const listener = (e) => handler(e.detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
