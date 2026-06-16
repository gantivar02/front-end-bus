import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  useAuth,
  ROL_CIUDADANO,
  ROL_CONDUCTOR,
} from "../../../context/AuthContext";
import { getUnreadCount } from "./mensajeriaService";
import {
  disconnectMessagingSocket,
  ensureMessagingSocket,
  subscribeMessagingEvents,
} from "./messagingRealtime";
import { MessageNotificationsContext } from "./messageNotificationsContext";

export function MessageNotificationsProvider({ children }) {
  const navigate = useNavigate();
  const { token, user, hasAnyRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef(new Map());

  const isMessagingEnabled =
    !!token && hasAnyRole([ROL_CIUDADANO, ROL_CONDUCTOR]);

  const dismissToast = useCallback((toastId) => {
    const timer = toastTimersRef.current.get(toastId);
    if (timer) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(toastId);
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const syncUnreadCount = useCallback((nextCount) => {
    setUnreadCount(Number(nextCount ?? 0));
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!isMessagingEnabled) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const total = Number(await getUnreadCount());
      setUnreadCount(total);
      return total;
    } catch {
      return 0;
    }
  }, [isMessagingEnabled]);

  const pushToast = useCallback(
    (title, body, options = {}) => {
      const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((current) => [
        ...current.slice(-2),
        {
          id: toastId,
          title,
          body,
          route: options.route ?? "/negocio/mensajes",
          icon: options.icon ?? "mail",
        },
      ]);

      const timer = window.setTimeout(() => {
        dismissToast(toastId);
      }, 4000);
      toastTimersRef.current.set(toastId, timer);
    },
    [dismissToast],
  );

  const pushMessageToast = useCallback(
    (payload, type) => {
      const currentEmail = user?.email || user?.sub || "";
      const senderEmail = payload?.emisor_email?.trim?.() || "";
      if (currentEmail && senderEmail && currentEmail === senderEmail) {
        return;
      }

      const senderName = payload?.emisor_nombre?.trim() || "alguien";
      if (type === "mensaje:grupo") {
        const groupName = payload?.grupo_nombre?.trim() || "tu grupo";
        pushToast(`Nuevo mensaje de ${senderName}`, `Grupo: ${groupName}`);
        return;
      }

      pushToast(`Nuevo mensaje de ${senderName}`, "Toca para abrir tu bandeja.");
    },
    [pushToast, user],
  );

  const pushGroupWelcomeToast = useCallback(
    (payload) => {
      const groupName = payload?.grupo_nombre?.trim() || "un grupo";
      pushToast(
        "Nuevo grupo disponible",
        `Fuiste agregado a ${groupName}.`,
        {
          route: "/negocio/grupos/mios",
          icon: "groups",
        },
      );
    },
    [pushToast],
  );

  useEffect(() => {
    if (!isMessagingEnabled || !token) {
      disconnectMessagingSocket();
      return undefined;
    }

    const refreshTimer = window.setTimeout(() => {
      void refreshUnreadCount();
    }, 0);
    void ensureMessagingSocket(token);

    const unsubscribe = subscribeMessagingEvents(({ type, payload }) => {
      if (type === "mensaje:nuevo" || type === "mensaje:grupo") {
        pushMessageToast(payload, type);
      }
      if (type === "grupo:bienvenida") {
        pushGroupWelcomeToast(payload);
      }
      if (
        type !== "mensaje:nuevo" &&
        type !== "mensaje:grupo" &&
        type !== "mensaje:leido" &&
        type !== "mensaje:grupo-eliminado"
      ) {
        return;
      }
      void refreshUnreadCount();
    });

    return () => {
      window.clearTimeout(refreshTimer);
      unsubscribe();
      disconnectMessagingSocket();
    };
  }, [
    isMessagingEnabled,
    token,
    pushMessageToast,
    pushGroupWelcomeToast,
    refreshUnreadCount,
  ]);

  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      unreadCount: isMessagingEnabled ? unreadCount : 0,
      isMessagingEnabled,
      refreshUnreadCount,
      syncUnreadCount,
    }),
    [unreadCount, isMessagingEnabled, refreshUnreadCount, syncUnreadCount],
  );

  return (
    <MessageNotificationsContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed right-8 top-20 z-[70] flex w-full max-w-sm flex-col gap-3">
        {isMessagingEnabled && toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => {
              dismissToast(toast.id);
              navigate(toast.route);
            }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-neg-primary/30 bg-neg-surface-container px-4 py-3 text-left shadow-xl shadow-black/10 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neg-primary-container text-neg-on-primary-container">
                <span className="material-symbols-outlined">{toast.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-neg-on-surface">
                  {toast.title}
                </p>
                <p className="mt-1 text-sm text-neg-on-surface-variant">
                  {toast.body}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </MessageNotificationsContext.Provider>
  );
}
