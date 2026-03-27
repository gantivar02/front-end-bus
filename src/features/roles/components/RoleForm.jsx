import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import styles from "./RoleForm.module.css";

const initialForm = {
  name: "",
  description: "",
};

export default function RoleForm({
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
        description: initialData.description || "",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card>
      <h2>{initialData ? "Editar rol" : "Crear rol"}</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <Input
          label="Descripción"
          name="description"
          value={form.description}
          onChange={handleChange}
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