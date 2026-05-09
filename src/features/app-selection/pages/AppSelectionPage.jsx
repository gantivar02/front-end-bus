import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function AppSelectionPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const nombre = user?.name ?? "Administrador";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
            <span
              className="material-symbols-outlined text-on-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_bus
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 font-headline leading-tight">
              JAP Team
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Buses Inteligentes
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-error hover:bg-red-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="max-w-3xl text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-headline mb-3">
            Hola, {nombre}
          </h2>
          <p className="text-slate-500 text-base">
            Elige a qué módulo deseas ingresar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <button
            onClick={() => navigate("/seguridad")}
            className="group bg-white border border-slate-200 rounded-2xl p-8 text-left hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
              <span
                className="material-symbols-outlined text-blue-600 text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                security
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-headline mb-2">
              Seguridad
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Gestión de usuarios, roles, permisos y sesiones.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
              Entrar
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate("/negocio")}
            className="group bg-white border border-slate-200 rounded-2xl p-8 text-left hover:border-emerald-500 hover:shadow-lg transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
              <span
                className="material-symbols-outlined text-emerald-600 text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                directions_bus
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-headline mb-2">
              Negocio
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Operación de buses, rutas, incidentes, recargas y más.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
              Entrar
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
