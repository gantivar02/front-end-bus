import { useEffect, useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  // Filtrar usuarios por nombre o email según búsqueda
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Roles que el usuario seleccionado aún no tiene asignados
  const assignedRoleIds = useMemo(
    () => new Set(userRoles.map((ur) => ur.role?.id || ur.role?._id)),
    [userRoles]
  );

  const availableRoles = useMemo(
    () => roles.filter((r) => !assignedRoleIds.has(r.id || r._id)),
    [roles, assignedRoleIds]
  );

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3500);
  };

  const handleAssign = async (roleId) => {
    try {
      setAssignLoading(true);
      setError("");
      await assignRoleToUser(selectedUserId, roleId);
      await loadUserRoles(selectedUserId);
      showSuccess("Rol asignado correctamente. El usuario recibirá una notificación por email.");
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
      showSuccess("Rol removido. El usuario recibirá una notificación por email.");
    } catch {
      setError("No fue posible eliminar la relación");
    }
  };

  const selectedUser = users.find(
    (u) => (u.id || u._id) === selectedUserId
  );

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

      {error && <p className={styles.error}>{error}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <>
          {/* Buscador de usuarios */}
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Buscar usuario por nombre o email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedUserId("");
              }}
              className={styles.searchInput}
            />
          </div>

          <AssignRoleForm
            users={filteredUsers}
            roles={availableRoles}
            allRolesCount={roles.length}
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
            onAssign={handleAssign}
            loading={assignLoading}
          />

          {selectedUser && (
            <div className={styles.sectionTitle}>
              <h3>
                Roles asignados a{" "}
                <strong>{selectedUser.name}</strong>
                {userRoles.length > 0 && (
                  <span className={styles.badge}>{userRoles.length}</span>
                )}
              </h3>
              {userRoles.length > 1 && (
                <p className={styles.hint}>
                  Los permisos se acumulan entre todos los roles asignados.
                </p>
              )}
            </div>
          )}

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
