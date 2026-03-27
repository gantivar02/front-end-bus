import { useEffect, useState } from "react";
import Table from "../../../components/ui/Table";
import PageHeader from "../../../components/ui/PageHeader";
import ActionButtons from "../../../components/ui/ActionButtons";
import AssignRoleForm from "../components/AssignRoleForm";
import { getUsers } from "../../users/services/usersService";
import { getRoles } from "../../roles/services/rolesService";
import {
  getRolesByUser,
  assignRoleToUser,
  removeUserRole,
} from "../services/userRoleService";
import styles from "./UserRolesPage.module.css";

export default function UserRolesPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersData, rolesData] = await Promise.all([
        getUsers(),
        getRoles(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
    } catch {
      setError("No se pudieron cargar usuarios y roles");
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async (userId) => {
    if (!userId) {
      setUserRoles([]);
      return;
    }

    try {
      setError("");
      const data = await getRolesByUser(userId);
      setUserRoles(data);
    } catch {
      setError("No se pudieron cargar los roles del usuario");
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadUserRoles(selectedUserId);
  }, [selectedUserId]);

  const handleAssign = async (roleId) => {
    try {
      setAssignLoading(true);
      setError("");
      await assignRoleToUser(selectedUserId, roleId);
      await loadUserRoles(selectedUserId);
    } catch {
      setError("No fue posible asignar el rol al usuario");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemove = async (userRole) => {
    const relationId = userRole.id || userRole._id;
    const confirmed = window.confirm(
      "¿Seguro que deseas quitar este rol del usuario?"
    );

    if (!confirmed) return;

    try {
      setError("");
      await removeUserRole(relationId);
      await loadUserRoles(selectedUserId);
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
      key: "roleName",
      title: "Rol",
      render: (item) => item.role?.name,
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
        title="Usuario - Roles"
        description="Asigna roles a los usuarios del sistema."
      />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <>
          <AssignRoleForm
            users={users}
            roles={roles}
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
            onAssign={handleAssign}
            loading={assignLoading}
          />

          <Table
            columns={columns}
            data={userRoles}
            emptyMessage={
              selectedUserId
                ? "Este usuario no tiene roles asignados."
                : "Selecciona un usuario para ver sus roles."
            }
          />
        </>
      )}
    </div>
  );
}