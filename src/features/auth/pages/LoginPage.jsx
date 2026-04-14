import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { API_BASE_URL } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import useReCaptcha from "../../../components/ui/ReCaptcha";
import LoginMicrosoft from "../components/LoginMicrosoft";
import LoginGoogle from "../components/LoginGoogle";
import LoginGithub from "../components/LoginGithub";
import {
  clearGoogleOnboardingData,
  saveGoogleOnboardingData,
} from "../services/googleOnboardingStorage";

const publicAuthConfig = { skipAuth: true, skipAuthRedirect: true };

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { getToken } = useReCaptcha();

  const [step, setStep] = useState("credentials");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [twoFAData, setTwoFAData] = useState(null);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState(3);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // HU-012: cancela sesión parcial si el usuario cierra la pestaña
  useEffect(() => {
    if (step !== "2fa" || !twoFAData?.sessionId) return;
    const handleBeforeUnload = () => {
      const payload = JSON.stringify({ sessionId: twoFAData.sessionId });
      navigator.sendBeacon(
        `${API_BASE_URL}/public/security/cancel-session`,
        new Blob([payload], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [step, twoFAData?.sessionId]);

  // Temporizador 2FA
  useEffect(() => {
    if (!twoFAData) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((twoFAData.expiration - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setTimeout(() => {
          setStep("credentials");
          setTwoFAData(null);
          setCode("");
          setError("El código expiró. Vuelve a iniciar sesión.");
        }, 2000);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [twoFAData]);

  const handleChange = ({ target }) =>
    setForm((prev) => ({ ...prev, [target.name]: target.value }));

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const recaptchaToken = await getToken("login");

      const response = await api.post(
        "/public/security/login",
        { ...form, recaptchaToken },
        publicAuthConfig
      );
      setTwoFAData(response.data);
      setAttempts(3);
      setCode("");
      setResendMessage("");
      setStep("2fa");
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message;
      const recaptchaMessage = err.message;

      if (status === 400) {
        setError(backendMessage || "No fue posible validar reCAPTCHA. Intenta nuevamente.");
      } else if (status === 401) {
        setError("Credenciales incorrectas");
      } else if (!status) {
        setError(recaptchaMessage || "No fue posible validar reCAPTCHA. Intenta nuevamente.");
      } else {
        setError("No fue posible iniciar sesión. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setCodeLoading(true);
    try {
      const response = await api.post(
        "/public/security/verify-2fa",
        { sessionId: twoFAData.sessionId, code },
        publicAuthConfig
      );
      clearGoogleOnboardingData();
      login(response.data.token);
      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "";
      const remainingAttempts = err.response?.data?.remainingAttempts;
      if (status === 403) {
        setError("Sesión bloqueada. Vuelve a iniciar sesión.");
        setStep("credentials");
        setTwoFAData(null);
      } else if (status === 410) {
        setError("El código ha expirado. Vuelve a iniciar sesión.");
        setStep("credentials");
        setTwoFAData(null);
      } else {
        if (remainingAttempts !== undefined) setAttempts(remainingAttempts);
        setError(message || "Código incorrecto");
        setCode("");
      }
    } finally {
      setCodeLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    setError("");
    try {
      const response = await api.post(
        "/public/security/resend-2fa",
        { sessionId: twoFAData.sessionId },
        publicAuthConfig
      );
      setTwoFAData((prev) => ({ ...prev, expiration: response.data.expiration }));
      setCode("");
      setAttempts(3);
      setResendMessage("Nuevo código enviado. Revisa tu email.");
    } catch {
      setError("No fue posible reenviar el código. Inicia sesión nuevamente.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSuccess = (token) => {
    clearGoogleOnboardingData();
    login(token);
    navigate("/dashboard");
  };

  const handleGoogleRequiresProfileCompletion = (data) => {
    saveGoogleOnboardingData({
      onboardingToken: data.onboardingToken,
      userId: data.userId,
      email: data.email,
      name: data.name,
      provider: data.provider,
    });
    navigate("/auth/google/complete-profile");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ── Step: credenciales ───────────────────────────────── */
  if (step === "credentials") {
    return (
      <div className="bg-mesh font-body text-on-surface min-h-screen flex items-center justify-center p-6">
        <div className="fixed top-20 right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full -z-10" />
        <div className="fixed bottom-10 left-[-5%] w-[30%] h-[30%] bg-secondary-container/10 blur-[100px] rounded-full -z-10" />

        <main className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-10">
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
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sentinel border border-outline-variant/20">
            <h2 className="font-headline text-xl font-bold mb-6 text-on-surface">Iniciar Sesión</h2>

            <form className="space-y-5" onSubmit={handleCredentialsSubmit}>
              <div className="space-y-2">
                <label className="block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1">
                  Email
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-3 pl-11 pr-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nombre@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Contraseña
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline transition-all">
                    Olvidé mi contraseña
                  </Link>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg py-3 pl-11 pr-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-error bg-error-container/40 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                <span>{loading ? "Verificando..." : "Acceder al Sistema"}</span>
                {!loading && (
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/40" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-container-lowest text-on-surface-variant font-medium">
                  o continúa con
                </span>
              </div>
            </div>

            {/* OAuth buttons — uniform style */}
            <div className="grid grid-cols-3 gap-3">
              <LoginGoogle
                onSuccess={handleGoogleSuccess}
                onRequiresProfileCompletion={handleGoogleRequiresProfileCompletion}
              />
              <LoginGithub />
              <LoginMicrosoft
                onSuccess={(token) => {
                  clearGoogleOnboardingData();
                  login(token);
                  navigate("/dashboard");
                }}
              />
            </div>

            <div className="mt-6 text-center">
              <Link to="/register" className="text-sm text-on-surface-variant">
                ¿No tienes cuenta?{" "}
                <span className="text-primary font-bold hover:underline">Registrarse</span>
              </Link>
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-10 pt-6 border-t border-outline-variant/30 flex justify-between items-center px-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">
                Servidores Activos
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Step: 2FA ────────────────────────────────────────── */
  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-container/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container/10 blur-[120px]" />
      </div>

      <main className="w-full max-w-lg">
        <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-sentinel relative overflow-hidden">
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                security
              </span>
            </div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface text-center">
              Verificación JAP Team
            </h1>
            <p className="text-on-surface-variant text-center mt-3 text-sm">
              Código enviado a{" "}
              <span className="font-semibold text-on-surface bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant/15">
                {twoFAData?.maskedEmail}
              </span>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleVerify2FA}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              autoComplete="one-time-code"
              className="w-full text-center text-3xl font-headline font-bold tracking-[0.5em] bg-surface-container-highest border-2 border-transparent rounded-xl py-5 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />

            {error && (
              <p className="text-sm text-error text-center bg-error-container/40 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex items-center justify-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">timer</span>
              {timeLeft > 0 ? (
                <span className="font-bold text-on-surface">{formatTime(timeLeft)}</span>
              ) : (
                <span className="text-error font-bold">Código expirado</span>
              )}
            </div>

            <p className="text-center text-sm text-on-surface-variant">
              Intentos restantes:{" "}
              <span className="font-bold text-on-surface">{attempts}</span>
            </p>

            <button
              type="submit"
              disabled={codeLoading || code.length !== 6 || timeLeft === 0}
              className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {codeLoading ? "Verificando..." : "Verificar Identidad"}
            </button>
          </form>

          <div className="flex flex-col items-center space-y-4 mt-8">
            <div className="w-full h-px bg-outline-variant/20" />
            <p className="text-on-surface-variant text-sm">
              ¿No recibiste el código?{" "}
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-primary font-semibold hover:underline ml-1 disabled:opacity-50"
              >
                {resendLoading ? "Enviando..." : "Reenviar código"}
              </button>
            </p>
            {resendMessage && <p className="text-sm text-success">{resendMessage}</p>}
            <button
              onClick={() => {
                setStep("credentials");
                setTwoFAData(null);
                setError("");
                setCode("");
              }}
              className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Volver al inicio de sesión
            </button>
          </div>

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-6xl">fingerprint</span>
          </div>
        </div>
      </main>
    </div>
  );
}
