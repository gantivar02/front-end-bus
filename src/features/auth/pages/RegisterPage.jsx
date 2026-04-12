import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../services/registerService";
import {
  getPasswordRequirementChecks,
  getPasswordStrength,
  isPasswordValid,
} from "../utils/passwordValidation";
import styles from "./RegisterPage.module.css";

const initialForm = {
  name: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validateRegisterForm(form) {
  if (
    !form.name.trim() ||
    !form.lastName.trim() ||
    !form.email.trim() ||
    !form.password ||
    !form.confirmPassword
  ) {
    return "Completa todos los campos antes de continuar.";
  }

  if (!isPasswordValid(form.password)) {
    return "La contraseña no cumple los requisitos minimos de seguridad.";
  }

  if (form.password !== form.confirmPassword) {
    return "La contraseña y su confirmacion deben coincidir.";
  }

  return "";
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const passwordChecks = useMemo(
    () => getPasswordRequirementChecks(form.password),
    [form.password]
  );
  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const handleChange = ({ target }) => {
    setError("");
    setSuccess(null);
    setForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateRegisterForm(form);

    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(null);

      const response = await registerUser({
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      setSuccess({
        message:
          response.message ||
          "Cuenta creada exitosamente. Te enviamos un correo de confirmacion.",
        email: response.email || form.email.trim(),
      });
      setForm(initialForm);
    } catch (currentError) {
      const status = currentError.response?.status;
      const backendMessage = currentError.response?.data?.message;

      if (status === 409) {
        setError(
          backendMessage || "Este correo ya esta registrado en el sistema."
        );
      } else if (status === 400) {
        setError(
          backendMessage ||
            "Revisa los datos ingresados y vuelve a intentarlo."
        );
      } else {
        setError(
          backendMessage ||
            "No fue posible completar el registro en este momento."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="auth-hint">
          Registra tu cuenta con email y contraseña para continuar con el
          acceso al sistema.
        </p>

        <label>Nombre</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Juan"
          required
        />

        <label>Apellido</label>
        <input
          type="text"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          placeholder="Perez"
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="juan@example.com"
          required
        />

        <label>Contraseña</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Abc12345!"
          required
        />

        <div className={styles.strengthBlock}>
          <div className={styles.strengthHeader}>
            <span className={styles.strengthLabel}>Fortaleza</span>
            <strong
              className={`${styles.strengthValue} ${styles[passwordStrength.tone]}`}
            >
              {passwordStrength.label}
            </strong>
          </div>

          <div className={styles.strengthTrack} aria-hidden="true">
            <div
              className={`${styles.strengthBar} ${styles[passwordStrength.tone]}`}
              style={{ width: `${passwordStrength.progress}%` }}
            />
          </div>
        </div>

        <ul className={styles.requirementList}>
          {passwordChecks.map((requirement) => (
            <li
              key={requirement.id}
              className={
                requirement.passed ? styles.requirementPassed : styles.requirementPending
              }
            >
              {requirement.label}
            </li>
          ))}
        </ul>

        <label>Confirmar contraseña</label>
        <input
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Repite tu contraseña"
          required
        />

        {form.confirmPassword && form.password !== form.confirmPassword && (
          <p className="error-text">La confirmacion no coincide con la contraseña.</p>
        )}

        {error && <p className="error-text">{error}</p>}

        {success && (
          <div className={styles.successBox}>
            <p className="auth-success">{success.message}</p>
            <p className={styles.successHint}>
              Revisa el correo <strong>{success.email}</strong> para confirmar tu
              cuenta antes de iniciar sesion.
            </p>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>

        <Link to="/login" className="auth-link">
          ¿Ya tienes cuenta? Inicia sesion
        </Link>
      </form>
    </div>
  );
}
