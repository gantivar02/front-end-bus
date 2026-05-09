import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Permite acceder a la ruta solo si el usuario tiene al menos uno de los roles indicados.
 * Si no está autenticado → /login.
 * Si está autenticado pero sin rol válido → /negocio (home con permiso universal).
 */
export default function RoleRoute({ allow, children }) {
  const { isAuthenticated, hasAnyRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!Array.isArray(allow) || allow.length === 0) return children;
  if (!hasAnyRole(allow)) return <Navigate to="/negocio" replace />;
  return children;
}
