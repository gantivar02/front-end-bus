import { useState } from "react";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import styles from "./ProfileForm.module.css";

function createInitialForm(initialData) {
  return {
    address: initialData?.address || "",
    phone: initialData?.phone || "",
    photo: initialData?.photo || "",
    userId: initialData?.user?.id || initialData?.user?._id || "",
  };
}

export default function ProfileForm({
  initialData,
  users,
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

    const payload = {
      address: form.address.trim(),
      phone: form.phone.trim(),
      photo: form.photo.trim(),
      user: {
        id: form.userId,
      },
    };

    onSubmit(payload);
  };

  return (
    <Card>
      <h2>{initialData ? "Editar perfil" : "Crear perfil"}</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Direccion"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Direccion completa"
          required
        />

        <Input
          label="Telefono"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="3001234567"
        />

        <Input
          label="Foto"
          name="photo"
          value={form.photo}
          onChange={handleChange}
          placeholder="URL o nombre de la foto"
        />

        <div className={styles.field}>
          <label htmlFor="userId">Usuario</label>
          <select
            id="userId"
            name="userId"
            value={form.userId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un usuario</option>
            {users.map((user) => (
              <option key={user.id || user._id} value={user.id || user._id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
        </div>

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
