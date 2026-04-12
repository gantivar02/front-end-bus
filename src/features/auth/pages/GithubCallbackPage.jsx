import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import { clearGoogleOnboardingData } from "../services/googleOnboardingStorage";

// HU-006: GitHub redirige aquí con ?code=XXXX después de que el usuario autoriza
export default function GithubCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const code = new URLSearchParams(window.location.search).get("code");
  const [error, setError] = useState(() =>
    code ? "" : "No se recibió el código de autorización de GitHub."
  );

  useEffect(() => {
    if (!code) {
      return;
    }

    api
      .post(
        "/public/security/login-github",
        { code },
        {
          skipAuth: true,
          skipAuthRedirect: true,
        }
      )
      .then((res) => {
        clearGoogleOnboardingData();
        login(res.data.token);
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        const errorCode = err.response?.data?.error;
        if (errorCode === "GITHUB_EMAIL_REQUIRED") {
          setError(
            "Tu cuenta de GitHub tiene el email privado. Usa otro método de inicio de sesión o configura un email público en GitHub."
          );
        } else {
          setError("No fue posible autenticar con GitHub. Intenta de nuevo.");
        }
      });
  }, [code, login, navigate]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>Error de autenticación</h1>
          <p className="error-text">{error}</p>
          <button type="button" onClick={() => navigate("/login")}>
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h1>Autenticando con GitHub...</h1>
        <p className="auth-hint">Por favor espera un momento.</p>
      </div>
    </div>
  );
}
