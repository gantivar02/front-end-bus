import { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import {
  formatPermissionLabel,
  getEntityId,
  getPermissionAction,
  getPermissionDescription,
  getPermissionMethod,
  getPermissionModule,
  getPermissionName,
  getPermissionUrl,
  groupPermissionsByModule,
} from "../../permissions/utils/permissionUtils";
import styles from "./AssignPermissionForm.module.css";

export default function AssignPermissionForm({
  roles,
  permissions,
  selectedRoleId,
  assignedPermissionIds,
  onRoleChange,
  onAssign,
  loading,
}) {
  const [permissionId, setPermissionId] = useState("");

  const selectedRole = roles.find((role) => getEntityId(role) === selectedRoleId);
  const groupedPermissions = groupPermissionsByModule(permissions);
  const selectedPermission = permissions.find(
    (permission) => getEntityId(permission) === permissionId
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedRoleId || !permissionId) {
      return;
    }

    onAssign(permissionId);
    setPermissionId("");
  };

  const handleRoleSelectionChange = (event) => {
    onRoleChange(event.target.value);
    setPermissionId("");
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Asignar permiso a rol</h2>
          <p className={styles.subtitle}>
            Selecciona el rol y luego el permiso desde una lista clara usando el
            nombre exacto configurado en el backend.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.controls}>
          <div className={styles.field}>
            <label htmlFor="role-selector">Rol</label>
            <select
              id="role-selector"
              value={selectedRoleId}
              onChange={handleRoleSelectionChange}
            >
              <option value="">Selecciona un rol</option>
              {roles.map((role) => (
                <option key={getEntityId(role)} value={getEntityId(role)}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="permission-selector">Permiso</label>
            <select
              id="permission-selector"
              value={permissionId}
              onChange={(event) => setPermissionId(event.target.value)}
              disabled={!selectedRoleId}
            >
              <option value="">
                {selectedRoleId
                  ? "Selecciona un permiso"
                  : "Primero selecciona un rol"}
              </option>
              {groupedPermissions.map(({ moduleName, items }) => (
                <optgroup
                  key={moduleName}
                  label={formatPermissionLabel(moduleName)}
                >
                  {items.map((permission) => {
                    const currentPermissionId = getEntityId(permission);
                    const isAssigned = assignedPermissionIds.includes(
                      currentPermissionId
                    );

                    return (
                      <option
                        key={currentPermissionId}
                        value={currentPermissionId}
                        disabled={isAssigned}
                      >
                        {getPermissionName(permission)}
                        {isAssigned ? " (ya asignado)" : ""}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
            <span className={styles.helperText}>
              La lista muestra el campo <code>name</code> del permiso.
            </span>
          </div>
        </div>

        <div className={styles.roleBanner}>
          {selectedRole ? (
            <>
              <strong>{selectedRole.name}</strong>
              <span>
                Tiene {assignedPermissionIds.length} permiso
                {assignedPermissionIds.length === 1 ? "" : "s"} asignado
                {assignedPermissionIds.length === 1 ? "" : "s"}.
              </span>
            </>
          ) : (
            <span>Selecciona un rol para habilitar la lista de permisos.</span>
          )}
        </div>

        <div className={styles.selectionPanel}>
          {selectedPermission ? (
            <>
              <span className={styles.selectionLabel}>Permiso seleccionado</span>
              <strong className={styles.selectionName}>
                {getPermissionName(selectedPermission)}
              </strong>
              <p className={styles.selectionDescription}>
                {getPermissionDescription(selectedPermission)}
              </p>
              <div className={styles.selectionMeta}>
                <span className={styles.metaChip}>
                  {formatPermissionLabel(getPermissionModule(selectedPermission))}
                </span>
                <span className={styles.metaChip}>
                  {formatPermissionLabel(getPermissionAction(selectedPermission))}
                </span>
                <span className={styles.metaChip}>
                  {getPermissionMethod(selectedPermission)}
                </span>
                <code>{getPermissionUrl(selectedPermission)}</code>
              </div>
            </>
          ) : (
            <>
              <span className={styles.selectionLabel}>Seleccion actual</span>
              <p className={styles.selectionDescription}>
                Elige un permiso de la lista para ver su detalle antes de
                asignarlo.
              </p>
            </>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !selectedRoleId || !permissionId}
          >
            {loading ? "Asignando..." : "Asignar permiso"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
