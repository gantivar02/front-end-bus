import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext();

const ADMIN_ROLES = new Set(["Administrador Sistema", "Administrador Empresa"]);

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
    const isAdmin = roles.some((r) => ADMIN_ROLES.has(r));
    return {
      token,
      isAuthenticated: !!token,
      user,
      roles,
      isAdmin,
      login,
      logout,
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
