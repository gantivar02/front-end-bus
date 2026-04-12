import { useEffect, useState } from "react";
import UserForm from "../components/UserForm";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/usersService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const avatarPalette = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h + name.charCodeAt(i)) % avatarPalette.length;
  return avatarPalette[h];
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleOpenCreate = () => { setSelectedUser(null); setShowForm(true); };
  const handleEdit = (user) => { setSelectedUser(user); setShowForm(true); };
  const handleCancel = () => { setSelectedUser(null); setShowForm(false); };

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError("");
      if (selectedUser) {
        const userId = selectedUser.id || selectedUser._id;
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await updateUser(userId, payload);
      } else {
        await createUser(formData);
      }
      setShowForm(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data) ? err.response.data.map((e) => e.defaultMessage).join(", ") : null) ||
        "No fue posible guardar el usuario";
      setError(backendMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (user) => {
    const userId = user.id || user._id;
    if (!window.confirm(`¿Seguro que deseas eliminar a ${user.name}?`)) return;
    try {
      setError("");
      await deleteUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "No fue posible eliminar el usuario");
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">Usuarios</h2>
          <p className="text-on-surface-variant mt-2 max-w-lg">Gestiona el control de acceso e identidad de todos los operadores del sistema.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Nuevo usuario</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-error-container/30 text-error rounded-xl text-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-surface-container-low rounded-xl p-5 mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-outline text-lg">group</span>
          Total: <span className="text-primary font-bold ml-1">{users.length}</span> usuarios registrados
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline text-sm">filter_list</span>
          <span className="text-xs text-on-surface-variant">Todos los usuarios</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Usuario</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Email</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 block animate-pulse">hourglass_empty</span>
                  Cargando usuarios...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 block">group_off</span>
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((user, idx) => {
                const userId = user.id || user._id;
                const initials = getInitials(user.name);
                const color = avatarColor(user.name || "");
                const isEven = idx % 2 === 0;
                return (
                  <tr key={userId} className={`${isEven ? "bg-surface-container-lowest" : "bg-surface-container-low/40"} hover:bg-blue-50/30 transition-colors group`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{user.name}</div>
                          <div className="text-xs text-on-surface-variant">{userId?.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">{user.email}</td>
                    <td className="px-6 py-5">
                      <code className="text-xs font-mono bg-surface-container-low px-2 py-1 rounded text-on-surface-variant">{userId}</code>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Eliminar"
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
        {/* Table footer */}
        <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant/10">
          <div className="text-sm text-on-surface-variant">
            Mostrando <span className="font-bold">{users.length}</span> usuario{users.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Modal overlay for UserForm */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_-4px_rgba(25,28,30,0.15)] overflow-hidden">
            <div className="px-8 pt-8 pb-2">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-on-surface font-headline">
                  {selectedUser ? "Editar usuario" : "Nuevo usuario"}
                </h2>
                <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-sm text-on-surface-variant mb-6">
                {selectedUser ? "Modifica los datos del operador." : "Registra un nuevo operador en el sistema."}
              </p>
            </div>
            <div className="px-8 pb-8">
              <UserForm
                initialData={selectedUser}
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
