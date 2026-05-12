import { useEffect, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegDataTable,
} from "../../../../components/negocio";
import BusForm from "../components/BusForm";
import { listBuses, createBus, updateBus, deleteBus } from "../busesService";
import { resolveStaticUrl } from "../../../../services/negocioApi";

const ESTADO_STYLES = {
  operativo: "bg-green-100 text-green-800",
  mantenimiento: "bg-yellow-100 text-yellow-800",
  fuera_de_servicio: "bg-neg-error-container/60 text-neg-error",
};

const ESTADO_LABELS = {
  operativo: "Operativo",
  mantenimiento: "Mantenimiento",
  fuera_de_servicio: "Fuera de servicio",
};

function buildColumns(onEdit, onDeleteRequest, onShowQr) {
  return [
    {
      key: "bus",
      header: "Bus",
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.foto_url ? (
            <img
              src={resolveStaticUrl(r.foto_url)}
              alt={r.placa}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-neg-outline-variant"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-neg-primary-container/40 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px] text-neg-on-primary-container">
                directions_bus
              </span>
            </div>
          )}
          <div>
            <span className="font-mono text-sm font-bold text-neg-on-surface">{r.placa}</span>
            <span className="block text-xs text-neg-on-surface-variant">{r.modelo}</span>
          </div>
        </div>
      ),
    },
    {
      key: "empresa",
      header: "Empresa",
      render: (r) => (
        <span className="text-sm text-neg-on-surface">{r.empresa?.nombre ?? "—"}</span>
      ),
    },
    {
      key: "anio",
      header: "Año",
      width: 70,
      render: (r) => <span className="text-sm text-neg-on-surface-variant">{r.anio}</span>,
    },
    {
      key: "capacidad",
      header: "Capacidad",
      width: 160,
      render: (r) => (
        <div>
          <span className="text-sm font-medium text-neg-on-surface">
            {r.capacidad_maxima} pax
          </span>
          <span className="block text-xs text-neg-on-surface-variant">
            {r.capacidad_sentados} sent. · {r.capacidad_parados} par.
          </span>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      width: 130,
      render: (r) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            ESTADO_STYLES[r.estado] ?? "bg-neg-surface-container text-neg-on-surface-variant"
          }`}
        >
          {ESTADO_LABELS[r.estado] ?? r.estado}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "",
      width: 110,
      render: (r) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowQr(r);
            }}
            className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-primary hover:bg-neg-primary/10 transition-colors"
            title="Ver código QR"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code</span>
          </button>
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

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [qrBus, setQrBus] = useState(null);

  const load = () => {
    setLoading(true);
    setListError(null);
    listBuses()
      .then((data) => setBuses(Array.isArray(data) ? data : []))
      .catch((err) =>
        setListError(err?.response?.data?.message ?? "No se pudo cargar los buses."),
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

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingItem) {
        await updateBus(editingItem.id, formData);
      } else {
        await createBus(formData);
      }
      closeForm();
      load();
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? "No se pudo guardar el bus.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBus(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setListError(err?.response?.data?.message ?? "No se pudo eliminar el bus.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(openEdit, setDeleteTarget, setQrBus);

  return (
    <div className="max-w-6xl">
      <NegPageHeader
        eyebrow="HU 2-012"
        title="Flota de buses"
        subtitle="Registrá y gestioná los buses de la empresa. Cada bus recibe un código QR único para validaciones rápidas."
        actions={
          <NegButton icon="add" onClick={openCreate}>
            Nuevo bus
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
            Cargando buses...
          </div>
        ) : (
          <NegDataTable
            columns={columns}
            rows={buses}
            keyField="id"
            emptyMessage="No hay buses registrados. Creá el primero con el botón Nuevo bus."
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
                    {editingItem ? "Editar bus" : "HU 2-012"}
                  </p>
                  <h2 className="font-headline text-2xl font-bold text-neg-on-surface">
                    {editingItem ? `Bus ${editingItem.placa}` : "Nuevo bus"}
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

              <BusForm
                initialData={editingItem}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setQrBus(null)}
          />
          <NegCard variant="elevated" padding="lg" className="relative z-10 w-full max-w-xs">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-neg-primary mb-1">
                Código QR único
              </p>
              <h3 className="font-headline text-xl font-bold text-neg-on-surface mb-1">
                {qrBus.placa}
              </h3>
              <p className="text-xs text-neg-on-surface-variant mb-4">
                {qrBus.modelo} · {qrBus.anio}
              </p>
              <div className="flex items-center justify-center mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrBus.codigo_qr)}`}
                  alt={`QR ${qrBus.placa}`}
                  className="w-48 h-48 rounded-xl border border-neg-outline-variant"
                />
              </div>
              <p className="text-[10px] font-mono text-neg-on-surface-variant break-all mb-5 px-2">
                {qrBus.codigo_qr}
              </p>
              <NegButton variant="outlined" onClick={() => setQrBus(null)}>
                Cerrar
              </NegButton>
            </div>
          </NegCard>
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
                ¿Eliminar este bus?
              </h3>
              <p className="text-sm text-neg-on-surface-variant mb-1">
                Placa:{" "}
                <strong className="text-neg-on-surface">{deleteTarget.placa}</strong>
              </p>
              <p className="text-sm text-neg-on-surface-variant mb-4">
                Modelo:{" "}
                <strong className="text-neg-on-surface">{deleteTarget.modelo}</strong>
              </p>
              <p className="text-xs text-neg-on-surface-variant mb-6">
                Si este bus tiene programaciones o turnos asociados, la eliminación será
                rechazada.
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
