import { useEffect, useMemo, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegDataTable,
  NegEmptyState,
  NegFilterBar,
  NegInput,
  NegChip,
  NegSectionHeader,
} from "../../../../components/negocio";
import { useAuth } from "../../../../context/AuthContext";
import { formatCurrency } from "../../_utils/format";
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

function formatMinutes(min) {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return `${h}h${m > 0 ? ` ${m}min` : ""}`;
}

function buildColumns({
  canManage,
  onEdit,
  onDeleteRequest,
  onSelect,
  selectedRutaId,
}) {
  return [
    {
      key: "nombre",
      header: "Ruta",
      render: (r) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neg-on-surface">{r.nombre}</span>
            {selectedRutaId === r.id && (
              <NegChip tone="primary" icon="visibility">
                Seleccionada
              </NegChip>
            )}
          </div>
          <p className="text-xs text-neg-on-surface-variant leading-relaxed">
            {r.descripcion?.trim() || "Sin descripción registrada."}
          </p>
        </div>
      ),
    },
    {
      key: "tarifa",
      header: "Tarifa",
      width: 120,
      render: (r) => (
        <span className="text-neg-on-surface-variant">
          {formatCurrency(r.tarifa)}
        </span>
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
      key: "codigo_ruta",
      header: "Código",
      width: 130,
      render: (r) => {
        return (
          <span className="font-mono text-xs bg-neg-primary-container/40 text-neg-on-primary-container px-2 py-0.5 rounded-md">
            {r.codigo_ruta ?? "—"}
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
            onClick={(e) => {
              e.stopPropagation();
              onSelect(r);
            }}
            className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-primary hover:bg-neg-primary/10 transition-colors"
            title="Ver detalle"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          {canManage && (
            <>
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
            </>
          )}
        </div>
      ),
    },
  ];
}

export default function RutasPage() {
  const { isAdmin } = useAuth();
  const [rutas, setRutas] = useState([]);
  const [paraderosCatalog, setParaderosCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [search, setSearch] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [selectedRutaId, setSelectedRutaId] = useState(null);
  const [rutaDetalle, setRutaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFiltroNombre(search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = (preferredSelectedId = null) => {
    setLoading(true);
    setListError(null);
    Promise.all([listRutas({ nombre: filtroNombre }), listParaderos()])
      .then(([rutasData, paraderosData]) => {
        const rutasList = Array.isArray(rutasData) ? rutasData : [];
        setRutas(rutasList);
        setParaderosCatalog(Array.isArray(paraderosData) ? paraderosData : []);
        if (rutasList.length === 0) {
          setSelectedRutaId(null);
          return;
        }

        const candidato =
          preferredSelectedId != null &&
          rutasList.some((ruta) => ruta.id === preferredSelectedId)
            ? preferredSelectedId
            : rutasList.some((ruta) => ruta.id === selectedRutaId)
              ? selectedRutaId
              : rutasList[0].id;

        setSelectedRutaId(candidato);
      })
      .catch((err) =>
        setListError(err?.response?.data?.message ?? "No se pudo cargar la información."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filtroNombre]);

  useEffect(() => {
    if (selectedRutaId == null) {
      setRutaDetalle(null);
      setDetailError(null);
      return;
    }

    let alive = true;
    setLoadingDetalle(true);
    setDetailError(null);

    getRutaParaMapa(selectedRutaId)
      .then((data) => {
        if (alive) setRutaDetalle(data);
      })
      .catch((err) => {
        if (!alive) return;
        setRutaDetalle(null);
        setDetailError(
          err?.response?.data?.message ?? "No se pudo cargar el detalle de la ruta.",
        );
      })
      .finally(() => {
        if (alive) setLoadingDetalle(false);
      });

    return () => {
      alive = false;
    };
  }, [selectedRutaId]);

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
      let savedRuta;
      if (editingRuta) {
        savedRuta = await updateRuta(editingRuta.id, payload);
      } else {
        savedRuta = await createRutaConParaderos(payload);
      }
      closeForm();
      load(savedRuta?.id ?? null);
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
      const deletedId = deleteTarget.id;
      setDeleteTarget(null);
      load(selectedRutaId === deletedId ? null : selectedRutaId);
    } catch (err) {
      setListError(err?.response?.data?.message ?? "No se pudo eliminar la ruta.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns({
    canManage: isAdmin,
    onEdit: openEdit,
    onDeleteRequest: setDeleteTarget,
    onSelect: (ruta) => setSelectedRutaId(ruta.id),
    selectedRutaId,
  });

  const rutaSeleccionada = useMemo(
    () =>
      (rutaDetalle?.id ?? null) === selectedRutaId
        ? rutaDetalle
        : rutas.find((ruta) => ruta.id === selectedRutaId) ?? null,
    [rutaDetalle, rutas, selectedRutaId],
  );

  return (
    <div className="max-w-5xl">
      <NegPageHeader
        eyebrow="HU 2-001"
        title="Rutas disponibles"
        subtitle="Consulta las rutas del sistema, su tarifa, descripción y recorrido estimado."
        actions={
          isAdmin ? (
            <NegButton icon="add_road" onClick={openCreate}>
              Nueva ruta
            </NegButton>
          ) : null
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

      <NegFilterBar className="mb-5">
        <NegInput
          label="Filtrar por nombre"
          name="nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ej. Centro, Norte, Terminal..."
          iconStart="search"
          hint={`${rutas.length} ruta${rutas.length === 1 ? "" : "s"} en el listado`}
        />
      </NegFilterBar>

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
            emptyMessage="No hay rutas disponibles con el filtro actual."
            onRowClick={(ruta) => setSelectedRutaId(ruta.id)}
          />
        )}
      </NegCard>

      <NegCard className="mt-5">
        <NegSectionHeader
          title="Detalle de la ruta"
          hint="Selecciona una fila del listado para ver el recorrido completo."
        />

        {!selectedRutaId ? (
          <NegEmptyState
            icon="route"
            title="Sin ruta seleccionada"
            description="Elige una ruta del listado para ver sus paraderos en el mapa."
          />
        ) : loadingDetalle && !rutaSeleccionada ? (
          <NegEmptyState
            icon="hourglass_top"
            title="Cargando detalle..."
            description="Un momento mientras preparamos el recorrido."
          />
        ) : detailError ? (
          <NegEmptyState
            icon="error"
            title="No se pudo cargar la ruta"
            description={detailError}
          />
        ) : !rutaSeleccionada ? (
          <NegEmptyState
            icon="search_off"
            title="Ruta no disponible"
            description="La ruta seleccionada ya no está disponible en el listado actual."
          />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <NegCard variant="subtle" padding="sm">
                <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                  Ruta
                </p>
                <p className="font-headline text-lg font-bold text-neg-on-surface mt-1">
                  {rutaSeleccionada.nombre}
                </p>
                <p className="text-xs font-mono text-neg-on-surface-variant mt-1">
                  {rutaSeleccionada.codigo_ruta ?? "Sin código"}
                </p>
              </NegCard>
              <NegCard variant="subtle" padding="sm">
                <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                  Tarifa
                </p>
                <p className="font-headline text-lg font-bold text-neg-on-surface mt-1">
                  {formatCurrency(rutaSeleccionada.tarifa)}
                </p>
              </NegCard>
              <NegCard variant="subtle" padding="sm">
                <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                  Tiempo estimado total
                </p>
                <p className="font-headline text-lg font-bold text-neg-on-surface mt-1">
                  {formatMinutes(rutaSeleccionada.tiempo_estimado_min)}
                </p>
              </NegCard>
              <NegCard variant="subtle" padding="sm">
                <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
                  Paraderos
                </p>
                <p className="font-headline text-lg font-bold text-neg-on-surface mt-1">
                  {rutaSeleccionada.rutaParaderos?.length ?? 0}
                </p>
              </NegCard>
            </div>

            <div>
              <p className="text-sm font-semibold text-neg-on-surface mb-1">
                Descripción
              </p>
              <p className="text-sm text-neg-on-surface-variant leading-relaxed">
                {rutaSeleccionada.descripcion?.trim() ||
                  "Esta ruta no tiene una descripción registrada."}
              </p>
            </div>

            <RutaMapa rutaParaderos={rutaSeleccionada.rutaParaderos ?? []} />

            {Array.isArray(rutaSeleccionada.rutaParaderos) &&
              rutaSeleccionada.rutaParaderos.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-neg-on-surface mb-3">
                    Paraderos en orden secuencial
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rutaSeleccionada.rutaParaderos.map((rp) => (
                      <div
                        key={rp.id ?? `${rp.orden}-${rp.paradero?.id ?? "x"}`}
                        className="rounded-xl border border-neg-outline-variant/40 bg-neg-surface-container-lowest px-4 py-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-neg-primary-container text-neg-on-primary-container text-xs font-bold flex items-center justify-center shrink-0">
                            {rp.orden}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-neg-on-surface">
                              {rp.paradero?.nombre ?? `Paradero #${rp.paradero_id ?? "—"}`}
                            </p>
                            <p className="text-xs text-neg-on-surface-variant mt-1">
                              {rp.paradero?.tipo ?? "Tipo no definido"}
                            </p>
                            <p className="text-xs text-neg-on-surface-variant mt-1">
                              {rp.distancia_desde_anterior != null
                                ? `${rp.distancia_desde_anterior} km desde el anterior`
                                : "Inicio del recorrido"}
                              {" · "}
                              {rp.tiempo_estimado_min} min
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </NegCard>

      {/* Panel lateral — formulario */}
      {isAdmin && showForm && (
        <div className="fixed inset-0 z-[1100] flex">
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
      {isAdmin && deleteTarget && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4">
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
