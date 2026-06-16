import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { completeOAuthProfile } from "../services/oauthOnboardingService";
import {
  clearOAuthOnboardingData,
  getOAuthOnboardingData,
} from "../services/oauthOnboardingStorage";
import styles from "./GoogleCompleteProfilePage.module.css";

const initialForm = {
  address: "",
  phone: "",
};

const PROVIDER_LABELS = {
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft",
};

const PROVIDER_FALLBACK_NAMES = {
  google: "Usuario Google",
  github: "Usuario GitHub",
  microsoft: "Usuario Microsoft",
};

export default function OAuthCompleteProfilePage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [onboardingData, setOnboardingData] = useState(() =>
    getOAuthOnboardingData()
  );
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(
    !getOAuthOnboardingData()
  );

  const providerKey = (onboardingData?.provider || "").toLowerCase();
  const providerLabel = PROVIDER_LABELS[providerKey] || "tu proveedor";
  const fallbackName = PROVIDER_FALLBACK_NAMES[providerKey] || "Usuario";

  useEffect(() => {
    if (!onboardingData) {
      setError(
        `Tu proceso de registro con ${providerLabel} ya no esta disponible. Seras redirigido al inicio de sesion.`
      );
      setShouldRedirectToLogin(true);
    }
  }, [onboardingData, providerLabel]);

  useEffect(() => {
    if (!shouldRedirectToLogin) {
      return;
    }

    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigate, shouldRedirectToLogin]);

  const handleChange = ({ target }) => {
    setForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.address.trim()) {
      setError("La direccion es obligatoria para finalizar el registro.");
      return;
    }

    if (!onboardingData?.onboardingToken) {
      clearOAuthOnboardingData();
      setOnboardingData(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await completeOAuthProfile({
        onboardingToken: onboardingData.onboardingToken,
        address: form.address.trim(),
        phone: form.phone.trim(),
      });

      if (!response?.token) {
        throw new Error("No se recibio el token final de la sesion.");
      }

      clearOAuthOnboardingData();
      login(response.token);
      navigate("/", { replace: true });
    } catch (currentError) {
      const status = currentError.response?.status;
      const message = currentError.response?.data?.message;

      if (status === 401 || status === 404) {
        clearOAuthOnboardingData();
        setOnboardingData(null);
        setError(
          message ||
            "Tu token temporal expiro o ya no es valido. Seras redirigido al inicio de sesion."
        );
        setShouldRedirectToLogin(true);
      } else if (status === 400) {
        setError(
          message ||
            "Debes registrar una direccion valida para finalizar el proceso."
        );
      } else {
        setError(
          message ||
            currentError.message ||
            `No fue posible completar tu perfil con ${providerLabel}.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearOAuthOnboardingData();
    navigate("/login", { replace: true });
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Completar registro con {providerLabel}</h1>
        <p className="auth-hint">
          Para finalizar tu registro como ciudadano necesitamos completar la
          informacion basica de tu perfil.
        </p>

        {onboardingData && (
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Datos detectados</span>
            <strong className={styles.summaryName}>
              {onboardingData.name || fallbackName}
            </strong>
            <span className={styles.summaryEmail}>
              {onboardingData.email || "Sin email disponible"}
            </span>
          </div>
        )}

        <label>Direccion</label>
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Direccion completa"
          required
        />

        <label>Telefono</label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="3001234567"
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading || shouldRedirectToLogin}>
          {loading ? "Guardando..." : "Finalizar registro"}
        </button>

        <button
          type="button"
          className="auth-back-btn"
          onClick={handleCancel}
          disabled={loading}
        >
          ← Volver al inicio de sesion
        </button>
      </form>
    </div>
  );
}
