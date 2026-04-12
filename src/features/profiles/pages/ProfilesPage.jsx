import { useEffect, useState } from "react";
import Table from "../../../components/ui/Table";
import ActionButtons from "../../../components/ui/ActionButtons";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import ProfileForm from "../components/ProfileForm";
import { getUsers } from "../../users/services/usersService";
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
} from "../services/profilesService";
import styles from "./ProfilesPage.module.css";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [profilesData, usersData] = await Promise.all([
        getProfiles(),
        getUsers(),
      ]);

      setProfiles(profilesData);
      setUsers(usersData);
    } catch {
      setError("No se pudieron cargar los perfiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedProfile(null);
    setShowForm(true);
  };

  const handleEdit = (profile) => {
    setSelectedProfile(profile);
    setShowForm(true);
  };

  const handleCancel = () => {
    setSelectedProfile(null);
    setShowForm(false);
  };

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (selectedProfile) {
        const profileId = selectedProfile.id || selectedProfile._id;
        await updateProfile(profileId, formData);
      } else {
        await createProfile(formData);
      }

      setShowForm(false);
      setSelectedProfile(null);
      await loadData();
    } catch {
      setError("No fue posible guardar el perfil");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (profile) => {
    const profileId = profile.id || profile._id;
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el perfil de ${
        profile.user?.name || "este usuario"
      }?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteProfile(profileId);
      await loadData();
    } catch {
      setError("No fue posible eliminar el perfil");
    }
  };

  const columns = [
    {
      key: "id",
      title: "ID",
      render: (profile) => profile.id || profile._id,
    },
    {
      key: "address",
      title: "Direccion",
      render: (profile) => profile.address || "Sin direccion",
    },
    {
      key: "phone",
      title: "Telefono",
      render: (profile) => profile.phone || "Sin telefono",
    },
    {
      key: "photo",
      title: "Foto",
      render: (profile) => profile.photo || "Sin foto",
    },
    {
      key: "user",
      title: "Usuario",
      render: (profile) =>
        profile.user
          ? `${profile.user.name || "Sin nombre"} - ${profile.user.email || ""}`
          : "Sin usuario",
    },
    {
      key: "actions",
      title: "Acciones",
      render: (profile) => (
        <ActionButtons
          onEdit={() => handleEdit(profile)}
          onDelete={() => handleDelete(profile)}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Perfiles"
        description="Gestiona los perfiles de usuario."
        action={
          <Button variant="primary" onClick={handleOpenCreate}>
            Nuevo perfil
          </Button>
        }
      />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {showForm && (
        <ProfileForm
          key={selectedProfile ? selectedProfile.id || selectedProfile._id : "create"}
          initialData={selectedProfile}
          users={users}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      )}

      {loading ? (
        <p>Cargando perfiles...</p>
      ) : (
        <Table
          columns={columns}
          data={profiles}
          emptyMessage="No hay perfiles registrados."
        />
      )}
    </div>
  );
}
