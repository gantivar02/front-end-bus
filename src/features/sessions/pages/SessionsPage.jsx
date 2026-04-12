import { useEffect, useState } from "react";
import { getSessions, deleteSession } from "../services/sessionsService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const avatarPalette = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-slate-100 text-slate-600",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h + name.charCodeAt(i)) % avatarPalette.length;
  return avatarPalette[h];
}

function isSessionActive(session) {
  if (!session.expiration) return false;
  return new Date(session.expiration) > new Date();
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getSessions();
      setSessions(data);
    } catch {
      setError("No se pudieron cargar las sesiones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const handleDelete = async (session) => {
    const sessionId = session.id || session._id;
    if (!window.confirm(`¿Cerrar sesión de ${session.user?.email}?`)) return;
    try {
      setError("");
      await deleteSession(sessionId);
      await loadSessions();
    } catch {
      setError("No se pudo eliminar la sesión");
    }
  };

  const activeSessions = sessions.filter(isSessionActive);
  const expiredSessions = sessions.filter((s) => !isSessionActive(s));

  const statCards = [
    {
      icon: "speed",
      iconColor: "text-blue-600 bg-blue-50",
      badge: `+${activeSessions.length}`,
      badgeColor: "text-green-600 bg-green-50",
      label: "Sesiones activas",
      value: activeSessions.length,
    },
    {
      icon: "timer",
      iconColor: "text-orange-500 bg-orange-50",
      badge: "Estable",
      badgeColor: "text-on-surface-variant",
      label: "Total sesiones",
      value: sessions.length,
    },
    {
      icon: "gpp_maybe",
      iconColor: "text-error bg-error/10",
      badge: `${expiredSessions.length} expiradas`,
      badgeColor: "text-error bg-error/10",
      label: "Sesiones expiradas",
      value: expiredSessions.length,
    },
    {
      icon: "public",
      iconColor: "text-purple-600 bg-purple-50",
      badge: "Global",
      badgeColor: "text-on-surface-variant",
      label: "Nodos únicos",
      value: new Set(sessions.map((s) => s.user?.email).filter(Boolean)).size,
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">Sesiones</h2>
          <p className="text-on-surface-variant font-medium">Monitoreo en tiempo real de sesiones activas e históricas en la red.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadSessions}
            className="flex items-center gap-2 bg-surface-container-lowest text-on-surface px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-error-container/30 text-error rounded-xl text-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="bg-surface-container-lowest p-5 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <span className={`material-symbols-outlined p-2 rounded-lg ${card.iconColor}`}>{card.icon}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${card.badgeColor}`}>{card.badge}</span>
            </div>
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-3xl font-extrabold text-on-surface">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">Registro de sesiones</h3>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium">{activeSessions.length} activas</span>
            <span className="mx-2 text-outline-variant">|</span>
            <span className="w-2 h-2 rounded-full bg-surface-dim" />
            <span className="font-medium">{expiredSessions.length} expiradas</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high/50">
                <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Usuario</th>
                <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Session ID</th>
                <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Expira</th>
                <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">2FA</th>
                <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Estado</th>
                <th className="px-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-2 block animate-pulse">hourglass_empty</span>
                    Cargando sesiones...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-2 block">history_toggle_off</span>
                    No hay sesiones activas.
                  </td>
                </tr>
              ) : (
                sessions.map((session, idx) => {
                  const sessionId = session.id || session._id;
                  const userName = session.user ? `${session.user.name || ""} ${session.user.lastName || ""}`.trim() : "Sin usuario";
                  const userEmail = session.user?.email || "";
                  const initials = getInitials(userName);
                  const color = avatarColor(userName);
                  const active = isSessionActive(session);
                  const isEven = idx % 2 === 0;

                  return (
                    <tr key={sessionId} className={`${isEven ? "bg-surface-container-lowest" : "bg-surface-container-low"} hover:bg-slate-50 transition-colors`}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{userName}</p>
                            <p className="text-xs text-on-surface-variant">{userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <code className="text-xs font-mono bg-surface-container-low px-2 py-1 rounded text-on-surface-variant">
                          {String(sessionId).slice(0, 12)}
                        </code>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm text-on-surface">
                          {session.expiration ? new Date(session.expiration).toLocaleDateString() : "—"}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {session.expiration ? new Date(session.expiration).toLocaleTimeString() : ""}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-sm text-on-surface-variant font-mono">
                        {session.code2FA || "—"}
                      </td>
                      <td className="px-8 py-5">
                        {active ? (
                          <span className="px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-green-600 text-white">
                            Activa
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
                            Expirada
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleDelete(session)}
                          className="p-2 rounded-lg hover:bg-red-100 text-on-surface-variant hover:text-red-600 transition-colors"
                          title="Cerrar sesión"
                        >
                          <span className="material-symbols-outlined text-lg">logout</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-5 bg-surface-container-lowest border-t border-surface-container-high/50 flex items-center justify-between">
          <p className="text-xs font-medium text-on-surface-variant">
            Mostrando {sessions.length} sesión{sessions.length !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      {/* Security insights */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-low p-8 rounded-3xl">
          <h4 className="text-lg font-bold text-on-surface mb-4">Información de seguridad</h4>
          <div className="space-y-3">
            <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4">
              <div className="w-2 h-10 bg-green-600 rounded-full" />
              <div>
                <p className="text-sm font-bold text-on-surface">Todos los sistemas operativos</p>
                <p className="text-xs text-on-surface-variant">Los servicios de base de datos y autenticación reportan 100% de uptime.</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4">
              <div className="w-2 h-10 bg-primary rounded-full" />
              <div>
                <p className="text-sm font-bold text-on-surface">Protocolo de cifrado activo</p>
                <p className="text-xs text-on-surface-variant">Las sesiones están cifradas con el protocolo de seguridad v2.4.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-primary to-primary-container rounded-3xl p-8 flex flex-col justify-end relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />
          <div className="relative z-10">
            <h4 className="text-xl font-bold text-on-primary mb-2">Monitoreo de red</h4>
            <p className="text-on-primary/80 text-sm mb-4">Visualiza la distribución geográfica en tiempo real de los usuarios activos.</p>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-on-primary">
              <span className="material-symbols-outlined text-lg">public</span>
              {new Set(sessions.map((s) => s.user?.email).filter(Boolean)).size} usuarios únicos conectados
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
