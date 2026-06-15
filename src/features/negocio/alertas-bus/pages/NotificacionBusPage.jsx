import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NegPageHeader, NegCard, NegButton } from "../../../../components/negocio";
import {
  suscribir,
  getMisAlertas,
  cancelarAlerta,
  marcarVista,
} from "../alertasBusService";
import { listRutas, listParaderosPorRuta } from "../../seguimiento/seguimientoService";

const MINUTOS_OPTS = [5, 10, 15];
const POLL_MS = 15_000;

function pedirPermisoNotificacion() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function notificarSistema(alerta) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🚌 Bus próximo", {
      body: `${alerta.ruta_nombre} · Bus ${alerta.placa_bus} llega en ≈${alerta.eta_min} min`,
      icon: "/bus-icon.png",
    });
  }
}

const GRAVEDAD_CLS = {
  5: "border-neg-error bg-neg-error-container/20",
  10: "border-yellow-400 bg-yellow-50",
  15: "border-neg-primary/40 bg-neg-primary/5",
};

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-neg-outline bg-neg-surface text-neg-on-surface text-sm focus:outline-none focus:border-neg-primary focus:ring-2 focus:ring-neg-primary/20 disabled:opacity-50";

export default function NotificacionBusPage() {
  const navigate = useNavigate();

  const [rutas, setRutas] = useState([]);
  const [rutaId, setRutaId] = useState("");
  const [paraderos, setParaderos] = useState([]);
  const [paraderoId, setParaderoId] = useState("");
  const [minutos, setMinutos] = useState(10);
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState(null);

  const [alertas, setAlertas] = useState([]);
  const [disparadasVistas, setDisparadasVistas] = useState(new Set());
  const pollRef = useRef(null);

  useEffect(() => {
    pedirPermisoNotificacion();
    listRutas()
      .then((d) => setRutas(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!rutaId) { setParaderos([]); setParaderoId(""); return; }
    listParaderosPorRuta(rutaId)
      .then((d) => setParaderos(Array.isArray(d) ? d : []))
      .catch(() => {});
    setParaderoId("");
  }, [rutaId]);

  const cargarAlertas = () => {
    getMisAlertas()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setAlertas(arr);
        arr
          .filter((a) => a.disparada && !disparadasVistas.has(a.id))
          .forEach((a) => {
            notificarSistema(a);
            setDisparadasVistas((prev) => new Set([...prev, a.id]));
          });
      })
      .catch(() => {});
  };

  useEffect(() => {
    cargarAlertas();
    pollRef.current = setInterval(cargarAlertas, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleSuscribir = async () => {
    if (!rutaId || !paraderoId) return;
    setSubscribing(true);
    setSubError(null);
    try {
      await suscribir(Number(rutaId), Number(paraderoId), minutos);
      setRutaId("");
      setParaderoId("");
      setMinutos(10);
      cargarAlertas();
    } catch (err) {
      setSubError(err?.response?.data?.message ?? "No se pudo activar la alerta.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelar = async (id) => {
    try {
      await cancelarAlerta(id);
      cargarAlertas();
    } catch {}
  };

  const handleVista = async (id) => {
    try {
      await marcarVista(id);
      cargarAlertas();
    } catch {}
  };

  const alertasActivas = alertas.filter((a) => a.activa && !a.disparada);
  const alertasDisparadas = alertas.filter((a) => a.disparada);

  return (
    <div className="max-w-2xl">
      <NegPageHeader
        eyebrow="HU 3-003"
        title="Notificación de bus próximo"
        subtitle="Activá una alerta y te avisamos cuando tu bus esté cerca del paradero."
      />

      {/* Permiso notificaciones */}
      {"Notification" in window && Notification.permission === "denied" && (
        <NegCard className="mb-4 border border-yellow-400" padding="sm">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <span className="material-symbols-outlined text-[18px]">notifications_off</span>
            Las notificaciones del navegador están bloqueadas. Habilitálas en la configuración del sitio para recibir alertas aunque cambies de pestaña.
          </div>
        </NegCard>
      )}

      {/* Formulario nueva suscripción */}
      <NegCard className="mb-5">
        <p className="text-sm font-semibold text-neg-on-surface mb-4">Nueva alerta</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neg-on-surface mb-1">Ruta</label>
            <select value={rutaId} onChange={(e) => setRutaId(e.target.value)} className={inputCls}>
              <option value="">Seleccionar ruta</option>
              {rutas.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre} ({r.codigo_ruta})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neg-on-surface mb-1">Paradero donde estás</label>
            <select
              value={paraderoId}
              onChange={(e) => setParaderoId(e.target.value)}
              disabled={!rutaId || paraderos.length === 0}
              className={inputCls}
            >
              <option value="">Seleccionar paradero</option>
              {paraderos.map((rp) => (
                <option key={rp.paradero.id} value={rp.paradero.id}>
                  {rp.orden}. {rp.paradero.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neg-on-surface mb-1">
              Avisarme cuando el bus esté a
            </label>
            <div className="flex gap-2">
              {MINUTOS_OPTS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMinutos(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    minutos === m
                      ? "bg-neg-primary text-neg-on-primary border-neg-primary"
                      : "bg-neg-surface text-neg-on-surface-variant border-neg-outline hover:bg-neg-surface-container"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          {subError && (
            <div className="px-3 py-2 rounded-xl border border-neg-error bg-neg-error-container/30 text-neg-error text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {subError}
            </div>
          )}

          <NegButton
            icon={subscribing ? "hourglass_top" : "notifications_active"}
            onClick={handleSuscribir}
            disabled={!rutaId || !paraderoId || subscribing}
          >
            {subscribing ? "Activando..." : "Activar alerta"}
          </NegButton>
        </div>
      </NegCard>

      {/* Notificaciones disparadas */}
      {alertasDisparadas.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-neg-on-surface-variant mb-2">
            ¡Bus próximo!
          </p>
          {alertasDisparadas.map((a) => (
            <NegCard
              key={a.id}
              className={`mb-3 border-2 ${GRAVEDAD_CLS[a.minutos_anticipacion] ?? "border-neg-primary"}`}
              padding="sm"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[20px] text-neg-primary animate-pulse">
                      notifications_active
                    </span>
                    <span className="font-bold text-neg-on-surface">{a.ruta_nombre}</span>
                  </div>
                  <p className="text-sm text-neg-on-surface">
                    Bus <strong className="font-mono">{a.placa_bus}</strong> llega en{" "}
                    <strong className="text-neg-primary">≈ {a.eta_min} min</strong>
                  </p>
                  <p className="text-xs text-neg-on-surface-variant mt-0.5">
                    Paradero: {a.paradero?.nombre}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigate(`/negocio/seguimiento?ruta=${a.ruta_id}&paradero=${a.paradero_id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neg-primary/10 text-neg-primary text-xs font-semibold hover:bg-neg-primary/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  Ver en mapa
                </button>
                <button
                  onClick={() => navigate("/negocio/recargas/nueva")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">credit_card</span>
                  Preparar pago
                </button>
                <button
                  onClick={() => handleVista(a.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neg-surface-container text-neg-on-surface-variant text-xs font-semibold hover:bg-neg-surface-container-high transition-colors ml-auto"
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Entendido
                </button>
              </div>
            </NegCard>
          ))}
        </div>
      )}

      {/* Alertas activas esperando */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neg-on-surface-variant mb-2">
          Alertas activas
        </p>
        {alertasActivas.length === 0 ? (
          <NegCard padding="sm">
            <div className="py-8 text-center text-neg-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-[36px] block mb-2 opacity-40">
                notifications_none
              </span>
              No tenés alertas activas. Configurá una arriba.
            </div>
          </NegCard>
        ) : (
          <div className="space-y-2">
            {alertasActivas.map((a) => (
              <NegCard key={a.id} padding="sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-neg-on-surface">{a.ruta?.nombre}</p>
                    <p className="text-xs text-neg-on-surface-variant">
                      {a.paradero?.nombre} · Aviso {a.minutos_anticipacion} min antes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <button
                      onClick={() => handleCancelar(a.id)}
                      className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-error hover:bg-neg-error/10 transition-colors"
                      title="Cancelar alerta"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>
              </NegCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
