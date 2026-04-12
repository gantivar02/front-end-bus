import api from "../../../services/api";

const publicAuthConfig = {
  skipAuth: true,
  skipAuthRedirect: true,
};

export async function registerUser(data) {
  const response = await api.post(
    "/public/security/register",
    data,
    publicAuthConfig
  );

  return response.data;
}
