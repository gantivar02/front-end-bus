import { useEffect, useState } from "react";
import Table from "../../../components/ui/Table";
import ActionButtons from "../../../components/ui/ActionButtons";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import RoleForm from "../components/RoleForm";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../services/rolesService";
import styles from "./RolesPage.module.css";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
    } catch {
      setError("No se pudieron cargar los roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);

      if (selectedRole) {
        await updateRole(selectedRole.id, formData);
      } else {
        await createRole(formData);
      }

      setShowForm(false);
      setSelectedRole(null);
      await loadRoles();
    } catch {
      setError("Error al guardar rol");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Eliminar rol ${role.name}?`)) return;

    await deleteRole(role.id);
    loadRoles();
  };

  const columns = [
    { key: "id", title: "ID" },
    { key: "name", title: "Nombre" },
    { key: "description", title: "Descripción" },
    {
      key: "actions",
      title: "Acciones",
      render: (role) => (
        <ActionButtons
          onEdit={() => {
            setSelectedRole(role);
            setShowForm(true);
          }}
          onDelete={() => handleDelete(role)}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Roles"
        action={
          <Button onClick={() => setShowForm(true)}>
            Nuevo rol
          </Button>
        }
      />

      {showForm && (
        <RoleForm
          initialData={selectedRole}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedRole(null);
          }}
          loading={formLoading}
        />
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <Table columns={columns} data={roles} />
      )}
    </div>
  );
}