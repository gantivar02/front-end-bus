import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import LoginMicrosoft from "../components/LoginMicrosoft";
import LoginGoogle from "../components/LoginGoogle";
import LoginGithub from "../components/LoginGithub";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Paso actual: "credentials" | "2fa"
  const [step, setStep] = useState("credentials");

  // Paso 1 — credenciales
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Paso 2 — 2FA
  const [twoFAData, setTwoFAData] = useState(null); // { sessionId, maskedEmail, expiration }
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState(3);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // HU-012: contador regresivo hasta la expiración del código
  useEffect(() => {
    if (!twoFAData) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((twoFAData.expiration - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [twoFAData]);

  const handleChange = ({ target }) =>
    setForm((prev) => ({ ...prev, [target.name]: target.value }));

  // HU-012: el login ahora inicia el flujo 2FA
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/public/security/login", form);
      setTwoFAData(res.data); // { sessionId, maskedEmail, expiration }
      setAttempts(3);
      setCode("");
      setResendMessage("");
      setStep("2fa");
    } catch {
      setError("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  // HU-012: solo acepta dígitos, máximo 6
  const handleCodeChange = (e) => {
    setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
  };

  // HU-012: verifica el código 2FA
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setCodeLoading(true);
    try {
      const res = await api.post("/public/security/verify-2fa", {
        sessionId: twoFAData.sessionId,
        code,
      });
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "";
      const remaining = err.response?.data?.remainingAttempts;

      if (status === 403) {
        // Sesión bloqueada — volver al inicio
        setError("Sesión bloqueada por demasiados intentos. Vuelve a iniciar sesión.");
        setStep("credentials");
        setTwoFAData(null);
      } else if (status === 410) {
        // Código expirado
        setError("El código ha expirado. Vuelve a iniciar sesión.");
        setStep("credentials");
        setTwoFAData(null);
      } else {
        if (remaining !== undefined) setAttempts(remaining);
        setError(msg || "Código incorrecto");
        setCode("");
      }
    } finally {
      setCodeLoading(false);
    }
  };

  // HU-012: reenviar código
  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    setError("");
    try {
      const res = await api.post("/public/security/resend-2fa", {
        sessionId: twoFAData.sessionId,
      });
      setTwoFAData((prev) => ({ ...prev, expiration: res.data.expiration }));
      setCode("");
      setAttempts(3);
      setResendMessage("Nuevo código enviado. Revisa tu email.");
    } catch {
      setError("No fue posible reenviar el código. Intenta iniciar sesión nuevamente.");
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Paso 1: Credenciales ──────────────────────────────────────────────────
  if (step === "credentials") {
    return (
      <div className="auth-page">
        <form className="auth-form" onSubmit={handleCredentialsSubmit}>
          <h1>Iniciar sesión</h1>

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            required
          />

          {error && <p className="error-text">{error}</p>}

          <Link to="/forgot-password" className="auth-link">
            ¿Olvidó su contraseña?
          </Link>

          <button type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>

          <hr />

          <LoginGoogle
            onSuccess={(token) => {
              login(token);
              navigate("/dashboard");
            }}
          />
          <LoginMicrosoft
            onSuccess={(token) => {
              login(token);
              navigate("/dashboard");
            }}
          />
          <LoginGithub />
        </form>
      </div>
    );
  }

  // ── Paso 2: Verificación 2FA ─────────────────────────────────────────────
  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleVerify2FA}>
        <h1>Verificación en dos pasos</h1>

        <p className="auth-hint">
          Ingrese el código de 6 dígitos enviado a{" "}
          <strong>{twoFAData?.maskedEmail}</strong>
        </p>

        {timeLeft > 0 ? (
          <p className="auth-timer">Expira en: {formatTime(timeLeft)}</p>
        ) : (
          <p className="error-text">El código ha expirado</p>
        )}

        <label>Código de verificación</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={handleCodeChange}
          placeholder="000000"
          autoComplete="one-time-code"
          required
        />

        {error && <p className="error-text">{error}</p>}

        <p className="auth-attempts">Intentos restantes: {attempts}</p>

        <button
          type="submit"
          disabled={codeLoading || code.length !== 6 || timeLeft === 0}
        >
          {codeLoading ? "Verificando..." : "Confirmar"}
        </button>

        <button
          type="button"
          className="auth-resend-btn"
          onClick={handleResend}
          disabled={resendLoading}
        >
          {resendLoading ? "Enviando..." : "¿No recibió el código? Revisar spam o reenviar"}
        </button>

        {resendMessage && <p className="auth-success">{resendMessage}</p>}

        <button
          type="button"
          className="auth-back-btn"
          onClick={() => {
            setStep("credentials");
            setTwoFAData(null);
            setError("");
            setCode("");
          }}
        >
          ← Volver al inicio de sesión
        </button>
      </form>
    </div>
  );
}
