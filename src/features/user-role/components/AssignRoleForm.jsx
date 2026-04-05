import { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import styles from "./AssignRoleForm.module.css";

export default function AssignRoleForm({
  users,
  roles,           // roles disponibles (sin asignar aún)
  allRolesCount,   // total de roles para mostrar contexto
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

  const allRolesAssigned = selectedUserId && roles.length === 0 && allRolesCount > 0;

  return (
    <Card>
      <h2>Asignar rol a usuario</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Usuario</label>
          <select
            value={selectedUserId}
            onChange={(e) => {
              onUserChange(e.target.value);
              setRoleId("");
            }}
          >
            <option value="">Selecciona un usuario</option>
            {users.map((user) => (
              <option key={user.id || user._id} value={user.id || user._id}>
                {user.name} — {user.email}
              </option>
            ))}
          </select>
          {users.length === 0 && (
            <span className={styles.hint}>
              No hay usuarios que coincidan con la búsqueda.
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label>Rol disponible</label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            disabled={!selectedUserId || allRolesAssigned}
          >
            <option value="">
              {!selectedUserId
                ? "Primero selecciona un usuario"
                : allRolesAssigned
                ? "El usuario ya tiene todos los roles"
                : "Selecciona un rol"}
            </option>
            {roles.map((role) => (
              <option key={role.id || role._id} value={role.id || role._id}>
                {role.name}
              </option>
            ))}
          </select>
          {selectedUserId && !allRolesAssigned && roles.length > 0 && (
            <span className={styles.hint}>
              Solo se muestran los roles que el usuario aún no tiene asignados.
            </span>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !selectedUserId || !roleId || allRolesAssigned}
          >
            {loading ? "Asignando..." : "Asignar rol"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
