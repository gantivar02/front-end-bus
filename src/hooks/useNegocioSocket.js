import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { storage } from "../utils/storage";
import { NEGOCIO_STATIC_URL } from "../services/negocioApi";

/**
 * Hook compartido para conectarse al gateway WebSocket del ms-negocio.
 *
 * Uso tipico:
 *   const { connected, on } = useNegocioSocket();
 *   useEffect(() => on("grupo:miembro-removido", payload => { ... }), [on]);
 *
 * Por defecto:
 *  - Lee el JWT del storage del usuario logueado.
 *  - Se conecta a NEGOCIO_STATIC_URL (mismo host que la API HTTP).
 *  - Reabre la conexion automaticamente al cambiar de usuario.
 */
export function useNegocioSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = storage.getToken();
    if (!token) {
      return undefined;
    }

    const socket = io(NEGOCIO_STATIC_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  /**
   * Suscribe un handler a un evento del backend. Devuelve la funcion de
   * unsubscribe para usar dentro de un useEffect:
   *
   *   useEffect(() => on("mensaje:nuevo", handler), [on]);
   */
  const on = (evento, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(evento, handler);
    return () => socket.off(evento, handler);
  };

  /**
   * Emite un evento al backend. Solo lo necesitarian flujos avanzados
   * (chat con ack, por ejemplo). Para HU 3-011 NO se usa.
   */
  const emit = (evento, payload) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit(evento, payload);
  };

  return { connected, on, emit };
}
