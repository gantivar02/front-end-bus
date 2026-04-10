import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

import LoginMicrosoft from "../components/LoginMicrosoft";
import LoginGoogle from "../components/LoginGoogle";
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = ({ target }) => {
    setForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/public/security/login", form);
      const sessionId = response.data?.token;


      if (!sessionId) {
        throw new Error("No se recibió token");
      }

      navigate("/verify-2fa", {
      state: {
        sessionId: response.data.sessionId,
        maskedEmail: response.data.maskedEmail,
        expiration: response.data.expiration,
      },
    });
    } catch (err) {console.log("Error:", err.response?.status, err.response?.data);
      setError(err.response?.data?.message ||"No fue posible iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Iniciar sesión</h1>

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
        />

        <label>Contraseña</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="********"
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Entrar"}
        </button>
        <hr />

        <LoginMicrosoft
          onSuccess={(token) => {
            login(token);
            navigate("/dashboard");
          }}
        />

        <LoginGoogle
          onSuccess={(token) => {
            login(token);
            navigate("/dashboard");
          }}
        />
      </form>
    </div>
  );
}