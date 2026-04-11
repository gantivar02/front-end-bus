import { useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { formatPermissionLabel } from "../utils/permissionUtils";
import styles from "./PermissionForm.module.css";

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function createInitialForm(initialData) {
  return {
    name: initialData?.name || "",
    module: initialData?.module || "",
    action: initialData?.action || "",
    description: initialData?.description || "",
    url: initialData?.url || "",
    method: initialData?.method || "GET",
  };
}

export default function PermissionForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}) {
  const [form, setForm] = useState(() => createInitialForm(initialData));

  const handleChange = ({ target }) => {
    setForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      name: form.name.trim(),
      module: form.module.trim(),
      action: form.action.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      method: form.method.trim().toUpperCase(),
    });
  };

  const previewName =
    form.name.trim() || [form.module.trim(), form.action.trim()].filter(Boolean).join("_");

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {initialData ? "Editar permiso" : "Crear permiso"}
          </h2>
          <p className={styles.subtitle}>
            Define la clave del permiso, el alcance funcional y el endpoint que
            protege.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="permission-name">Nombre tecnico</label>
            <input
              id="permission-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="users_delete"
              required
            />
            <span className={styles.helperText}>
              Clave unica del permiso. Ejemplo: users_delete.
            </span>
          </div>

          <div className={styles.field}>
            <label htmlFor="permission-module">Modulo</label>
            <input
              id="permission-module"
              name="module"
              value={form.module}
              onChange={handleChange}
              placeholder="users"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="permission-action">Accion</label>
            <input
              id="permission-action"
              name="action"
              value={form.action}
              onChange={handleChange}
              placeholder="delete"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="permission-method">Metodo HTTP</label>
            <select
              id="permission-method"
              name="method"
              value={form.method}
              onChange={handleChange}
              required
            >
              {httpMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="permission-url">URL</label>
            <input
              id="permission-url"
              name="url"
              value={form.url}
              onChange={handleChange}
              placeholder="/api/users/**"
              required
            />
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="permission-description">Descripcion</label>
            <textarea
              id="permission-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Permite eliminar usuarios"
              rows="4"
            />
          </div>
        </div>

        <aside className={styles.previewCard}>
          <span className={styles.previewEyebrow}>Vista previa</span>
          <h3 className={styles.previewName}>
            {previewName || "permiso_sin_nombre"}
          </h3>

          <div className={styles.previewChips}>
            <span className={styles.previewChip}>
              {formatPermissionLabel(form.module)}
            </span>
            <span className={`${styles.previewChip} ${styles.previewChipAccent}`}>
              {formatPermissionLabel(form.action)}
            </span>
          </div>

          <div className={styles.previewEndpoint}>
            <span className={styles.previewMethod}>
              {form.method || "GET"}
            </span>
            <code>{form.url || "/api/recurso/**"}</code>
          </div>

          <p className={styles.previewDescription}>
            {form.description.trim() || "Agrega una descripcion clara para el equipo."}
          </p>
        </aside>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
          </Button>

          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
