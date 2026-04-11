import { useEffect, useState } from "react";
import Table from "../../../components/ui/Table";
import PageHeader from "../../../components/ui/PageHeader";
import ActionButtons from "../../../components/ui/ActionButtons";
import AssignPermissionForm from "../components/AssignPermissionForm";
import { getRoles } from "../../roles/services/rolesService";
import { getPermissions } from "../../permissions/services/permissionsService";
import {
  getPermissionsByRole,
  assignPermissionToRole,
  removeRolePermission,
} from "../services/rolePermissionService";
import styles from "./RolePermissionsPage.module.css";

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [rolesData, permissionsData] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);

      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch {
      setError("No se pudieron cargar roles y permisos");
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    if (!roleId) {
      setRolePermissions([]);
      return;
    }

    try {
      setError("");
      const data = await getPermissionsByRole(roleId);
      setRolePermissions(data);
    } catch {
      setError("No se pudieron cargar los permisos del rol");
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadRolePermissions(selectedRoleId);
  }, [selectedRoleId]);

  const handleAssign = async (permissionId) => {
    try {
      setAssignLoading(true);
      setError("");
      await assignPermissionToRole(selectedRoleId, permissionId);
      await loadRolePermissions(selectedRoleId);
    } catch {
      setError("No fue posible asignar el permiso al rol");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemove = async (rolePermission) => {
    const relationId = rolePermission.id || rolePermission._id;
    const confirmed = window.confirm(
      `¿Seguro que deseas quitar este permiso del rol?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await removeRolePermission(relationId);
      await loadRolePermissions(selectedRoleId);
    } catch {
      setError("No fue posible eliminar la relación");
    }
  };

  const columns = [
    {
      key: "id",
      title: "ID Relación",
      render: (item) => item.id || item._id,
    },
    {
      key: "permissionMethod",
      title: "Método",
      render: (item) => item.permission?.method,
    },
    {
      key: "permissionUrl",
      title: "URL",
      render: (item) => item.permission?.url,
    },
    {
      key: "permissionModule",
      title: "Módulo",
      render: (item) => item.permission?.module,
    },
    {
      key: "actions",
      title: "Acciones",
      render: (item) => (
        <ActionButtons
          showEdit={false}
          onDelete={() => handleRemove(item)}
          deleteText="Quitar"
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Rol - Permisos"
        description="Asigna permisos a los roles del sistema."
      />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <>
          <AssignPermissionForm
            roles={roles}
            permissions={permissions}
            selectedRoleId={selectedRoleId}
            onRoleChange={setSelectedRoleId}
            onAssign={handleAssign}
            loading={assignLoading}
          />

          <Table
            columns={columns}
            data={rolePermissions}
            emptyMessage={
              selectedRoleId
                ? "Este rol no tiene permisos asignados."
                : "Selecciona un rol para ver sus permisos."
            }
          />
        </>
      )}
    </div>
  );
}