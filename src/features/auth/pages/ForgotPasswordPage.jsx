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
    console.log("Submit iniciado");
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const recaptchaToken = await getToken("forgot_password");
      console.log("reCAPTCHA token:", recaptchaToken);

      if (!recaptchaToken) {
        setError("No se pudo verificar el reCAPTCHA. Intenta de nuevo.");
        return;
      }

      const res = await api.post("/public/security/forgot-password", {
        email,
        recaptchaToken
      });
      setMessage(res.data.message);
    } catch (err) {
      console.log("Error detallado:", err);
      setError("No fue posible procesar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Recuperar contraseña</h1>
        <p className="auth-hint">
          Ingresa tu email y te enviaremos un enlace de recuperación válido por 30 minutos.
        </p>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          required
        />
        {error && <p className="error-text">{error}</p>}
        {message && <p className="auth-success">{message}</p>}
        <button type="submit" disabled={loading || !!message}>
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
        <Link to="/login" className="auth-link">
          ← Volver al inicio de sesión
        </Link>
      </form>
    </div>
  );
}