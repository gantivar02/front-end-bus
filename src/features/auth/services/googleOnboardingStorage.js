// Wrappers de compatibilidad. El storage real ahora vive en
// oauthOnboardingStorage y soporta los 3 proveedores OAuth.
import {
  clearOAuthOnboardingData,
  getOAuthOnboardingData,
  saveOAuthOnboardingData,
} from "./oauthOnboardingStorage";

export function saveGoogleOnboardingData(data) {
  saveOAuthOnboardingData({ ...data, provider: data.provider || "google" });
}

export function getGoogleOnboardingData() {
  return getOAuthOnboardingData();
}

export function clearGoogleOnboardingData() {
  clearOAuthOnboardingData();
}
