import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

async function run() {
  try {
    await broadcastResponseToMainFrame();
  } catch (error) {
    console.error("Error al procesar el callback de Microsoft:", error);
    document.body.innerHTML =
      "<p>No fue posible completar el inicio de sesion con Microsoft. Cierra esta ventana y vuelve a intentarlo.</p>";
  }
}

run();
