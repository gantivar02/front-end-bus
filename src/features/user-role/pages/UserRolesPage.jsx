import { useEffect, useState, useMemo } from "react";
import { getUsers } from "../../users/services/usersService";
import { getRoles } from "../../roles/services/rolesService";
import {
  getRolesByUser,
  assignRoleToUser,
  removeUserRole,
} from "../services/userRoleService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function UserRolesPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch {
      setError("No se pudieron cargar usuarios y roles");
    } finally {
      setLoading(false);
    }
  };

  const loadUserRoles = async (userId) => {
    if (!userId) { setUserRoles([]); return; }
    try {
      setError("");
      const data = await getRolesByUser(userId);
      setUserRoles(data);
    } catch {
      setError("No se pudieron cargar los roles del usuario");
    }
  };

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { loadUserRoles(selectedUserId); }, [selectedUserId]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const assignedRoleIds = useMemo(
    () => new Set(userRoles.map((ur) => ur.role?.id || ur.role?._id)),
    [userRoles]
  );

  const availableRoles = useMemo(
    () => roles.filter((r) => !assignedRoleIds.has(r.id || r._id)),
    [roles, assignedRoleIds]
  );

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3500);
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !selectedRoleId) return;
    try {
      setAssignLoading(true);
      setError("");
      await assignRoleToUser(selectedUserId, selectedRoleId);
      await loadUserRoles(selectedUserId);
      setSelectedRoleId("");
      showSuccess("Rol asignado correctamente.");
    } catch {
      setError("No fue posible asignar el rol al usuario");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemove = async (userRole) => {
    const relationId = userRole.id || userRole._id;
    if (!window.confirm("¿Seguro que deseas quitar este rol del usuario?")) return;
    try {
      setError("");
      await removeUserRole(relationId);
      await loadUserRoles(selectedUserId);
      showSuccess("Rol removido correctamente.");
    } catch {
      setError("No fue posible eliminar la relación");
    }
  };

  const selectedUser = users.find((u) => (u.id || u._id) === selectedUserId);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Usuario - Roles</h2>
        <p className="text-on-surface-variant mt-1 font-medium">Asigna y gestiona los roles de los usuarios del sistema.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-error-container/30 text-error rounded-xl text-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block animate-pulse">hourglass_empty</span>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Left: User search + list */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Seleccionar usuario</h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-lg">search</span>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedUserId(""); }}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">No se encontraron usuarios.</p>
              ) : (
                filteredUsers.map((user) => {
                  const uid = user.id || user._id;
                  const isSelected = selectedUserId === uid;
                  const initials = getInitials(user.name);
                  return (
                    <button
                      key={uid}
                      onClick={() => setSelectedUserId(uid)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-surface-container-low border border-transparent"}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                        {initials}
                      </div>
                      <div className="overflow-hidden">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>{user.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Center: Assigned roles */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 min-h-[320px]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">Roles asignados</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {selectedUser ? <span>Usuario: <strong className="text-primary">{selectedUser.name}</strong></span> : "Selecciona un usuario"}
                </p>
              </div>
              {userRoles.length > 0 && (
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{userRoles.length}</span>
              )}
            </div>

            {!selectedUser ? (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">admin_panel_settings</span>
                <p className="text-sm text-on-surface-variant">Selecciona un usuario para ver sus roles.</p>
              </div>
            ) : userRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">person_off</span>
                <p className="text-sm text-on-surface-variant">Este usuario no tiene roles asignados.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userRoles.map((item) => {
                  const itemId = item.id || item._id;
                  return (
                    <div key={itemId} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl group">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-semibold text-on-surface">{item.role?.name || "Rol desconocido"}</span>
                      </div>
                      <button
                        onClick={() => handleRemove(item)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-on-surface-variant hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        title="Quitar rol"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  );
                })}
                {userRoles.length > 1 && (
                  <p className="text-xs text-on-surface-variant/60 text-center pt-1">Los permisos se acumulan entre todos los roles asignados.</p>
                )}
              </div>
            )}
          </div>

          {/* Right: Assign form */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-2xl space-y-5">
            <h3 className="text-lg font-bold font-headline text-on-surface">Asignar rol</h3>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">Usuario destino</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none appearance-none font-medium text-on-surface"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Selecciona un usuario</option>
                    {users.map((u) => (
                      <option key={u.id || u._id} value={u.id || u._id}>{u.name} — {u.email}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-sm">unfold_more</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">Rol a asignar</label>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {!selectedUserId ? (
                    <p className="text-xs text-on-surface-variant p-3 bg-surface-container-lowest rounded-xl">Selecciona primero un usuario</p>
                  ) : availableRoles.length === 0 ? (
                    <p className="text-xs text-on-surface-variant p-3 bg-surface-container-lowest rounded-xl">Todos los roles ya están asignados</p>
                  ) : (
                    availableRoles.map((r) => {
                      const rid = r.id || r._id;
                      return (
                        <label key={rid} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
                          <input
                            type="radio"
                            name="selectedRole"
                            value={rid}
                            checked={selectedRoleId === rid}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-xs font-semibold text-on-surface">{r.name}</span>
                            {r.description && <p className="text-[10px] text-on-surface-variant mt-0.5">{r.description}</p>}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={assignLoading || !selectedUserId || !selectedRoleId}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
              >
                {assignLoading ? "Asignando..." : "Asignar rol"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
