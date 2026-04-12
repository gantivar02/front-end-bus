import { useEffect, useState } from "react";
import { getRoles } from "../../roles/services/rolesService";
import { getPermissions } from "../../permissions/services/permissionsService";
import {
  getEntityId,
  getPermissionId,
  getPermissionData,
  getPermissionMethod,
  getPermissionUrl,
  getPermissionModule,
  getPermissionName,
} from "../../permissions/utils/permissionUtils";
import {
  getPermissionsByRole,
  assignPermissionToRole,
  removeRolePermission,
} from "../services/rolePermissionService";

const methodStyles = {
  GET:    "bg-green-100 text-green-700",
  POST:   "bg-blue-100 text-blue-700",
  PUT:    "bg-orange-100 text-orange-700",
  PATCH:  "bg-violet-100 text-violet-700",
  DELETE: "bg-red-100 text-red-700",
};

function MethodBadge({ method }) {
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-tighter ${methodStyles[method] || "bg-surface-container text-on-surface-variant"}`}>
      {method}
    </span>
  );
}

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionsByRole, setPermissionsByRole] = useState({});
  const [expandedRoleId, setExpandedRoleId] = useState("");
  const [loadingRoleId, setLoadingRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPermId, setSelectedPermId] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");

  const expandedRole = roles.find((r) => getEntityId(r) === expandedRoleId) || null;
  const expandedPermissions = permissionsByRole[expandedRoleId] || [];
  const assignedPermissionIds = expandedPermissions.map(getPermissionId).filter(Boolean);

  const availablePermissions = permissions.filter(
    (p) => !assignedPermissionIds.includes(getEntityId(p))
  );

  const filteredAvailable = availablePermissions.filter((p) => {
    const q = permissionSearch.toLowerCase();
    return (
      getPermissionName(p).toLowerCase().includes(q) ||
      getPermissionUrl(p).toLowerCase().includes(q) ||
      getPermissionModule(p).toLowerCase().includes(q) ||
      getPermissionMethod(p).toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [rolesData, permissionsData] = await Promise.all([getRoles(), getPermissions()]);
        setRoles(rolesData);
        setPermissions(permissionsData);
      } catch (currentError) {
        setError(currentError.response?.data?.message || "No se pudieron cargar roles y permisos");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const fetchRolePermissions = async (roleId) => {
    setLoadingRoleId(roleId);
    try {
      const data = await getPermissionsByRole(roleId);
      setPermissionsByRole((prev) => ({ ...prev, [roleId]: data }));
    } catch (currentError) {
      setError(currentError.response?.data?.message || "No se pudieron cargar los permisos del rol");
    } finally {
      setLoadingRoleId("");
    }
  };

  const handleSelectRole = async (roleId) => {
    setError("");
    setSelectedPermId("");
    if (expandedRoleId === roleId) { setExpandedRoleId(""); return; }
    setExpandedRoleId(roleId);
    if (!permissionsByRole[roleId]) await fetchRolePermissions(roleId);
  };

  const refreshExpandedRole = async () => {
    if (!expandedRoleId) return;
    const data = await getPermissionsByRole(expandedRoleId);
    setPermissionsByRole((prev) => ({ ...prev, [expandedRoleId]: data }));
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    if (!expandedRoleId || !selectedPermId) return;
    try {
      setAssignLoading(true);
      setError("");
      await assignPermissionToRole(expandedRoleId, selectedPermId);
      await refreshExpandedRole();
      setSelectedPermId("");
      setPermissionSearch("");
    } catch (currentError) {
      setError(currentError.response?.data?.message || "No fue posible asignar el permiso al rol");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemove = async (rolePermission) => {
    const permission = getPermissionData(rolePermission);
    const permissionId = getPermissionId(rolePermission);
    if (!window.confirm(`¿Seguro que deseas quitar el permiso "${getPermissionName(permission)}" del rol?`)) return;
    if (!expandedRoleId || !permissionId) { setError("No se pudo identificar el permiso"); return; }
    try {
      setError("");
      await removeRolePermission(expandedRoleId, permissionId);
      await refreshExpandedRole();
    } catch (currentError) {
      setError(currentError.response?.data?.message || "No fue posible quitar el permiso del rol");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block mb-3 animate-pulse">hourglass_empty</span>
          <p className="text-on-surface-variant">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">Access Control Matrix</h2>
        <p className="text-on-surface-variant mt-1 text-sm">Mapea permisos granulares a roles organizacionales dentro del ecosistema de microservicios.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-error-container/30 text-error rounded-xl text-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left: Roles accordion */}
        <section className="col-span-12 lg:col-span-3 space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-3">Roles operativos</h3>
          {roles.length === 0 ? (
            <div className="text-sm text-on-surface-variant p-4 bg-surface-container-low rounded-xl text-center">
              No hay roles registrados.
            </div>
          ) : (
            roles.map((role) => {
              const roleId = getEntityId(role);
              const isActive = expandedRoleId === roleId;
              const isLoadingThis = loadingRoleId === roleId;
              const rolePerms = permissionsByRole[roleId];

              return (
                <button
                  key={roleId}
                  onClick={() => handleSelectRole(roleId)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    isActive
                      ? "bg-surface-container-lowest shadow-sm border-l-4 border-primary"
                      : "bg-surface-container-low hover:bg-surface-container-high border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-sm ${isActive ? "text-primary" : "text-outline"}`}
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        verified_user
                      </span>
                      <span className={`font-semibold text-sm ${isActive ? "text-on-surface" : "text-on-surface-variant"}`}>{role.name}</span>
                    </div>
                    <span className="material-symbols-outlined text-outline text-sm">
                      {isActive ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                  {isActive && role.description && (
                    <p className="text-[11px] text-on-surface-variant mt-3 pt-3 border-t border-outline-variant/15 leading-relaxed">{role.description}</p>
                  )}
                  {isActive && rolePerms !== undefined && !isLoadingThis && (
                    <p className="text-[10px] text-primary font-bold mt-2">
                      {rolePerms.length} permiso{rolePerms.length !== 1 ? "s" : ""} asignado{rolePerms.length !== 1 ? "s" : ""}
                    </p>
                  )}
                  {isLoadingThis && (
                    <p className="text-[10px] text-on-surface-variant mt-2 animate-pulse">Cargando...</p>
                  )}
                </button>
              );
            })
          )}
        </section>

        {/* Center: Assigned permissions chips */}
        <section className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-8 rounded-2xl shadow-[0px_12px_32px_-4px_rgba(25,28,30,0.04)] min-h-[420px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold font-headline text-on-surface">Permisos asignados</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Rol: <span className="text-primary font-bold">{expandedRole?.name || "Selecciona un rol"}</span>
              </p>
            </div>
            {expandedRole && (
              <span className="bg-green-600/10 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                {expandedPermissions.length} permisos
              </span>
            )}
          </div>

          {!expandedRole ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">rule</span>
              <p className="text-sm text-on-surface-variant">Selecciona un rol de la lista para ver sus permisos asignados.</p>
            </div>
          ) : loadingRoleId === expandedRoleId ? (
            <div className="flex items-center justify-center h-32">
              <span className="material-symbols-outlined text-2xl text-on-surface-variant/40 animate-pulse">hourglass_empty</span>
            </div>
          ) : expandedPermissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">lock_open</span>
              <p className="text-sm text-on-surface-variant">Este rol no tiene permisos asignados.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group by module */}
              {(() => {
                const grouped = {};
                expandedPermissions.forEach((item) => {
                  const perm = getPermissionData(item);
                  const mod = getPermissionModule(perm) || "General";
                  if (!grouped[mod]) grouped[mod] = [];
                  grouped[mod].push(item);
                });
                return Object.entries(grouped).map(([mod, items]) => (
                  <div key={mod}>
                    <h4 className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {mod}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => {
                        const perm = getPermissionData(item);
                        return (
                          <span
                            key={getPermissionId(item)}
                            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-100"
                          >
                            <MethodBadge method={getPermissionMethod(perm)} />
                            {getPermissionName(perm)}
                            <button
                              onClick={() => handleRemove(item)}
                              className="ml-0.5 hover:text-red-500 transition-colors"
                              title="Quitar permiso"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </section>

        {/* Right: Assign form */}
        <section className="col-span-12 lg:col-span-4 bg-surface-container-low p-8 rounded-2xl space-y-6">
          <h3 className="text-xl font-bold font-headline text-on-surface">Asignar permiso</h3>

          <form onSubmit={handleAssign} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">Rol destino</label>
              <div className="relative">
                <select
                  className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none appearance-none font-medium text-on-surface"
                  value={expandedRoleId}
                  onChange={(e) => handleSelectRole(e.target.value)}
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((r) => (
                    <option key={getEntityId(r)} value={getEntityId(r)}>{r.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none text-sm">unfold_more</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-2">Permiso a asignar</label>
              {!expandedRole ? (
                <p className="text-xs text-on-surface-variant p-3 bg-surface-container-lowest rounded-xl">Selecciona primero un rol</p>
              ) : availablePermissions.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-3 bg-surface-container-lowest rounded-xl">Todos los permisos ya están asignados</p>
              ) : (
                <div className="space-y-2">
                  {/* Search input */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">search</span>
                    <input
                      type="text"
                      value={permissionSearch}
                      onChange={(e) => { setPermissionSearch(e.target.value); setSelectedPermId(""); }}
                      placeholder="Buscar permiso..."
                      className="w-full pl-9 pr-4 py-2.5 bg-surface-container-highest border-none rounded-xl text-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                    />
                    {permissionSearch && (
                      <button
                        type="button"
                        onClick={() => { setPermissionSearch(""); setSelectedPermId(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                  {/* Results list */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {filteredAvailable.length === 0 ? (
                      <p className="text-xs text-on-surface-variant p-3 bg-surface-container-lowest rounded-xl text-center">Sin coincidencias</p>
                    ) : (
                      filteredAvailable.map((p) => {
                        const id = getEntityId(p);
                        const isSelected = selectedPermId === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSelectedPermId(id)}
                            className={`w-full text-left flex items-center gap-2.5 p-3 rounded-xl transition-all ${
                              isSelected
                                ? "bg-primary/10 ring-1 ring-primary/40"
                                : "bg-surface-container-lowest hover:bg-surface-container-high"
                            }`}
                          >
                            <MethodBadge method={getPermissionMethod(p)} />
                            <div className="overflow-hidden">
                              <p className={`text-xs font-semibold truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>{getPermissionName(p)}</p>
                              <p className="text-[10px] text-on-surface-variant truncate">{getPermissionUrl(p)}</p>
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined text-primary text-sm ml-auto flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={assignLoading || !expandedRole || !selectedPermId}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {assignLoading ? "Asignando..." : "Aplicar cambios"}
            </button>
          </form>

          <div className="p-4 bg-secondary-container/20 rounded-xl border border-secondary-container/30 flex gap-3">
            <span className="material-symbols-outlined text-on-secondary-container text-sm mt-0.5">info</span>
            <p className="text-xs text-on-secondary-container leading-relaxed">
              Los cambios en permisos de roles se registran y propagan en tiempo real. La propagación puede tardar hasta 2 minutos.
            </p>
          </div>
        </section>
      </div>

      {/* Footer status pods */}
      <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "shield", color: "bg-primary/10 text-primary", label: "Health Status", value: "Policy Service Active" },
          { icon: "sync", color: "bg-green-600/10 text-green-600", label: "Última sincronización", value: "Hace unos segundos" },
          { icon: "history_edu", color: "bg-secondary/10 text-secondary", label: "Total de roles", value: `${roles.length} roles configurados` },
        ].map((pod) => (
          <div key={pod.label} className="bg-surface-container-low p-5 rounded-2xl flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${pod.color} flex items-center justify-center`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{pod.icon}</span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">{pod.label}</p>
              <p className="font-headline font-bold text-on-surface">{pod.value}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
