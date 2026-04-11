import { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import styles from "./AssignPermissionForm.module.css";

export default function AssignPermissionForm({
  roles,
  permissions,
  selectedRoleId,
  onRoleChange,
  onAssign,
  loading,
}) {
  const [permissionId, setPermissionId] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedRoleId || !permissionId) return;

    onAssign(permissionId);
    setPermissionId("");
  };

  return (
    <Card>
      <h2>Asignar permiso a rol</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Rol</label>
          <select value={selectedRoleId} onChange={(e) => onRoleChange(e.target.value)}>
            <option value="">Selecciona un rol</option>
            {roles.map((role) => (
              <option key={role.id || role._id} value={role.id || role._id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Permiso</label>
          <select value={permissionId} onChange={(e) => setPermissionId(e.target.value)}>
            <option value="">Selecciona un permiso</option>
            {permissions.map((permission) => (
              <option
                key={permission.id || permission._id}
                value={permission.id || permission._id}
              >
                {permission.method} {permission.url} — {permission.module}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Asignando..." : "Asignar permiso"}
          </Button>
        </div>
      </form>
    </Card>
  );
}