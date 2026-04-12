import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogleToken } from "../services/googleAuthService";

export default function LoginGoogle({
  onSuccess,
  onRequiresProfileCompletion,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSuccess = async (credentialResponse) => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const googleToken = credentialResponse.credential;

      if (!googleToken) {
        throw new Error("Google no devolvio un token valido.");
      }

      const data = await loginWithGoogleToken(googleToken);

      if (data?.token) {
        onSuccess(data.token);
        return;
      }

      if (data?.requiresProfileCompletion) {
        onRequiresProfileCompletion(data);
        return;
      }

      setError("No fue posible completar el inicio de sesion con Google.");
    } catch (currentError) {
      const status = currentError.response?.status;

      if (status === 401) {
        setError("No fue posible autenticar tu cuenta de Google.");
      } else if (status === 409) {
        setError(
          currentError.response?.data?.message ||
            "Este email ya esta vinculado a otra cuenta de Google."
        );
      } else {
        setError(
          currentError.response?.data?.message ||
            currentError.message ||
            "No fue posible iniciar sesion con Google."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() =>
          setError("No fue posible iniciar sesion con Google.")
        }
      />

      {loading && <p className="auth-hint">Validando acceso con Google...</p>}
      {error && <p className="error-text">{error}</p>}
    </>
  );
}
