import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogleToken } from "../services/googleAuthService";

export default function LoginGoogle({ onSuccess, onRequiresProfileCompletion }) {
  const [error, setError] = useState("");

  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;

    if (!idToken) {
      setError("No fue posible obtener la credencial de Google. Intenta nuevamente.");
      return;
    }

    try {
      setError("");
      const data = await loginWithGoogleToken(idToken);

      if (data?.requiresProfileCompletion) {
        onRequiresProfileCompletion?.(data);
      } else if (data?.token) {
        onSuccess(data.token);
      } else {
        setError("No fue posible completar el inicio de sesión con Google.");
      }
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message;

      if (status === 401) {
        setError(backendMessage || "No fue posible autenticar con Google. Intenta nuevamente.");
      } else if (status === 409) {
        setError(backendMessage || "Este correo ya está vinculado a otra cuenta de Google.");
      } else {
        setError(backendMessage || "No fue posible iniciar sesión con Google. Intenta de nuevo.");
      }
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-center rounded-lg border border-outline-variant/30 bg-surface-container-low p-1 min-h-[50px]">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError("No fue posible completar la autenticación con Google.")}
          locale="es"
          theme="outline"
          size="medium"
          shape="rectangular"
          text="signin_with"
          width="110"
        />
      </div>
      {error && <p className="text-xs text-error mt-1 text-center">{error}</p>}
    </div>
  );
}
