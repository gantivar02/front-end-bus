import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../services/msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

export default function LoginMicrosoft({ onSuccess }) {

  const handleMicrosoftLogin = async () => {
    try {
      // 🔥 IMPORTANTE: inicializar
      await msalInstance.initialize();

      const response = await msalInstance.loginPopup({
        scopes: ["user.read"],
      });

      const token = response.idToken;

      const res = await fetch("http://localhost:8081/sessions/microsoft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.token) {
        onSuccess(data.token);
      }

    } catch (error) {
      console.error("Error Microsoft:", error);
    }
  };

  return <button onClick={handleMicrosoftLogin}>Login con Microsoft</button>;
}