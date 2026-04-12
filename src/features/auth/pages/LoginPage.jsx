import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import LoginMicrosoft from "../components/LoginMicrosoft";
import LoginGoogle from "../components/LoginGoogle";
import LoginGithub from "../components/LoginGithub";
import {
  clearGoogleOnboardingData,
  saveGoogleOnboardingData,
} from "../services/googleOnboardingStorage";

const publicAuthConfig = {
  skipAuth: true,
  skipAuthRedirect: true,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

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

  useEffect(() => {
    if (!twoFAData) {
      return;
    }

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

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        "/public/security/login",
        form,
        publicAuthConfig
      );

      setTwoFAData(response.data);
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

  const handleCodeChange = (event) => {
    setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 6));
  };

  const handleVerify2FA = async (event) => {
    event.preventDefault();

    if (code.length !== 6) {
      return;
    }

    setError("");
    setCodeLoading(true);

    try {
      const response = await api.post(
        "/public/security/verify-2fa",
        {
          sessionId: twoFAData.sessionId,
          code,
        },
        publicAuthConfig
      );

      clearGoogleOnboardingData();
      login(response.data.token);
      navigate("/dashboard");
    } catch (currentError) {
      const status = currentError.response?.status;
      const message = currentError.response?.data?.message || "";
      const remainingAttempts = currentError.response?.data?.remainingAttempts;

      if (status === 403) {
        setError(
          "Sesion bloqueada por demasiados intentos. Vuelve a iniciar sesion."
        );
        setStep("credentials");
        setTwoFAData(null);
      } else if (status === 410) {
        setError("El codigo ha expirado. Vuelve a iniciar sesion.");
        setStep("credentials");
        setTwoFAData(null);
      } else {
        if (remainingAttempts !== undefined) {
          setAttempts(remainingAttempts);
        }

        setError(message || "Codigo incorrecto");
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
        {
          sessionId: twoFAData.sessionId,
        },
        publicAuthConfig
      );

      setTwoFAData((prev) => ({
        ...prev,
        expiration: response.data.expiration,
      }));
      setCode("");
      setAttempts(3);
      setResendMessage("Nuevo codigo enviado. Revisa tu email.");
    } catch {
      setError(
        "No fue posible reenviar el codigo. Intenta iniciar sesion nuevamente."
      );
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
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  if (step === "credentials") {
    return (
      <div className="auth-page">
        <form className="auth-form" onSubmit={handleCredentialsSubmit}>
          <h1>Iniciar sesion</h1>

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
            ¿Olvido su contraseña?
          </Link>

          <Link to="/register" className="auth-link">
            ¿No tienes cuenta? Registrate aqui
          </Link>

          <button type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>

          <hr />

          <LoginGoogle
            onSuccess={handleGoogleSuccess}
            onRequiresProfileCompletion={handleGoogleRequiresProfileCompletion}
          />

          <LoginMicrosoft
            onSuccess={(token) => {
              clearGoogleOnboardingData();
              login(token);
              navigate("/dashboard");
            }}
          />

          <LoginGithub />
        </form>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleVerify2FA}>
        <h1>Verificacion en dos pasos</h1>

        <p className="auth-hint">
          Ingrese el codigo de 6 digitos enviado a{" "}
          <strong>{twoFAData?.maskedEmail}</strong>
        </p>

        {timeLeft > 0 ? (
          <p className="auth-timer">Expira en: {formatTime(timeLeft)}</p>
        ) : (
          <p className="error-text">El codigo ha expirado</p>
        )}

        <label>Codigo de verificacion</label>
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
          {resendLoading
            ? "Enviando..."
            : "¿No recibio el codigo? Revisar spam o reenviar"}
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
          ← Volver al inicio de sesion
        </button>
      </form>
    </div>
  );
}
