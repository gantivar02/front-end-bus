import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./msalConfig"; // 👈 Importa tu archivo existente

export const msalInstance = new PublicClientApplication(msalConfig);

let initialized = false;
export const initializeMsal = async () => {
  if (!initialized) {
    await msalInstance.initialize();
    initialized = true;
  }
};