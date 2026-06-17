import { useEffect } from "react";
import { useNegocioSocket } from "../../../hooks/useNegocioSocket";

export default function ClimaAlertaListener() {
  const { on } = useNegocioSocket();

  useEffect(() => {
    return on("clima:alerta", ({ mensaje, ciudad }) => {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`🌤 Clima hoy — ${ciudad}`, {
          body: mensaje,
          icon: "/favicon.ico",
        });
      }
    });
  }, [on]);

  return null;
}
