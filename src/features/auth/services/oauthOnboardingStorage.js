// Storage compartido para el flujo "completar perfil" tras el primer
// registro con un proveedor OAuth (google, github o microsoft). El
// backend devuelve {requiresProfileCompletion: true, ...} y aqui
// guardamos el onboardingToken + datos basicos hasta que el usuario
// llene direccion y telefono en OAuthCompleteProfilePage.

const OAUTH_ONBOARDING_KEY = "oauthOnboarding";
const LEGACY_GOOGLE_KEY = "googleOnboarding";

export function saveOAuthOnboardingData(data) {
  sessionStorage.setItem(OAUTH_ONBOARDING_KEY, JSON.stringify(data));
  // Limpia el storage antiguo de Google para que no quede colgado.
  sessionStorage.removeItem(LEGACY_GOOGLE_KEY);
}

export function getOAuthOnboardingData() {
  const rawValue =
    sessionStorage.getItem(OAUTH_ONBOARDING_KEY) ||
    sessionStorage.getItem(LEGACY_GOOGLE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    sessionStorage.removeItem(OAUTH_ONBOARDING_KEY);
    sessionStorage.removeItem(LEGACY_GOOGLE_KEY);
    return null;
  }
}

export function clearOAuthOnboardingData() {
  sessionStorage.removeItem(OAUTH_ONBOARDING_KEY);
  sessionStorage.removeItem(LEGACY_GOOGLE_KEY);
}
