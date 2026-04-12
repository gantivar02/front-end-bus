const GOOGLE_ONBOARDING_KEY = "googleOnboarding";

export function saveGoogleOnboardingData(data) {
  sessionStorage.setItem(GOOGLE_ONBOARDING_KEY, JSON.stringify(data));
}

export function getGoogleOnboardingData() {
  const rawValue = sessionStorage.getItem(GOOGLE_ONBOARDING_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
    return null;
  }
}

export function clearGoogleOnboardingData() {
  sessionStorage.removeItem(GOOGLE_ONBOARDING_KEY);
}
