import { useEffect, useState } from "react";
import Table from "../../../components/ui/Table";
import PageHeader from "../../../components/ui/PageHeader";
import ActionButtons from "../../../components/ui/ActionButtons";
import {
  getSessions,
  deleteSession,
} from "../services/sessionsService";
import styles from "./SessionsPage.module.css";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getSessions();
      setSessions(data);
    } catch {
      setError("No se pudieron cargar las sesiones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDelete = async (session) => {
    const sessionId = session.id || session._id;

    const confirmed = window.confirm(
      `¿Cerrar sesión de ${session.user?.email}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteSession(sessionId);
      await loadSessions();
    } catch {
      setError("No se pudo eliminar la sesión");
    }
  };

  const columns = [
    {
      key: "id",
      title: "ID",
      render: (s) => s.id || s._id,
    },
    {
      key: "user",
      title: "Usuario",
      render: (s) =>
        s.user
          ? `${s.user.name || ""} (${s.user.email || ""})`
          : "Sin usuario",
    },
    {
      key: "token",
      title: "Token",
      render: (s) => s.token?.slice(0, 15) + "...",
    },
    {
      key: "expiration",
      title: "Expira",
      render: (s) =>
        s.expiration
          ? new Date(s.expiration).toLocaleString()
          : "Sin fecha",
    },
    {
      key: "code2FA",
      title: "2FA",
    },
    {
      key: "actions",
      title: "Acciones",
      render: (s) => (
        <ActionButtons
          showEdit={false}
          deleteText="Cerrar sesión"
          onDelete={() => handleDelete(s)}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Sesiones"
        description="Monitorea y gestiona sesiones activas."
      />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {loading ? (
        <p>Cargando sesiones...</p>
      ) : (
        <Table
          columns={columns}
          data={sessions}
          emptyMessage="No hay sesiones activas."
        />
      )}
    </div>
  );
}