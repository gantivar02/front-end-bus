import { useEffect, useState } from "react";
import ProfileForm from "../components/ProfileForm";
import { getUsers } from "../../users/services/usersService";
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
} from "../services/profilesService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

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
      const [profilesData, usersData] = await Promise.all([getProfiles(), getUsers()]);
      setProfiles(profilesData);
      setUsers(usersData);
    } catch {
      setError("No se pudieron cargar los perfiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => { setSelectedProfile(null); setShowForm(true); };
  const handleEdit = (profile) => { setSelectedProfile(profile); setShowForm(true); };
  const handleCancel = () => { setSelectedProfile(null); setShowForm(false); };

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
    if (!window.confirm(`¿Seguro que deseas eliminar el perfil de ${profile.user?.name || "este usuario"}?`)) return;
    try {
      setError("");
      await deleteProfile(profileId);
      await loadData();
    } catch {
      setError("No fue posible eliminar el perfil");
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Perfiles</h2>
          <p className="text-on-surface-variant mt-1 font-medium">Gestiona la información de perfil extendida de los usuarios.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span>Nuevo perfil</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-error-container/30 text-error rounded-xl text-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Usuario</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Dirección</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Teléfono</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Foto</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 block animate-pulse">hourglass_empty</span>
                  Cargando perfiles...
                </td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 block">account_circle</span>
                  No hay perfiles registrados.
                </td>
              </tr>
            ) : (
              profiles.map((profile, idx) => {
                const profileId = profile.id || profile._id;
                const userName = profile.user?.name || "Sin usuario";
                const userEmail = profile.user?.email || "";
                const initials = getInitials(userName);
                const isEven = idx % 2 === 0;
                return (
                  <tr key={profileId} className={`${isEven ? "bg-surface-container-lowest" : "bg-surface-container-low/40"} hover:bg-blue-50/30 transition-colors group`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {profile.photo ? (
                          <img src={profile.photo} alt={userName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-on-surface">{userName}</p>
                          <p className="text-xs text-on-surface-variant">{userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">{profile.address || "—"}</td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">{profile.phone || "—"}</td>
                    <td className="px-6 py-5">
                      {profile.photo ? (
                        <a href={profile.photo} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Ver foto
                        </a>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(profile)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(profile)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant/10">
          <span className="text-sm text-on-surface-variant">
            Total: <span className="font-bold text-primary">{profiles.length}</span> perfil{profiles.length !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      {/* Modal for ProfileForm */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_-4px_rgba(25,28,30,0.15)] overflow-hidden my-6">
            <div className="px-8 pt-8 pb-2 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-on-surface font-headline">
                  {selectedProfile ? "Editar perfil" : "Nuevo perfil"}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">Información extendida del usuario.</p>
              </div>
              <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-8 pb-8">
              <ProfileForm
                key={selectedProfile ? selectedProfile.id || selectedProfile._id : "create"}
                initialData={selectedProfile}
                users={users}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={formLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
