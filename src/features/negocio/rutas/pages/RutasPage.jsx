import { useEffect, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegDataTable,
  NegSectionHeader,
} from "../../../../components/negocio";
import RutaForm from "../components/RutaForm";
import RutaMapa from "../components/RutaMapa";
import {
  listRutas,
  listParaderos,
  createRutaConParaderos,
  updateRuta,
  deleteRuta,
  getRutaParaMapa,
} from "../rutasService";

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMinutes(min) {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return `${h}h${m > 0 ? ` ${m}min` : ""}`;
}

function buildColumns(onEdit, onDeleteRequest, onVerMapa) {
  return [
    {
      key: "codigo_ruta",
      header: "Código",
      width: 130,
      render: (r) => (
        <span className="font-mono text-xs bg-neg-primary-container/40 text-neg-on-primary-container px-2 py-0.5 rounded-md">
          {r.codigo_ruta ?? "—"}
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
      key: "tarifa",
      header: "Tarifa",
      width: 120,
      render: (r) => (
        <span className="text-neg-on-surface-variant">{formatCOP(r.tarifa)}</span>
      ),
    },
    {
      key: "tiempo_estimado_min",
      header: "Tiempo estimado",
      width: 140,
      render: (r) => (
        <span className="text-neg-on-surface-variant">
          {formatMinutes(r.tiempo_estimado_min)}
        </span>
      ),
    },
    {
      key: "paraderos",
      header: "Paradas",
      width: 90,
      render: (r) => {
        const count = r.rutaParaderos?.length ?? "—";
        return (
          <span className="inline-flex items-center gap-1 text-neg-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-[14px]">stop_circle</span>
            {count}
          </span>
        );
      },
    },
    {
      key: "acciones",
      header: "",
      width: 110,
      render: (r) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onVerMapa(r); }}
            className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-primary hover:bg-neg-primary/10 transition-colors"
            title="Ver en mapa"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
          </button>
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

export default function RutasPage() {
  const [rutas, setRutas] = useState([]);
  const [paraderosCatalog, setParaderosCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [mapaRuta, setMapaRuta] = useState(null);
  const [loadingMapa, setLoadingMapa] = useState(false);

  const load = () => {
    setLoading(true);
    setListError(null);
    Promise.all([listRutas(), listParaderos()])
      .then(([rutasData, paraderosData]) => {
        setRutas(Array.isArray(rutasData) ? rutasData : []);
        setParaderosCatalog(Array.isArray(paraderosData) ? paraderosData : []);
      })
      .catch((err) =>
        setListError(err?.response?.data?.message ?? "No se pudo cargar la información."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingRuta(null);
    setSubmitError(null);
    setShowForm(true);
  };

  const openEdit = (ruta) => {
    setEditingRuta(ruta);
    setSubmitError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRuta(null);
    setSubmitError(null);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingRuta) {
        await updateRuta(editingRuta.id, payload);
      } else {
        await createRutaConParaderos(payload);
      }
      closeForm();
      load();
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? "No se pudo guardar la ruta.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRuta(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setListError(err?.response?.data?.message ?? "No se pudo eliminar la ruta.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const openMapa = async (ruta) => {
    setLoadingMapa(true);
    setMapaRuta(null);
    try {
      const data = await getRutaParaMapa(ruta.id);
      setMapaRuta(data);
    } catch {
      setListError("No se pudo cargar el mapa de la ruta.");
    } finally {
      setLoadingMapa(false);
    }
  };

  const columns = buildColumns(openEdit, setDeleteTarget, openMapa);

  return (
    <div className="max-w-5xl">
      <NegPageHeader
        eyebrow="HU 2-009"
        title="Administración de rutas"
        subtitle="Creá y gestioná las rutas del sistema de transporte con sus paraderos y tarifas."
        actions={
          <NegButton icon="add_road" onClick={openCreate}>
            Nueva ruta
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
            Cargando rutas...
          </div>
        ) : (
          <NegDataTable
            columns={columns}
            rows={rutas}
            keyField="id"
            emptyMessage="No hay rutas registradas. Creá la primera con el botón Nueva ruta."
          />
        )}
      </NegCard>

      {/* Modal mapa */}
      {(loadingMapa || mapaRuta) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setMapaRuta(null); setLoadingMapa(false); }}
          />
          <div className="relative z-10 w-full max-w-3xl bg-neg-surface rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neg-outline-variant/40 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-neg-primary">
                  Mapa de ruta
                </p>
                <h2 className="font-headline text-xl font-bold text-neg-on-surface">
                  {mapaRuta?.nombre ?? "Cargando..."}
                </h2>
                {mapaRuta?.codigo_ruta && (
                  <p className="text-xs font-mono text-neg-on-surface-variant mt-0.5">
                    {mapaRuta.codigo_ruta}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setMapaRuta(null); setLoadingMapa(false); }}
                className="p-2 rounded-full hover:bg-neg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-neg-on-surface-variant">close</span>
              </button>
            </div>

            <div className="p-6">
              {loadingMapa ? (
                <div className="py-16 text-center text-neg-on-surface-variant text-sm">
                  <span
                    className="material-symbols-outlined text-[36px] block mb-2 animate-spin"
                    style={{ animationDuration: "1s" }}
                  >
                    progress_activity
                  </span>
                  Cargando mapa...
                </div>
              ) : (
                <RutaMapa rutaParaderos={mapaRuta?.rutaParaderos ?? []} />
              )}
            </div>
          </div>
        </div>
      )}

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
                    {editingRuta ? "Editar ruta" : "HU 2-009"}
                  </p>
                  <h2 className="font-headline text-2xl font-bold text-neg-on-surface">
                    {editingRuta ? editingRuta.nombre : "Crear nueva ruta"}
                  </h2>
                  {editingRuta && (
                    <p className="text-xs font-mono text-neg-on-surface-variant mt-0.5">
                      {editingRuta.codigo_ruta}
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

              <RutaForm
                initialData={editingRuta}
                paraderosCatalog={paraderosCatalog}
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
                ¿Eliminar esta ruta?
              </h3>
              <p className="text-sm text-neg-on-surface-variant mb-1">
                Se eliminará <strong className="text-neg-on-surface">{deleteTarget.nombre}</strong>
              </p>
              <p className="text-xs font-mono text-neg-on-surface-variant mb-6">
                {deleteTarget.codigo_ruta}
              </p>
              <p className="text-xs text-neg-on-surface-variant mb-6">
                Se eliminarán también todos los paraderos asociados. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <NegButton variant="outlined" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  Cancelar
                </NegButton>
                <NegButton variant="danger" icon={deleting ? "hourglass_top" : "delete"} onClick={handleDelete} disabled={deleting}>
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
