import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import styles from "./PermissionForm.module.css";

const initialForm = {
  url: "",
  method: "",
  model: "",
};

export default function PermissionForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        url: initialData.url || "",
        method: initialData.method || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [initialData]);

  const handleChange = ({ target }) => {
    setForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <Card>
      <h2>{initialData ? "Editar permiso" : "Crear permiso"}</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Modelo"
          name="model"
          value={form.model}
          onChange={handleChange}
          placeholder="ussers, roles, etc."
          required
        />

        <Input
          label="URL"
          name="url"
          value={form.url}
          onChange={handleChange}
          placeholder="/users"
          required
        />

        <Input
          label="Método"
          name="method"
          value={form.method}
          onChange={handleChange}
          placeholder="GET, POST, PUT, DELETE"
          required
        />

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