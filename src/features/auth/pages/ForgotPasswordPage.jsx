import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import useReCaptcha from "../../../components/ui/ReCaptcha";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { getToken } = useReCaptcha();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const recaptchaToken = await getToken("forgot_password");
      if (!recaptchaToken) {
        setError("No se pudo verificar el reCAPTCHA. Intenta de nuevo.");
        return;
      }
      const res = await api.post(
        "/public/security/forgot-password",
        { email, recaptchaToken },
        { skipAuth: true }
      );
      setMessage(res.data.message);
    } catch {
      setError("No fue posible procesar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <main className="w-full max-w-[480px] relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container text-on-primary-container mb-4 shadow-lg">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_person
            </span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-2">
            JAP Team
          </h1>
          <p className="text-on-surface-variant font-medium">Smart Bus Management System</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sentinel p-8 md:p-10 border border-outline-variant/10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-on-surface mb-3 font-headline">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Ingresa el email de tu cuenta y te enviaremos un enlace seguro válido por 30 minutos.
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-[20px]">
                    mail
                  </span>
                </div>
                <input
                  className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
                <div className="absolute inset-0 rounded-lg border border-outline-variant/30 pointer-events-none group-focus-within:border-primary transition-colors" />
              </div>
            </div>

            {error && (
              <p className="text-sm text-error bg-error-container/40 px-3 py-2 rounded-lg">{error}</p>
            )}
            {message && (
              <p className="text-sm text-success bg-success/10 px-3 py-2 rounded-lg border border-success/20">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-sentinel hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <span>{loading ? "Enviando..." : "Enviar enlace"}</span>
              {!loading && (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-outline-variant/20 flex flex-col items-center">
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
