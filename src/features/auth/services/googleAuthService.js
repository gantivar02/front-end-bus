import api from "../../../services/api";

const publicAuthConfig = {
  skipAuth: true,
  skipAuthRedirect: true,
};

export async function loginWithGoogleToken(token) {
  const response = await api.post(
    "/public/security/login-google",
    { token },
    publicAuthConfig
  );
  return response.data;
}

export async function completeGoogleProfile({
  onboardingToken,
  address,
  phone,
}) {
  const response = await api.post(
    "/public/security/google/complete-profile",
    {
      onboardingToken,
      address,
      phone,
    },
    publicAuthConfig
  );

  return response.data;
}

export async function unlinkGoogle() {
  const response = await api.put("/profiles/google/unlink");
  return response.data;
}
