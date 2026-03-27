import { useEffect, useState } from "react";
import Table from "../../../components/ui/Table";
import ActionButtons from "../../../components/ui/ActionButtons";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import PermissionForm from "../components/PermissionForm";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../services/permissionsService";
import styles from "./PermissionsPage.module.css";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPermissions();
      setPermissions(data);
    } catch {
      setError("No se pudieron cargar los permisos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleOpenCreate = () => {
    setSelectedPermission(null);
    setShowForm(true);
  };

  const handleEdit = (permission) => {
    setSelectedPermission(permission);
    setShowForm(true);
  };

  const handleCancel = () => {
    setSelectedPermission(null);
    setShowForm(false);
  };

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (selectedPermission) {
        const permissionId =
          selectedPermission.id || selectedPermission._id;
        await updatePermission(permissionId, formData);
      } else {
        await createPermission(formData);
      }

      setShowForm(false);
      setSelectedPermission(null);
      await loadPermissions();
    } catch {
      setError("No fue posible guardar el permiso");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (permission) => {
    const permissionId = permission.id || permission._id;
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el permiso ${permission.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await deletePermission(permissionId);
      await loadPermissions();
    } catch {
      setError("No fue posible eliminar el permiso");
    }
  };

  const columns = [
    {
      key: "id",
      title: "ID",
      render: (permission) => permission.id || permission._id,
    },
    {
      key: "model",
      title: "Modelo",
    },
    {
      key: "url",
      title: "URL",
    },
    {
      key: "method",
      title: "Método",
    },
    {
      key: "actions",
      title: "Acciones",
      render: (permission) => (
        <ActionButtons
          onEdit={() => handleEdit(permission)}
          onDelete={() => handleDelete(permission)}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Permisos"
        description="Gestiona los permisos del sistema."
        action={
          <Button variant="primary" onClick={handleOpenCreate}>
            Nuevo permiso
          </Button>
        }
      />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {showForm && (
        <PermissionForm
          initialData={selectedPermission}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      )}

      {loading ? (
        <p>Cargando permisos...</p>
      ) : (
        <Table
          columns={columns}
          data={permissions}
          emptyMessage="No hay permisos registrados."
        />
      )}
    </div>
  );
}