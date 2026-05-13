import { useEffect, useState } from "react";
import {
  NegButton,
  NegCard,
  NegDataTable,
  NegPageHeader,
} from "../../../../components/negocio";
import TurnoForm from "../components/TurnoForm";
import {
  createTurno,
  deleteTurno,
  listTurnos,
  updateTurno,
} from "../turnosService";

const ESTADO_STYLES = {
  programado: "bg-neg-primary-container text-neg-on-primary-container",
  en_curso: "bg-green-100 text-green-800",
  completado: "bg-neg-surface-container text-neg-on-surface-variant",
  cancelado: "bg-neg-error-container/60 text-neg-error",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatConductor(turno) {
  const persona = turno?.conductor?.persona ?? {};
  const nombre = `${persona.nombre ?? ""} ${persona.apellido ?? ""}`.trim();
  return nombre || `Conductor #${turno?.conductor_id ?? "—"}`;
}

function buildColumns(onEdit, onDeleteRequest) {
  return [
    {
      key: "conductor",
      header: "Conductor",
      render: (turno) => (
        <div>
          <span className="font-medium text-neg-on-surface text-sm">
            {formatConductor(turno)}
          </span>
          {turno?.conductor?.persona?.email && (
            <span className="block text-xs text-neg-on-surface-variant">
              {turno.conductor.persona.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "bus",
      header: "Bus",
      width: 150,
      render: (turno) => (
        <div>
          <span className="font-mono text-xs bg-neg-primary-container/40 text-neg-on-primary-container px-2 py-0.5 rounded-md">
            {turno?.bus?.placa ?? "—"}
          </span>
          {turno?.bus?.modelo && (
            <span className="block text-xs text-neg-on-surface-variant mt-1">
              {turno.bus.modelo}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "inicio",
      header: "Inicio programado",
      width: 170,
      render: (turno) => (
        <span className="text-sm text-neg-on-surface">
          {formatDateTime(turno.inicio)}
        </span>
      ),
    },
    {
      key: "fin",
      header: "Fin programado",
      width: 170,
      render: (turno) => (
        <span className="text-sm text-neg-on-surface-variant">
          {formatDateTime(turno.fin)}
        </span>
      ),
    },
    {
      key: "inicio_real",
      header: "Inicio real",
      width: 150,
      render: (turno) => (
        <span className="text-sm text-neg-on-surface">
          {formatDateTime(turno.fecha_inicio_real)}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      width: 120,
      render: (turno) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            ESTADO_STYLES[turno.estado] ??
            "bg-neg-surface-container text-neg-on-surface-variant"
          }`}
        >
          {turno.estado}
        </span>
      ),
    },
    {
      key: "observaciones",
      header: "Observaciones",
      render: (turno) => (
        <span className="text-sm text-neg-on-surface-variant line-clamp-2">
          {turno.observaciones || "—"}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "",
      width: 90,
      render: (turno) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(turno);
            }}
            className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-primary hover:bg-neg-primary/10 transition-colors"
            title="Editar"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(turno);
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

export default function TurnosPage() {
  const [turnos, setTurnos] = useState([]);
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
    listTurnos()
      .then((data) => setTurnos(Array.isArray(data) ? data : []))
      .catch((err) =>
        setListError(
          err?.response?.data?.message ?? "No se pudieron cargar los turnos.",
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
        await updateTurno(editingItem.id, payload);
      } else {
        await createTurno(payload);
      }
      closeForm();
      load();
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ?? "No se pudo guardar el turno.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTurno(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setListError(
        err?.response?.data?.message ?? "No se pudo eliminar el turno.",
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
        eyebrow="Apoyo operativo"
        title="Gestión de turnos"
        subtitle="Crea y ajusta turnos programados para que los conductores puedan iniciar su jornada desde la app."
        actions={
          <NegButton icon="add" onClick={openCreate}>
            Nuevo turno
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
            Cargando turnos...
          </div>
        ) : (
          <NegDataTable
            columns={columns}
            rows={turnos}
            keyField="id"
            emptyMessage="No hay turnos registrados. Crea el primero para que un conductor pueda iniciar jornada."
          />
        )}
      </NegCard>

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
                    {editingItem ? "Editar turno" : "Conductores y turnos"}
                  </p>
                  <h2 className="font-headline text-2xl font-bold text-neg-on-surface">
                    {editingItem
                      ? `Turno #${editingItem.id}`
                      : "Nuevo turno programado"}
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
                  <span className="material-symbols-outlined text-[16px]">
                    error
                  </span>
                  {submitError}
                </div>
              )}

              <TurnoForm
                initialData={editingItem}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <NegCard
            variant="elevated"
            padding="lg"
            className="relative z-10 w-full max-w-sm"
          >
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-neg-error-container flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px] text-neg-on-error-container">
                  delete_forever
                </span>
              </div>
              <h3 className="font-headline text-xl font-bold text-neg-on-surface mb-2">
                ¿Eliminar este turno?
              </h3>
              <p className="text-sm text-neg-on-surface-variant mb-1">
                Conductor:{" "}
                <strong className="text-neg-on-surface">
                  {formatConductor(deleteTarget)}
                </strong>
              </p>
              <p className="text-sm text-neg-on-surface-variant mb-4">
                Bus:{" "}
                <strong className="text-neg-on-surface">
                  {deleteTarget.bus?.placa ?? "Sin bus"}
                </strong>
              </p>
              <p className="text-xs text-neg-on-surface-variant mb-6">
                El conductor dejará de tener este turno disponible para iniciar
                su jornada desde la aplicación.
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
