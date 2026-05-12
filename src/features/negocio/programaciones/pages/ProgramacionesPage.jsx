import { useEffect, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegDataTable,
} from "../../../../components/negocio";
import ProgramacionForm from "../components/ProgramacionForm";
import {
  listProgramaciones,
  createProgramacion,
  updateProgramacion,
  deleteProgramacion,
} from "../programacionesService";

const RECURRENCIA_LABELS = {
  unica: "Única",
  lunes_viernes: "L–V",
  fines_semana: "Fin de semana",
  diaria: "Diaria",
};

const ESTADO_STYLES = {
  programada: "bg-neg-primary-container text-neg-on-primary-container",
  en_curso: "bg-green-100 text-green-800",
  completada: "bg-neg-surface-container text-neg-on-surface-variant",
  cancelada: "bg-neg-error-container/60 text-neg-error",
};

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildColumns(onEdit, onDeleteRequest) {
  return [
    {
      key: "ruta",
      header: "Ruta",
      render: (r) => (
        <div>
          <span className="font-medium text-neg-on-surface text-sm">
            {r.ruta?.nombre ?? "—"}
          </span>
          {r.ruta?.codigo_ruta && (
            <span className="block text-xs font-mono text-neg-on-surface-variant">
              {r.ruta.codigo_ruta}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "bus",
      header: "Bus",
      width: 120,
      render: (r) => (
        <span className="font-mono text-xs bg-neg-primary-container/40 text-neg-on-primary-container px-2 py-0.5 rounded-md">
          {r.bus?.placa ?? "—"}
        </span>
      ),
    },
    {
      key: "fecha",
      header: "Fecha",
      width: 130,
      render: (r) => (
        <span className="text-sm text-neg-on-surface">{formatFecha(r.hora_salida)}</span>
      ),
    },
    {
      key: "salida",
      header: "Salida",
      width: 80,
      render: (r) => (
        <span className="text-sm font-medium text-neg-on-surface">
          {formatHora(r.hora_salida)}
        </span>
      ),
    },
    {
      key: "llegada",
      header: "Llegada est.",
      width: 100,
      render: (r) => (
        <span className="text-sm text-neg-on-surface-variant">
          {formatHora(r.hora_llegada_estimada)}
        </span>
      ),
    },
    {
      key: "recurrencia",
      header: "Recurrencia",
      width: 120,
      render: (r) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-neg-surface-container text-neg-on-surface-variant font-medium">
          {RECURRENCIA_LABELS[r.recurrencia] ?? r.recurrencia}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      width: 110,
      render: (r) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            ESTADO_STYLES[r.estado] ?? "bg-neg-surface-container text-neg-on-surface-variant"
          }`}
        >
          {r.estado}
        </span>
      ),
    },
    {
      key: "margen",
      header: "Margen",
      width: 80,
      render: (r) => (
        <span className="text-xs text-neg-on-surface-variant">
          ±{r.margen_tolerancia_min} min
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
            onClick={(e) => {
              e.stopPropagation();
              onEdit(r);
            }}
            className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-primary hover:bg-neg-primary/10 transition-colors"
            title="Editar"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(r);
            }}
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

export default function ProgramacionesPage() {
  const [programaciones, setProgramaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setListError(null);
    listProgramaciones()
      .then((data) => setProgramaciones(Array.isArray(data) ? data : []))
      .catch((err) =>
        setListError(
          err?.response?.data?.message ?? "No se pudo cargar las programaciones.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setSubmitError(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setSubmitError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setSubmitError(null);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingItem) {
        await updateProgramacion(editingItem.id, payload);
      } else {
        await createProgramacion(payload);
      }
      closeForm();
      load();
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ?? "No se pudo guardar la programación.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProgramacion(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setListError(
        err?.response?.data?.message ?? "No se pudo eliminar la programación.",
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(openEdit, setDeleteTarget);

  return (
    <div className="max-w-6xl">
      <NegPageHeader
        eyebrow="HU 2-011"
        title="Programación de rutas"
        subtitle="Asigná buses a rutas en fechas y horarios específicos. Validá disponibilidad del bus y conductor."
        actions={
          <NegButton icon="add" onClick={openCreate}>
            Nueva programación
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
            Cargando programaciones...
          </div>
        ) : (
          <NegDataTable
            columns={columns}
            rows={programaciones}
            keyField="id"
            emptyMessage="No hay programaciones registradas. Creá la primera con el botón Nueva programación."
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
                    {editingItem ? "Editar programación" : "HU 2-011"}
                  </p>
                  <h2 className="font-headline text-2xl font-bold text-neg-on-surface">
                    {editingItem
                      ? `Programación #${editingItem.id}`
                      : "Nueva programación"}
                  </h2>
                </div>
                <button
                  onClick={closeForm}
                  className="p-2 rounded-full hover:bg-neg-surface-container transition-colors mt-1"
                >
                  <span className="material-symbols-outlined text-neg-on-surface-variant">
                    close
                  </span>
                </button>
              </div>

              {submitError && (
                <div className="mb-5 px-4 py-3 rounded-xl border border-neg-error bg-neg-error-container/30 flex items-center gap-2 text-neg-error text-sm">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {submitError}
                </div>
              )}

              <ProgramacionForm
                initialData={editingItem}
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
                ¿Eliminar esta programación?
              </h3>
              <p className="text-sm text-neg-on-surface-variant mb-1">
                Bus:{" "}
                <strong className="text-neg-on-surface">{deleteTarget.bus?.placa}</strong>
              </p>
              <p className="text-sm text-neg-on-surface-variant mb-4">
                Ruta:{" "}
                <strong className="text-neg-on-surface">{deleteTarget.ruta?.nombre}</strong>
              </p>
              <p className="text-xs text-neg-on-surface-variant mb-6">
                Si esta programación tiene boletos asociados, la eliminación será rechazada.
              </p>
              <div className="flex gap-3 justify-center">
                <NegButton
                  variant="outlined"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
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
