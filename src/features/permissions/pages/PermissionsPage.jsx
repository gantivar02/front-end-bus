import { useEffect, useState } from "react";
import Table from "../../../components/ui/Table";
import ActionButtons from "../../../components/ui/ActionButtons";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import PermissionForm from "../components/PermissionForm";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../services/permissionsService";
import {
  formatPermissionLabel,
  getEntityId,
  getPermissionAction,
  getPermissionDescription,
  getPermissionMethod,
  getPermissionModule,
  getPermissionName,
  getPermissionUrl,
  matchesPermissionSearch,
} from "../utils/permissionUtils";
import styles from "./PermissionsPage.module.css";

const methodToneMap = {
  GET: "methodGet",
  POST: "methodPost",
  PUT: "methodPut",
  PATCH: "methodPatch",
  DELETE: "methodDelete",
};

function getMethodToneClass(method) {
  return styles[methodToneMap[method] || "methodDefault"];
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
      setError(
        currentError.response?.data?.message ||
          "No se pudieron cargar los permisos"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleOpenCreate = () => {
    setSelectedPermission(null);
    setShowForm(true);
  };

  const handleEdit = (permission) => {
    setSelectedPermission(permission);
    setShowForm(true);
  };

  const handleCancel = () => {
    setSelectedPermission(null);
    setShowForm(false);
  };

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
      setError(
        currentError.response?.data?.message ||
          "No fue posible guardar el permiso"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (permission) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el permiso ${getPermissionName(permission)}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deletePermission(getEntityId(permission));
      await loadPermissions();
    } catch (currentError) {
      setError(
        currentError.response?.data?.message ||
          "No fue posible eliminar el permiso"
      );
    }
  };

  const filteredPermissions = permissions.filter((permission) =>
    matchesPermissionSearch(permission, searchTerm)
  );

  const totalPermissions = permissions.length;
  const moduleCount = new Set(permissions.map(getPermissionModule)).size;
  const actionCount = new Set(permissions.map(getPermissionAction)).size;
  const visibleCount = filteredPermissions.length;

  const columns = [
    {
      key: "permission",
      title: "Permiso",
      render: (permission) => (
        <div className={styles.permissionCell}>
          <div className={styles.permissionHeader}>
            <strong className={styles.permissionName}>
              {getPermissionName(permission)}
            </strong>
            <span className={styles.permissionId}>
              ID {getEntityId(permission)}
            </span>
          </div>
          <p className={styles.permissionDescription}>
            {getPermissionDescription(permission)}
          </p>
        </div>
      ),
    },
    {
      key: "scope",
      title: "Alcance",
      render: (permission) => (
        <div className={styles.scopeCell}>
          <span className={styles.scopeChip}>
            {formatPermissionLabel(getPermissionModule(permission))}
          </span>
          <span className={`${styles.scopeChip} ${styles.scopeChipAccent}`}>
            {formatPermissionLabel(getPermissionAction(permission))}
          </span>
        </div>
      ),
    },
    {
      key: "endpoint",
      title: "Endpoint",
      render: (permission) => {
        const method = getPermissionMethod(permission);

        return (
          <div className={styles.endpointCell}>
            <span className={`${styles.methodBadge} ${getMethodToneClass(method)}`}>
              {method}
            </span>
            <code className={styles.endpointCode}>
              {getPermissionUrl(permission)}
            </code>
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "Acciones",
      render: (permission) => (
        <ActionButtons
          onEdit={() => handleEdit(permission)}
          onDelete={() => handleDelete(permission)}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Permisos"
        description="Gestiona nombre, alcance, descripcion y endpoint de cada permiso del sistema."
        action={
          <Button variant="primary" onClick={handleOpenCreate}>
            Nuevo permiso
          </Button>
        }
      />

      {error && <p className={styles.errorBanner}>{error}</p>}

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Permisos registrados</span>
          <strong className={styles.statValue}>{totalPermissions}</strong>
        </article>

        <article className={styles.statCard}>
          <span className={styles.statLabel}>Modulos cubiertos</span>
          <strong className={styles.statValue}>{moduleCount}</strong>
        </article>

        <article className={styles.statCard}>
          <span className={styles.statLabel}>Acciones distintas</span>
          <strong className={styles.statValue}>{actionCount}</strong>
        </article>

        <article className={styles.statCard}>
          <span className={styles.statLabel}>Resultados visibles</span>
          <strong className={styles.statValue}>{visibleCount}</strong>
        </article>
      </section>

      {showForm && (
        <PermissionForm
          key={selectedPermission ? getEntityId(selectedPermission) : "create"}
          initialData={selectedPermission}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      )}

      <section className={styles.listSection}>
        <div className={styles.toolbar}>
          <div>
            <h2 className={styles.toolbarTitle}>Catalogo de permisos</h2>
            <p className={styles.toolbarText}>
              Busca por nombre, modulo, accion, descripcion, metodo o URL.
            </p>
          </div>

          <div className={styles.searchBox}>
            <label className={styles.searchLabel} htmlFor="permission-search">
              Buscar permiso
            </label>
            <input
              id="permission-search"
              className={styles.searchInput}
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Ej. users_delete, /api/users/**, delete..."
            />
          </div>
        </div>

        {loading ? (
          <p className={styles.statusText}>Cargando permisos...</p>
        ) : (
          <div className={styles.tableWrap}>
            <Table
              columns={columns}
              data={filteredPermissions}
              emptyMessage="No hay permisos que coincidan con la busqueda."
            />
          </div>
        )}
      </section>
    </div>
  );
}
