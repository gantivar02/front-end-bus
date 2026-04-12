import { useState } from "react";
import { initializeMsal, msalInstance } from "../services/msalInstance";
import api from "../../../services/api";

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1"  y="1"  width="9" height="9" fill="#f25022" />
    <rect x="11" y="1"  width="9" height="9" fill="#7fba00" />
    <rect x="1"  y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const btnClass =
  "flex items-center justify-center gap-2 py-3 px-4 w-full bg-surface-container-low border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-colors font-label text-sm font-semibold text-on-surface disabled:opacity-60 disabled:cursor-not-allowed";

export default function LoginMicrosoft({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMicrosoftLogin = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError("");
      await initializeMsal();
      const response = await msalInstance.loginPopup({
        scopes: ["openid", "profile", "email", "User.Read"],
        prompt: "select_account",
      });
      const token = response.accessToken;
      if (!token) throw new Error("Microsoft no devolvio un access token valido.");
      const apiResponse = await api.post(
        "/public/security/login-microsoft",
        { token },
        { skipAuth: true, skipAuthRedirect: true }
      );
      const data = apiResponse.data;
      if (!data?.token) throw new Error(data?.message || "No fue posible validar el login con Microsoft");
      onSuccess(data.token);
    } catch (err) {
      console.error("Error Microsoft:", err);
      if (err.errorCode === "interaction_in_progress") {
        setError("Ya hay una ventana de Microsoft abierta. Ciérrala e intenta de nuevo.");
      } else if (err.response?.status === 404) {
        setError("Endpoint de Microsoft no habilitado en el servidor.");
      } else {
        setError(err.response?.data?.message || err.message || "No fue posible iniciar sesión con Microsoft.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleMicrosoftLogin}
        disabled={loading}
        className={btnClass}
      >
        <MicrosoftIcon />
        {loading ? "Conectando..." : "Microsoft"}
      </button>
      {error && <p className="text-xs text-error mt-1 text-center">{error}</p>}
    </div>
  );
}
