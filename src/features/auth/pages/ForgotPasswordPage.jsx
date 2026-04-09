import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await api.post("/public/security/forgot-password", { email });
      setMessage(res.data.message);
    } catch {
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
