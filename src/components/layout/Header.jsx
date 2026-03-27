import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import styles from "./Header.module.css";

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <span>Panel de administración</span>
      <Button variant="secondary" onClick={handleLogout}>
        Cerrar sesión
      </Button>
    </header>
  );
}