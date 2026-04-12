import { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import {
  getEntityId,
  getPermissionMethod,
  getPermissionUrl,
  getPermissionModule,
} from "../../permissions/utils/permissionUtils";
import styles from "./AssignPermissionForm.module.css";

export default function AssignPermissionForm({
  selectedRole,
  permissions,
  assignedPermissionIds,
  onAssign,
  loading,
}) {
  const [permissionId, setPermissionId] = useState("");

  const availablePermissions = permissions.filter(
    (p) => !assignedPermissionIds?.includes(getEntityId(p))
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedRole || !permissionId) return;
    onAssign(permissionId);
    setPermissionId("");
  };

  return (
    <Card>
      <h2 className={styles.title}>Asignar permiso a rol</h2>

      {selectedRole ? (
        <div className={styles.roleBanner}>
          <span>Rol seleccionado:</span>
          <strong>{selectedRole.name}</strong>
          {selectedRole.description && (
            <span className={styles.roleDesc}>— {selectedRole.description}</span>
          )}
        </div>
      ) : (
        <p className={styles.hint}>
          Selecciona un rol de la lista de abajo para poder asignarle permisos.
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Permiso a asignar</label>
          <select
            value={permissionId}
            onChange={(e) => setPermissionId(e.target.value)}
            disabled={!selectedRole}
          >
            <option value="">
              {!selectedRole
                ? "Selecciona primero un rol"
                : availablePermissions.length === 0
                ? "Todos los permisos ya están asignados"
                : "Selecciona un permiso"}
            </option>
            {availablePermissions.map((permission) => (
              <option key={getEntityId(permission)} value={getEntityId(permission)}>
                {getPermissionMethod(permission)} {getPermissionUrl(permission)} — {getPermissionModule(permission)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !selectedRole || !permissionId}
          >
            {loading ? "Asignando..." : "Asignar permiso"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
