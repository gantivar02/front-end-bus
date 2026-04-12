import { useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { unlinkGoogle } from "../../auth/services/googleAuthService";
import styles from "./AccountSettingsPage.module.css";

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUnlinkGoogle = async () => {
    const confirmed = window.confirm(
      "¿Seguro que deseas desvincular tu cuenta de Google?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const response = await unlinkGoogle();
      setMessage(
        response.message ||
          "Cuenta de Google desvinculada correctamente."
      );
    } catch (currentError) {
      const status = currentError.response?.status;
      const backendMessage = currentError.response?.data?.message;

      if (status === 409) {
        setError(
          backendMessage ||
            "Tu cuenta no tiene una integracion de Google vinculada."
        );
      } else {
        setError(
          backendMessage ||
            "No fue posible desvincular la cuenta de Google."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Cuenta"
        description="Administra las integraciones de inicio de sesion de tu cuenta."
      />

      <Card className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.title}>Cuenta vinculada con Google</h2>
            <p className={styles.description}>
              Si tu usuario tiene Google asociado, aqui puedes desvincularlo sin
              afectar el login tradicional ni otros proveedores.
            </p>
          </div>
        </div>

        {message && <p className={styles.success}>{message}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button
            variant="danger"
            onClick={handleUnlinkGoogle}
            disabled={loading}
          >
            {loading ? "Desvinculando..." : "Desvincular Google"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
