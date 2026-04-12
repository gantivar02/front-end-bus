import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/dashboard",      icon: "dashboard",           label: "Dashboard" },
  { to: "/users",          icon: "group",               label: "Usuarios" },
  { to: "/roles",          icon: "security",            label: "Roles" },
  { to: "/permissions",    icon: "vpn_key",             label: "Permisos" },
  { to: "/role-permission",icon: "rule",                label: "Rol-Permisos" },
  { to: "/user-role",      icon: "admin_panel_settings",label: "Usuario-Roles" },
  { to: "/profiles",       icon: "account_circle",      label: "Perfiles" },
  { to: "/sessions",       icon: "history",             label: "Sesiones" },
  { to: "/account",        icon: "settings",            label: "Cuenta" },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-slate-50 flex flex-col py-6 px-4 z-50">
      {/* Brand */}
      <div className="mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              security
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 font-headline leading-tight">
              JAP Team
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Bus Security
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-600 font-semibold border-r-4 border-blue-600 bg-slate-200/30 transition-colors"
                : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
            }
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto pt-6 border-t border-slate-200/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-500 hover:text-error hover:bg-red-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
