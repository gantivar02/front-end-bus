import { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import styles from "./AssignRoleForm.module.css";

export default function AssignRoleForm({
  users,
  roles,
  selectedUserId,
  onUserChange,
  onAssign,
  loading,
}) {
  const [roleId, setRoleId] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedUserId || !roleId) return;

    onAssign(roleId);
    setRoleId("");
  };

  return (
    <Card>
      <h2>Asignar rol a usuario</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Usuario</label>
          <select
            value={selectedUserId}
            onChange={(e) => onUserChange(e.target.value)}
          >
            <option value="">Selecciona un usuario</option>
            {users.map((user) => (
              <option key={user.id || user._id} value={user.id || user._id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Rol</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="">Selecciona un rol</option>
            {roles.map((role) => (
              <option key={role.id || role._id} value={role.id || role._id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Asignando..." : "Asignar rol"}
          </Button>
        </div>
      </form>
    </Card>
  );
}