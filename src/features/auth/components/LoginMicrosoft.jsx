import { useState } from "react";
import { initializeMsal, msalInstance } from "../services/msalInstance";
import api from "../../../services/api";

export default function LoginMicrosoft({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMicrosoftLogin = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await initializeMsal();

      const response = await msalInstance.loginPopup({
        scopes: ["openid", "profile", "email", "User.Read"],
        prompt: "select_account",
      });

      const token = response.accessToken;

      if (!token) {
        throw new Error("Microsoft no devolvio un access token valido.");
      }

      const apiResponse = await api.post("/public/security/login-microsoft", {
        token,
      });
      const data = apiResponse.data;

      if (!data?.token) {
        throw new Error(
          data?.message || "No fue posible validar el login con Microsoft"
        );
      }
      
      onSuccess(data.token);
    } catch (error) {
      console.error("Error Microsoft:", error);
      if (error.errorCode === "interaction_in_progress") {
        setError("Ya hay una ventana de Microsoft abierta. Cierra el popup anterior y vuelve a intentarlo.");
      } else if (error.response?.status === 404) {
        setError("El backend no tiene habilitado el endpoint de login con Microsoft.");
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "No fue posible iniciar sesion con Microsoft."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={handleMicrosoftLogin} disabled={loading}>
        {loading ? "Conectando con Microsoft..." : "Login con Microsoft"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </>
  );
}
