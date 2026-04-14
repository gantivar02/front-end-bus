import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import api from "../../../services/api";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

const btnClass =
  "flex items-center justify-center gap-2 py-3 px-4 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-colors font-label text-sm font-semibold text-on-surface disabled:opacity-60 disabled:cursor-not-allowed";

export default function LoginGoogle({ onSuccess, onRequiresProfileCompletion }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (tokenResponse) => {
    try {
      setError("");
      setLoading(true);
      const res = await api.post(
        "/public/security/login-google",
        { token: tokenResponse.access_token },
        { skipAuth: true, skipAuthRedirect: true }
      );
      const data = res.data;
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
      if (status === 409) {
        setError(backendMessage || "Este correo ya está vinculado a otra cuenta de Google.");
      } else {
        setError(backendMessage || "No fue posible iniciar sesión con Google. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: () => setError("No fue posible completar la autenticación con Google."),
    scope: "openid email profile",
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => login()}
        disabled={loading}
        className={btnClass}
      >
        <GoogleIcon />
        {loading ? "Conectando..." : "Google"}
      </button>
      {error && <p className="text-xs text-error mt-1 text-center">{error}</p>}
    </div>
  );
}
