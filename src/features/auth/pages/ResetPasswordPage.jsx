import { useState } from "react";
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
      await api.post("/public/security/reset-password", {
        token,
        newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || "No fue posible restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  // Token no presente en la URL
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>Enlace inválido</h1>
          <p className="error-text">
            Este enlace de recuperación no es válido o ya fue utilizado.
          </p>
          <Link to="/login" className="auth-link">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  // Contraseña actualizada con éxito
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>¡Contraseña actualizada!</h1>
          <p className="auth-success">
            Tu contraseña fue restablecida exitosamente.
          </p>
          <button type="button" onClick={() => navigate("/login")}>
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Nueva contraseña</h1>

        <label>Nueva contraseña</label>
        <input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
          required
        />

        <label>Confirmar contraseña</label>
        <input
          type="password"
          name="confirm"
          value={form.confirm}
          onChange={handleChange}
          placeholder="Repite tu nueva contraseña"
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar nueva contraseña"}
        </button>

        <Link to="/login" className="auth-link">
          ← Volver al inicio de sesión
        </Link>
      </form>
    </div>
  );
}
