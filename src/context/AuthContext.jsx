import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext();

export const ROL_ADMIN_SISTEMA = "Administrador Sistema";
export const ROL_ADMIN_EMPRESA = "Administrador Empresa";
export const ROL_SUPERVISOR = "Supervisor";
export const ROL_CONDUCTOR = "Conductor";
export const ROL_CIUDADANO = "Ciudadano";

const ADMIN_ROLES = new Set([ROL_ADMIN_SISTEMA, ROL_ADMIN_EMPRESA]);

function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  const value = useMemo(() => {
    const user = decodeJwt(token);
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const rolesSet = new Set(roles);
    const isAdmin = roles.some((r) => ADMIN_ROLES.has(r));
    const hasRole = (rol) => rolesSet.has(rol);
    const hasAnyRole = (lista) =>
      Array.isArray(lista) && lista.some((r) => rolesSet.has(r));
    return {
      token,
      isAuthenticated: !!token,
      user,
      roles,
      isAdmin,
      isAdminSistema: hasRole(ROL_ADMIN_SISTEMA),
      isAdminEmpresa: hasRole(ROL_ADMIN_EMPRESA),
      isSupervisor: hasRole(ROL_SUPERVISOR),
      isConductor: hasRole(ROL_CONDUCTOR),
      isCiudadano: hasRole(ROL_CIUDADANO),
      hasRole,
      hasAnyRole,
      login,
      logout,
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
