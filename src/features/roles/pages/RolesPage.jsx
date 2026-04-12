import { useEffect, useState } from "react";
import RoleForm from "../components/RoleForm";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../services/rolesService";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
    } catch {
      setError("No se pudieron cargar los roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      if (selectedRole) {
        await updateRole(selectedRole.id, formData);
      } else {
        await createRole(formData);
      }
      setShowForm(false);
      setSelectedRole(null);
      await loadRoles();
    } catch {
      setError("Error al guardar rol");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`¿Eliminar rol ${role.name}?`)) return;
    await deleteRole(role.id);
    loadRoles();
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setSelectedRole(null);
    setShowForm(false);
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Roles</h2>
          <p className="text-on-surface-variant mt-1 font-medium">Gestiona los roles del sistema de seguridad.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Nuevo rol</span>
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
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Rol</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Descripción</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">ID</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 block animate-pulse">hourglass_empty</span>
                  Cargando roles...
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 block">security</span>
                  No hay roles registrados.
                </td>
              </tr>
            ) : (
              roles.map((role, idx) => {
                const roleId = role.id || role._id;
                const isEven = idx % 2 === 0;
                return (
                  <tr key={roleId} className={`${isEven ? "bg-surface-container-lowest" : "bg-surface-container-low/40"} hover:bg-blue-50/30 transition-colors group`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        </div>
                        <span className="font-bold text-on-surface">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">{role.description || "—"}</td>
                    <td className="px-6 py-5">
                      <code className="text-xs font-mono bg-surface-container-low px-2 py-1 rounded text-on-surface-variant">{roleId}</code>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
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
        <div className="bg-surface-container-low px-6 py-4 flex items-center border-t border-outline-variant/10">
          <div className="text-sm text-on-surface-variant">
            Total: <span className="font-bold text-primary">{roles.length}</span> rol{roles.length !== 1 ? "es" : ""}
          </div>
        </div>
      </div>

      {/* Modal for RoleForm */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_-4px_rgba(25,28,30,0.15)] overflow-hidden">
            <div className="px-8 pt-8 pb-2">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-on-surface font-headline">
                  {selectedRole ? "Editar rol" : "Nuevo rol"}
                </h2>
                <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-sm text-on-surface-variant mb-6">
                {selectedRole ? "Modifica el nombre o descripción del rol." : "Define un nuevo rol de seguridad."}
              </p>
            </div>
            <div className="px-8 pb-8">
              <RoleForm
                initialData={selectedRole}
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
