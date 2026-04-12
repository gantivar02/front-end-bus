import { useEffect, useState } from "react";
import PermissionForm from "../components/PermissionForm";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../services/permissionsService";
import {
  getEntityId,
  getPermissionAction,
  getPermissionDescription,
  getPermissionMethod,
  getPermissionModule,
  getPermissionName,
  getPermissionUrl,
  matchesPermissionSearch,
} from "../utils/permissionUtils";

const methodStyles = {
  GET:    "bg-green-100 text-green-700 border border-green-200",
  POST:   "bg-blue-100 text-blue-700 border border-blue-200",
  PUT:    "bg-orange-100 text-orange-700 border border-orange-200",
  PATCH:  "bg-violet-100 text-violet-700 border border-violet-200",
  DELETE: "bg-red-100 text-red-700 border border-red-200",
};

function MethodBadge({ method }) {
  return (
    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-tighter ${methodStyles[method] || "bg-surface-container text-on-surface-variant"}`}>
      {method}
    </span>
  );
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPermissions();
      setPermissions(data);
    } catch (currentError) {
      setError(currentError.response?.data?.message || "No se pudieron cargar los permisos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPermissions(); }, []);

  const handleOpenCreate = () => { setSelectedPermission(null); setShowForm(true); };
  const handleEdit = (p) => { setSelectedPermission(p); setShowForm(true); };
  const handleCancel = () => { setSelectedPermission(null); setShowForm(false); };

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError("");
      if (selectedPermission) {
        await updatePermission(getEntityId(selectedPermission), formData);
      } else {
        await createPermission(formData);
      }
      setShowForm(false);
      setSelectedPermission(null);
      await loadPermissions();
    } catch (currentError) {
      setError(currentError.response?.data?.message || "No fue posible guardar el permiso");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (permission) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el permiso ${getPermissionName(permission)}?`)) return;
    try {
      setError("");
      await deletePermission(getEntityId(permission));
      await loadPermissions();
    } catch (currentError) {
      setError(currentError.response?.data?.message || "No fue posible eliminar el permiso");
    }
  };

  const filteredPermissions = permissions.filter((p) => matchesPermissionSearch(p, searchTerm));
  const moduleCount = new Set(permissions.map(getPermissionModule)).size;
  const actionCount = new Set(permissions.map(getPermissionAction)).size;

  const statCards = [
    { label: "Total permisos", value: permissions.length, icon: "vpn_key", trend: null },
    { label: "Módulos cubiertos", value: moduleCount, icon: "inventory_2", trend: null },
    { label: "Acciones distintas", value: actionCount, icon: "bolt", trend: null },
    { label: "Resultados visibles", value: filteredPermissions.length, icon: "filter_list", trend: null },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Gestión de Permisos</h2>
          <p className="text-on-surface-variant mt-1 font-medium">Control de acceso granular sobre la arquitectura de microservicios.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Nuevo permiso</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 bg-error-container/30 text-error rounded-xl text-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10">
            <p className="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">{card.label}</p>
            <h3 className="text-2xl font-bold font-headline text-on-surface">{card.value}</h3>
            <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant/60">
              <span className="material-symbols-outlined text-sm">{card.icon}</span>
              <span>Sistema activo</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table container */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        {/* Toolbar */}
        <div className="px-6 py-5 bg-surface-container-lowest flex items-center justify-between">
          <h4 className="font-bold text-lg text-on-surface">Permisos del sistema</h4>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-lg">search</span>
              </div>
              <input
                className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, módulo, URL..."
              />
            </div>
            <button className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">ID</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Permiso / URL</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Método</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Módulo</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-2 block animate-pulse">hourglass_empty</span>
                    Cargando permisos...
                  </td>
                </tr>
              ) : filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-2 block">search_off</span>
                    No hay permisos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredPermissions.map((permission, idx) => {
                  const id = getEntityId(permission);
                  const method = getPermissionMethod(permission);
                  const isEven = idx % 2 === 0;
                  return (
                    <tr key={id} className={`${isEven ? "bg-surface-container-lowest" : "bg-surface-container-low"} hover:bg-blue-50/30 transition-colors group`}>
                      <td className="px-6 py-5 text-xs font-mono text-on-surface-variant/60">
                        #{String(id).slice(0, 8)}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-on-surface">{getPermissionName(permission)}</span>
                        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                          {getPermissionUrl(permission)}
                          {getPermissionDescription(permission) && ` — ${getPermissionDescription(permission)}`}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <MethodBadge method={method} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-sm font-medium text-on-surface-variant">{getPermissionModule(permission)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(permission)}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(permission)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-all"
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
        </div>

        {/* Pagination footer */}
        <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/20 flex justify-between items-center">
          <span className="text-xs text-on-surface-variant font-medium">
            Mostrando {filteredPermissions.length} de {permissions.length} permisos
          </span>
        </div>
      </div>

      {/* Info bento */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-primary rounded-2xl p-8 text-on-primary flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-2xl font-bold font-headline mb-2">¿Necesitas restringir un módulo?</h4>
            <p className="text-blue-100 max-w-md text-sm">El sistema de permisos global te permite definir restricciones basadas en el origen de la solicitud, nivel de usuario y verificación de identidad.</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
            <span className="material-symbols-outlined text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          </div>
        </div>
        <div className="md:col-span-4 bg-surface-container-highest rounded-2xl p-8 border border-outline-variant/10">
          <span className="material-symbols-outlined text-primary mb-4 block">analytics</span>
          <h4 className="text-lg font-bold font-headline mb-4">Estado del sistema</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-on-surface-variant">Latencia Auth</span>
                <span className="text-xs font-bold text-green-600">Estable</span>
              </div>
              <div className="w-full bg-surface-container-high h-1 rounded-full">
                <div className="bg-green-500 h-1 rounded-full w-[94%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-on-surface-variant">Throughput</span>
                <span className="text-xs font-bold text-primary">Óptimo</span>
              </div>
              <div className="w-full bg-surface-container-high h-1 rounded-full">
                <div className="bg-primary h-1 rounded-full w-[78%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for PermissionForm */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_-4px_rgba(25,28,30,0.15)] overflow-hidden my-6">
            <div className="px-8 pt-8 pb-2 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-on-surface font-headline">
                  {selectedPermission ? "Editar permiso" : "Nuevo permiso"}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">Define el nombre, alcance y endpoint que protege.</p>
              </div>
              <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-8 pb-8">
              <PermissionForm
                key={selectedPermission ? getEntityId(selectedPermission) : "create"}
                initialData={selectedPermission}
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
