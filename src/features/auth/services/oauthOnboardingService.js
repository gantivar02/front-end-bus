import api from "../../../services/api";

const publicAuthConfig = {
  skipAuth: true,
  skipAuthRedirect: true,
};

// Endpoint agnostico al provider. El backend acepta tokens emitidos
// por loginGoogle, loginGithub o loginMicrosoft cuando devuelven
// requiresProfileCompletion: true.
export async function completeOAuthProfile({
  onboardingToken,
  address,
  phone,
}) {
  const response = await api.post(
    "/public/security/onboarding/complete-profile",
    {
      onboardingToken,
      address,
      phone,
    },
    publicAuthConfig,
  );

  return response.data;
}
