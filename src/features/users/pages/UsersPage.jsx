import { useEffect, useState } from "react";
import UserForm from "../components/UserForm";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import ActionButtons from "../../../components/ui/ActionButtons";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/usersService";
import styles from "./UsersPage.module.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setShowForm(false);
  };

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (selectedUser) {
        const userId = selectedUser.id || selectedUser._id;
        const payload = { ...formData };

        if (!payload.password) {
          delete payload.password;
        }

        await updateUser(userId, payload);
      } else {
        await createUser(formData);
      }

      setShowForm(false);
      setSelectedUser(null);
      await loadUsers();
    } catch {
      setError("No fue posible guardar el usuario");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (user) => {
    const userId = user.id || user._id;
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${user.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteUser(userId);
      await loadUsers();
    } catch {
      setError("No fue posible eliminar el usuario");
    }
  };

  const columns = [
    {
      key: "id",
      title: "ID",
      render: (user) => user.id || user._id,
    },
    {
      key: "name",
      title: "Nombre",
    },
    {
      key: "email",
      title: "Email",
    },
    {
      key: "actions",
      title: "Acciones",
      render: (user) => (
        <ActionButtons
          onEdit={() => handleEdit(user)}
          onDelete={() => handleDelete(user)}
        />
      ),
    },
  ];

  return (
    <div className={styles.usersPage}>
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios del sistema."
        action={
          <Button variant="primary" onClick={handleOpenCreate}>
            Nuevo usuario
          </Button>
        }
      />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {showForm && (
        <UserForm
          initialData={selectedUser}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      )}

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <Table
          columns={columns}
          data={users}
          emptyMessage="No hay usuarios registrados."
        />
      )}
    </div>
  );
}