import { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import styles from "./UserForm.module.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

export default function UserForm({
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
        email: initialData.email || "",
        password: "",
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
      <h2>{initialData ? "Editar usuario" : "Crear usuario"}</h2>

      <form onSubmit={handleSubmit} className={styles.userForm}>
        <Input
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nombre del usuario"
          required
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
          required
        />

        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder={initialData ? "Solo si deseas cambiarla" : "********"}
          required={!initialData}
        />

        <div className={styles.formActions}>
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