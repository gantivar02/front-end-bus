import { useLocation } from "react-router-dom";

const breadcrumbLabels = {
  "/dashboard":       "Dashboard",
  "/users":           "Usuarios",
  "/roles":           "Roles",
  "/permissions":     "Permisos",
  "/role-permission": "Rol-Permisos",
  "/user-role":       "Usuario-Roles",
  "/profiles":        "Perfiles",
  "/sessions":        "Sesiones",
  "/account":         "Cuenta",
};

export default function Header() {
  const { pathname } = useLocation();
  const label = breadcrumbLabels[pathname] ?? "Admin";

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 flex justify-between items-center px-8 bg-transparent backdrop-blur-xl z-40">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 font-label text-[10px] uppercase tracking-wider text-slate-500">
        <span>Admin</span>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-blue-600 font-bold">{label}</span>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            className="pl-10 pr-4 py-1.5 bg-surface-container-highest border-none rounded-full text-sm focus:ring-2 focus:ring-primary/30 w-56 transition-all outline-none"
            placeholder="Buscar..."
            type="text"
            readOnly
          />
        </div>

        <button className="p-2 text-slate-500 hover:bg-black/5 rounded-full transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
          AD
        </div>
      </div>
    </header>
  );
}
