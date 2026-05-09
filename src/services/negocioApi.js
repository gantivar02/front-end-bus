import axios from "axios";
import { storage } from "../utils/storage";

export const NEGOCIO_BASE_URL =
  import.meta.env.VITE_MS_NEGOCIO_URL ?? "http://localhost:3000/api";

export const NEGOCIO_STATIC_URL =
  import.meta.env.VITE_MS_NEGOCIO_STATIC_URL ?? "http://localhost:3000";

const negocioApi = axios.create({
  baseURL: NEGOCIO_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

negocioApi.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

negocioApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const shouldRedirect =
      error.response?.status === 401 &&
      !error.config?.skipAuthRedirect &&
      !!storage.getToken();
    if (shouldRedirect) {
      storage.removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export function resolveStaticUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${NEGOCIO_STATIC_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export default negocioApi;
