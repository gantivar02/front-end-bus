import axios from "axios";
import { storage } from "../utils/storage";

export const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// HU-009: adjunta el token en cada request
api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// HU-009: si el token expiró o es inválido, limpia sesión y redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const shouldRedirectToLogin =
      error.response?.status === 401 &&
      !error.config?.skipAuthRedirect &&
      !!storage.getToken();

    if (shouldRedirectToLogin) {
      storage.removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
