import { useEffect, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegDataTable,
} from "../../../../components/negocio";
import ParaderoForm from "../components/ParaderoForm";
import {
  listParaderos,
  createParadero,
  updateParadero,
  deleteParadero,
} from "../paraderosService";

const TIPO_LABELS = {
  terminal: "Terminal",
  intermedio: "Intermedio",
  escolar: "Escolar",
  hospital: "Hospital / Salud",
  universidad: "Universidad",
  comercial: "Comercial",
  residencial: "Residencial",
};

function buildColumns(onEdit, onDeleteRequest) {
  return [
    {
      key: "codigo_paradero",
      header: "Código",
      width: 130,
      render: (r) => (
        <span className="font-mono text-xs bg-neg-primary-container/40 text-neg-on-primary-container px-2 py-0.5 rounded-md">
          {r.codigo_paradero}
        </span>
      ),
    },
    {
      key: "nombre",
      header: "Nombre",
      render: (r) => (
        <span className="font-medium text-neg-on-surface">{r.nombre}</span>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      width: 140,
      render: (r) => (
        <span className="text-neg-on-surface-variant">
          {TIPO_LABELS[r.tipo] ?? r.tipo}
        </span>
      ),
    },
    {
      key: "ubicacion",
      header: "Coordenadas",
      width: 180,
      render: (r) =>
        r.latitud != null && r.longitud != null ? (
          <span className="inline-flex items-center gap-1 text-xs text-neg-primary font-mono">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            {Number(r.latitud).toFixed(4)}, {Number(r.longitud).toFixed(4)}
          </span>
        ) : (
          <span className="text-xs text-neg-on-surface-variant/50 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">location_off</span>
            Sin coordenadas
          </span>
        ),
    },
    {
      key: "acciones",
      header: "",
      width: 90,
      render: (r) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(r); }}
            className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-primary hover:bg-neg-primary/10 transition-colors"
            title="Editar"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(r); }}
            className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-error hover:bg-neg-error/10 transition-colors"
            title="Eliminar"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      ),
    },
  ];
}

export default function ParaderosPage() {
  const [paraderos, setParaderos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingParadero, setEditingParadero] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setListError(null);
    listParaderos()
      .then((data) => setParaderos(Array.isArray(data) ? data : []))
      .catch((err) =>
        setListError(err?.response?.data?.message ?? "No se pudo cargar los paraderos."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingParadero(null);
    setSubmitError(null);
    setShowForm(true);
  };

  const openEdit = (paradero) => {
    setEditingParadero(paradero);
    setSubmitError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingParadero(null);
    setSubmitError(null);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingParadero) {
        await updateParadero(editingParadero.id, payload);
      } else {
        await createParadero(payload);
      }
      closeForm();
      load();
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? "No se pudo guardar el paradero.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteParadero(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setListError(err?.response?.data?.message ?? "No se pudo eliminar el paradero.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(openEdit, setDeleteTarget);

  return (
    <div className="max-w-5xl">
      <NegPageHeader
        eyebrow="HU 2-010"
        title="Administración de paraderos"
        subtitle="Registrá y gestioná los paraderos del sistema. Podés fijar su ubicación en el mapa."
        actions={
          <NegButton icon="add_location" onClick={openCreate}>
            Nuevo paradero
          </NegButton>
        }
      />

      {listError && (
        <NegCard className="mb-5 border border-neg-error" padding="sm">
          <div className="flex items-center gap-2 text-sm text-neg-error font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {listError}
          </div>
        </NegCard>
      )}

      <NegCard padding="none">
        {loading ? (
          <div className="py-14 text-center text-neg-on-surface-variant text-sm">
            <span
              className="material-symbols-outlined text-[36px] block mb-2 animate-spin"
              style={{ animationDuration: "1s" }}
            >
              progress_activity
            </span>
            Cargando paraderos...
          </div>
        ) : (
          <NegDataTable
            columns={columns}
            rows={paraderos}
            keyField="id"
            emptyMessage="No hay paraderos registrados. Creá el primero con el botón Nuevo paradero."
          />
        )}
      </NegCard>

      {/* Panel lateral — formulario */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeForm}
          />
          <div className="relative ml-auto w-full max-w-2xl bg-neg-surface h-full overflow-y-auto shadow-2xl">
            <div className="px-8 py-7">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-neg-primary mb-0.5">
                    {editingParadero ? "Editar paradero" : "HU 2-010"}
                  </p>
                  <h2 className="font-headline text-2xl font-bold text-neg-on-surface">
                    {editingParadero ? editingParadero.nombre : "Registrar paradero"}
                  </h2>
                  {editingParadero && (
                    <p className="text-xs font-mono text-neg-on-surface-variant mt-0.5">
                      {editingParadero.codigo_paradero}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeForm}
                  className="p-2 rounded-full hover:bg-neg-surface-container transition-colors mt-1"
                >
                  <span className="material-symbols-outlined text-neg-on-surface-variant">close</span>
                </button>
              </div>

              {submitError && (
                <div className="mb-5 px-4 py-3 rounded-xl border border-neg-error bg-neg-error-container/30 flex items-center gap-2 text-neg-error text-sm">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {submitError}
                </div>
              )}

              <ParaderoForm
                initialData={editingParadero}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <NegCard variant="elevated" padding="lg" className="relative z-10 w-full max-w-sm">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-neg-error-container flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px] text-neg-on-error-container">
                  delete_forever
                </span>
              </div>
              <h3 className="font-headline text-xl font-bold text-neg-on-surface mb-2">
                ¿Eliminar este paradero?
              </h3>
              <p className="text-sm text-neg-on-surface-variant mb-1">
                Se eliminará <strong className="text-neg-on-surface">{deleteTarget.nombre}</strong>
              </p>
              <p className="text-xs font-mono text-neg-on-surface-variant mb-4">
                {deleteTarget.codigo_paradero}
              </p>
              <p className="text-xs text-neg-on-surface-variant mb-6">
                Si este paradero está asignado a alguna ruta, la eliminación será rechazada.
              </p>
              <div className="flex gap-3 justify-center">
                <NegButton variant="outlined" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  Cancelar
                </NegButton>
                <NegButton
                  variant="danger"
                  icon={deleting ? "hourglass_top" : "delete"}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </NegButton>
              </div>
            </div>
          </NegCard>
        </div>
      )}
    </div>
  );
}
