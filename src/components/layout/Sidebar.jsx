import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <h2>Security App</h2>

      <nav className={styles.nav}>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/users">Usuarios</NavLink>
        <NavLink to="/roles">Roles</NavLink>
        <NavLink to="/permissions">Permisos</NavLink>
        <NavLink to="/role-permission">Rol - Permisos</NavLink>
        <NavLink to="/user-role">Usuario - Roles</NavLink>
        <NavLink to="/profiles">Perfiles</NavLink>
        <NavLink to="/sessions">Sesiones</NavLink>
        <NavLink to="/account">Cuenta</NavLink>
      </nav>
    </aside>
  );
}
