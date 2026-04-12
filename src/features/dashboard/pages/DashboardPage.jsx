import { useAuth } from "../../../context/AuthContext";

function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const stats = [
  { label: "Total Usuarios", value: "—", icon: "person", color: "text-primary", bg: "bg-primary/10", bar: "bg-primary", width: "w-3/4" },
  { label: "Sesiones Activas", value: "—", icon: "bolt", color: "text-tertiary", bg: "bg-tertiary/10", bar: "bg-tertiary", width: "w-2/5" },
  { label: "Roles Registrados", value: "—", icon: "verified", color: "text-secondary", bg: "bg-secondary/10", bar: "bg-secondary", width: "w-full" },
  { label: "Permisos Activos", value: "—", icon: "key", color: "text-primary", bg: "bg-primary/10", bar: "bg-primary", width: "w-2/3" },
];

export default function DashboardPage() {
  const { token } = useAuth();
  const claims = token ? decodeJwt(token) : null;
  const name = claims?.name ?? "Admin";

  return (
    <div className="text-on-surface">
      {/* Welcome banner */}
      <section className="mb-10">
        <div className="bg-surface-container-lowest rounded-xl p-8 flex items-center justify-between overflow-hidden relative">
          <div className="z-10 relative">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">
              Bienvenido, {name}
            </h2>
            <p className="text-secondary mt-2 max-w-md leading-relaxed">
              Tu panel de control JAP Team está activo. Administra usuarios, roles y permisos del sistema de buses.
            </p>
            <div className="mt-6 flex gap-3">
              <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                Ver Sesiones
              </button>
              <button className="text-primary font-semibold text-sm px-4 py-2.5 hover:bg-surface-container-high rounded-lg transition-colors">
                Gestionar Roles
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-primary/5 -skew-x-12 translate-x-12" />
          <div className="hidden lg:block relative z-10">
            <div className="w-32 h-32 bg-secondary-fixed rounded-2xl flex items-center justify-center rotate-6 shadow-xl">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${stat.bg} ${stat.color} rounded-lg`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </div>
            <h3 className="text-slate-500 font-label text-[10px] uppercase tracking-widest font-bold">
              {stat.label}
            </h3>
            <p className="text-2xl font-headline font-extrabold mt-1">{stat.value}</p>
            <div className="mt-4 w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
              <div className={`${stat.bar} h-full ${stat.width}`} />
            </div>
          </div>
        ))}
      </section>

      {/* Bottom grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Health pods */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {[
            { label: "Auth Microservice", status: "Optimal", statusClass: "bg-green-100 text-green-700" },
            { label: "User Manager", status: "Optimal", statusClass: "bg-green-100 text-green-700" },
            { label: "Permissions Engine", status: "Activo", statusClass: "bg-green-100 text-green-700" },
          ].map((pod) => (
            <div key={pod.label} className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/15">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-headline font-bold text-sm">Health: {pod.label}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pod.statusClass}`}>
                  {pod.status}
                </span>
              </div>
              <div className="h-10 w-full flex items-end gap-1">
                {[60, 70, 65, 90].map((h, i) => (
                  <div
                    key={i}
                    className="bg-primary-container/60 w-full rounded-sm transition-all"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent sessions */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-headline font-extrabold tracking-tight">Sesiones Recientes</h3>
              <p className="text-xs text-slate-400 font-label mt-1 uppercase tracking-widest">
                Monitoreo en tiempo real
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: "Admin Dashboard · Chrome", sub: "Sesión activa", status: "activa", icon: "desktop_windows", statusClass: "text-green-600", dot: "bg-green-600" },
              { label: "JAP Team Mobile", sub: "Hace 2 min", status: "inactiva", icon: "smartphone", statusClass: "text-slate-400", dot: "bg-slate-300" },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-transparent hover:border-outline-variant/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <span className={`material-symbols-outlined ${s.statusClass}`}>{s.icon}</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold">{s.label}</h5>
                    <p className="text-xs text-slate-500">{s.sub}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-bold ${s.statusClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
