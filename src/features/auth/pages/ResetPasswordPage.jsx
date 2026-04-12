import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../../../services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleChange = ({ target }) =>
    setForm((prev) => ({ ...prev, [target.name]: target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.newPassword !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await api.post(
        "/public/security/reset-password",
        { token, newPassword: form.newPassword },
        { skipAuth: true }
      );
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "No fue posible restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const cardBase = "bg-surface-container-lowest rounded-xl shadow-sentinel p-8 md:p-10 border border-outline-variant/10";

  if (!token) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center p-6">
        <main className="w-full max-w-md">
          <div className={cardBase}>
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-error mb-4 block">
                link_off
              </span>
              <h1 className="font-headline text-2xl font-bold text-on-surface mb-3">Enlace inválido</h1>
              <p className="text-on-surface-variant mb-8">
                Este enlace de recuperación no es válido o ya fue utilizado.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center p-6">
        <main className="w-full max-w-md">
          <div className={cardBase}>
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-success mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <h1 className="font-headline text-2xl font-bold text-on-surface mb-3">
                ¡Contraseña actualizada!
              </h1>
              <p className="text-on-surface-variant mb-2">
                Tu contraseña fue restablecida exitosamente.
              </p>
              <p className="text-sm text-outline">Serás redirigido al inicio de sesión en unos segundos...</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-8 w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-lg transition-all active:scale-[0.98]"
              >
                Ir al inicio de sesión
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <main className="w-full max-w-[480px] relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center mb-6 shadow-sentinel">
            <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock_reset
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
            Nueva contraseña
          </h1>
          <p className="text-on-surface-variant font-medium">JAP Team</p>
        </div>

        <div className={cardBase}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-on-surface mb-3 font-headline">
              Restablece tu acceso
            </h2>
            <p className="text-on-surface-variant">
              Ingresa y confirma tu nueva contraseña.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                Nueva contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-[20px]">
                    lock
                  </span>
                </div>
                <input
                  className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <div className="absolute inset-0 rounded-lg border border-outline-variant/30 pointer-events-none group-focus-within:border-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                Confirmar contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-[20px]">
                    lock_clock
                  </span>
                </div>
                <input
                  className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Repite tu nueva contraseña"
                  required
                />
                <div className="absolute inset-0 rounded-lg border border-outline-variant/30 pointer-events-none group-focus-within:border-primary transition-colors" />
              </div>
            </div>

            {error && (
              <p className="text-sm text-error bg-error-container/40 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-sentinel hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <span>{loading ? "Guardando..." : "Guardar nueva contraseña"}</span>
              {!loading && (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant/20 flex justify-center">
            <Link
              to="/login"
              className="group flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                chevron_left
              </span>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
