import { useEffect, useState } from "react";
import Table from "../../../components/ui/Table";
import PageHeader from "../../../components/ui/PageHeader";
import ActionButtons from "../../../components/ui/ActionButtons";
import AssignPermissionForm from "../components/AssignPermissionForm";
import { getRoles } from "../../roles/services/rolesService";
import { getPermissions } from "../../permissions/services/permissionsService";
import {
  formatPermissionLabel,
  getEntityId,
  getPermissionAction,
  getPermissionData,
  getPermissionDescription,
  getPermissionId,
  getPermissionMethod,
  getPermissionModule,
  getPermissionName,
  getPermissionUrl,
} from "../../permissions/utils/permissionUtils";
import {
  getPermissionsByRole,
  assignPermissionToRole,
  removeRolePermission,
} from "../services/rolePermissionService";
import styles from "./RolePermissionsPage.module.css";

const methodToneMap = {
  GET: "methodGet",
  POST: "methodPost",
  PUT: "methodPut",
  PATCH: "methodPatch",
  DELETE: "methodDelete",
};

function getMethodToneClass(method) {
  return styles[methodToneMap[method] || "methodDefault"];
}

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedRole = roles.find((role) => getEntityId(role) === selectedRoleId);
  const assignedPermissionIds = rolePermissions
    .map((item) => getPermissionId(item))
    .filter(Boolean);

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
    } catch (currentError) {
      setError(
        currentError.response?.data?.message ||
          "No se pudieron cargar roles y permisos"
      );
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
    } catch (currentError) {
      setError(
        currentError.response?.data?.message ||
          "No se pudieron cargar los permisos del rol"
      );
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
    } catch (currentError) {
      setError(
        currentError.response?.data?.message ||
          "No fue posible asignar el permiso al rol"
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemove = async (rolePermission) => {
    const permission = getPermissionData(rolePermission);
    const permissionId = getPermissionId(rolePermission);
    const confirmed = window.confirm(
      `¿Seguro que deseas quitar el permiso ${getPermissionName(permission)} del rol?`
    );

    if (!confirmed) {
      return;
    }

    if (!selectedRoleId || !permissionId) {
      setError("No se pudo identificar el permiso que se desea quitar");
      return;
    }

    try {
      setError("");
      await removeRolePermission(selectedRoleId, permissionId);
      await loadRolePermissions(selectedRoleId);
    } catch (currentError) {
      setError(
        currentError.response?.data?.message ||
          "No fue posible quitar el permiso del rol"
      );
    }
  };

  const columns = [
    {
      key: "permission",
      title: "Permiso",
      render: (item) => {
        const permission = getPermissionData(item);

        return (
          <div className={styles.permissionCell}>
            <div className={styles.permissionHeader}>
              <strong className={styles.permissionName}>
                {getPermissionName(permission)}
              </strong>
              <span className={styles.permissionId}>
                ID {getPermissionId(item)}
              </span>
            </div>
            <p className={styles.permissionDescription}>
              {getPermissionDescription(permission)}
            </p>
          </div>
        );
      },
    },
    {
      key: "scope",
      title: "Alcance",
      render: (item) => {
        const permission = getPermissionData(item);

        return (
          <div className={styles.scopeCell}>
            <span className={styles.scopeChip}>
              {formatPermissionLabel(getPermissionModule(permission))}
            </span>
            <span className={`${styles.scopeChip} ${styles.scopeChipAccent}`}>
              {formatPermissionLabel(getPermissionAction(permission))}
            </span>
          </div>
        );
      },
    },
    {
      key: "endpoint",
      title: "Endpoint",
      render: (item) => {
        const permission = getPermissionData(item);
        const method = getPermissionMethod(permission);

        return (
          <div className={styles.endpointCell}>
            <span className={`${styles.methodBadge} ${getMethodToneClass(method)}`}>
              {method}
            </span>
            <code className={styles.endpointCode}>
              {getPermissionUrl(permission)}
            </code>
          </div>
        );
      },
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
        description="Asigna permisos a los roles del sistema y revisa rapidamente su alcance."
      />

      {error && <p className={styles.errorBanner}>{error}</p>}

      {loading ? (
        <p className={styles.statusText}>Cargando datos...</p>
      ) : (
        <>
          <AssignPermissionForm
            roles={roles}
            permissions={permissions}
            selectedRoleId={selectedRoleId}
            assignedPermissionIds={assignedPermissionIds}
            onRoleChange={setSelectedRoleId}
            onAssign={handleAssign}
            loading={assignLoading}
          />

          <section className={styles.summaryCard}>
            {selectedRole ? (
              <>
                <div>
                  <span className={styles.summaryLabel}>Rol seleccionado</span>
                  <h2 className={styles.summaryTitle}>{selectedRole.name}</h2>
                  <p className={styles.summaryText}>
                    {selectedRole.description || "Sin descripcion registrada."}
                  </p>
                </div>

                <div className={styles.summaryCount}>
                  <span>Permisos activos</span>
                  <strong>{rolePermissions.length}</strong>
                </div>
              </>
            ) : (
              <p className={styles.summaryText}>
                Selecciona un rol para consultar sus permisos asignados.
              </p>
            )}
          </section>

          <div className={styles.tableWrap}>
            <Table
              columns={columns}
              data={rolePermissions}
              emptyMessage={
                selectedRoleId
                  ? "Este rol no tiene permisos asignados."
                  : "Selecciona un rol para ver sus permisos."
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
