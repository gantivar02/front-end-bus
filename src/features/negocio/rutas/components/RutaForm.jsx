import { useEffect, useState } from "react";
import {
  NegCard,
  NegButton,
  NegInput,
  NegSelect,
  NegSectionHeader,
  NegTimeline,
} from "../../../../components/negocio";

const EMPTY_INFO = { nombre: "", descripcion: "", tarifa: "" };
const EMPTY_ADDING = {
  paradero_id: "",
  distancia_desde_anterior: "",
  tiempo_estimado_min: "",
};

export default function RutaForm({
  initialData,
  paraderosCatalog = [],
  onSubmit,
  onCancel,
  loading,
}) {
  const isEdit = !!initialData;

  const [info, setInfo] = useState(EMPTY_INFO);
  const [lista, setLista] = useState([]);
  const [adding, setAdding] = useState(EMPTY_ADDING);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (initialData) {
      setInfo({
        nombre: initialData.nombre ?? "",
        descripcion: initialData.descripcion ?? "",
        tarifa: initialData.tarifa ?? "",
      });
    } else {
      setInfo(EMPTY_INFO);
      setLista([]);
      setAdding(EMPTY_ADDING);
      setAddError("");
    }
  }, [initialData]);

  const setField = (name, value) => setInfo((f) => ({ ...f, [name]: value }));
  const setAddField = (name, value) =>
    setAdding((f) => ({ ...f, [name]: value }));

  const handleAddParadero = () => {
    setAddError("");
    if (!adding.paradero_id) {
      setAddError("Seleccioná un paradero.");
      return;
    }
    if (!adding.tiempo_estimado_min || Number(adding.tiempo_estimado_min) < 0) {
      setAddError("Ingresá el tiempo estimado en minutos.");
      return;
    }
    const isDuplicate = lista.some(
      (p) => String(p.paradero_id) === String(adding.paradero_id),
    );
    if (isDuplicate) {
      setAddError("Este paradero ya fue agregado a la ruta.");
      return;
    }
    const paraderoInfo = paraderosCatalog.find(
      (p) => String(p.id) === String(adding.paradero_id),
    );
    setLista((prev) => [
      ...prev,
      {
        paradero_id: Number(adding.paradero_id),
        orden: prev.length + 1,
        distancia_desde_anterior: adding.distancia_desde_anterior
          ? Number(adding.distancia_desde_anterior)
          : null,
        tiempo_estimado_min: Number(adding.tiempo_estimado_min),
        _nombre: paraderoInfo?.nombre ?? `Paradero #${adding.paradero_id}`,
      },
    ]);
    setAdding(EMPTY_ADDING);
  };

  const removeParadero = (idx) => {
    setLista((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, orden: i + 1 })),
    );
  };

  const canSubmit =
    info.nombre.trim() &&
    info.tarifa !== "" &&
    Number(info.tarifa) >= 0 &&
    (isEdit || lista.length >= 3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    if (isEdit) {
      onSubmit({
        nombre: info.nombre.trim(),
        descripcion: info.descripcion.trim() || undefined,
        tarifa: Number(info.tarifa),
      });
    } else {
      onSubmit({
        nombre: info.nombre.trim(),
        descripcion: info.descripcion.trim() || undefined,
        tarifa: Number(info.tarifa),
        paraderos: lista.map(
          ({ paradero_id, orden, distancia_desde_anterior, tiempo_estimado_min }) => ({
            paradero_id,
            orden,
            distancia_desde_anterior,
            tiempo_estimado_min,
          }),
        ),
      });
    }
  };

  const addedIds = new Set(lista.map((p) => String(p.paradero_id)));
  const availableParaderos = paraderosCatalog.filter(
    (p) => !addedIds.has(String(p.id)),
  );

  const timelineItems = lista.map((p, idx) => ({
    id: idx,
    title: `${p.orden}. ${p._nombre}`,
    description: [
      idx === 0
        ? "Inicio de ruta"
        : p.distancia_desde_anterior != null
          ? `${p.distancia_desde_anterior} km desde anterior`
          : "",
      `${p.tiempo_estimado_min} min`,
    ]
      .filter(Boolean)
      .join(" · "),
    icon:
      idx === 0
        ? "trip_origin"
        : idx === lista.length - 1
          ? "flag"
          : "radio_button_checked",
    tone:
      idx === lista.length - 1 && lista.length > 1 ? "warning" : "default",
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Información básica */}
      <NegCard>
        <NegSectionHeader title="Información de la ruta" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NegInput
            label="Nombre de la ruta *"
            name="nombre"
            value={info.nombre}
            onChange={(e) => setField("nombre", e.target.value)}
            placeholder="Ej. Ruta Centro-Norte"
            required
            className="md:col-span-2"
          />
          <NegInput
            label="Tarifa (COP) *"
            name="tarifa"
            type="number"
            min="0"
            step="100"
            value={info.tarifa}
            onChange={(e) => setField("tarifa", e.target.value)}
            placeholder="2500"
            iconStart="payments"
            required
          />
          <NegInput
            label="Descripción"
            name="descripcion"
            value={info.descripcion}
            onChange={(e) => setField("descripcion", e.target.value)}
            placeholder="Describe el recorrido de la ruta"
          />
        </div>
      </NegCard>

      {/* Paraderos — solo en modo creación */}
      {!isEdit && (
        <>
          <NegCard>
            <NegSectionHeader
              title="Paraderos de la ruta"
              hint={`${lista.length} agregado${lista.length !== 1 ? "s" : ""} · mínimo 3 requeridos`}
            />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_130px_130px_auto] gap-3 items-end mb-4">
              <NegSelect
                label="Paradero"
                name="paradero_id"
                value={adding.paradero_id}
                onChange={(e) => setAddField("paradero_id", e.target.value)}
                placeholder={
                  paraderosCatalog.length === 0
                    ? "Sin paraderos disponibles"
                    : "Seleccioná un paradero"
                }
                disabled={availableParaderos.length === 0}
                options={availableParaderos.map((p) => ({
                  value: p.id,
                  label: p.nombre,
                }))}
              />
              <NegInput
                label="Distancia (km)"
                name="distancia_desde_anterior"
                type="number"
                min="0"
                step="0.1"
                value={adding.distancia_desde_anterior}
                onChange={(e) =>
                  setAddField("distancia_desde_anterior", e.target.value)
                }
                placeholder="1.5"
                hint={lista.length === 0 ? "No aplica" : ""}
              />
              <NegInput
                label="Tiempo (min) *"
                name="tiempo_estimado_min"
                type="number"
                min="0"
                value={adding.tiempo_estimado_min}
                onChange={(e) =>
                  setAddField("tiempo_estimado_min", e.target.value)
                }
                placeholder="5"
              />
              <NegButton
                type="button"
                variant="tonal"
                icon="add"
                onClick={handleAddParadero}
                disabled={
                  !adding.paradero_id ||
                  adding.tiempo_estimado_min === "" ||
                  availableParaderos.length === 0
                }
              >
                Agregar
              </NegButton>
            </div>

            {addError && (
              <p className="text-xs text-neg-error mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">
                  error
                </span>
                {addError}
              </p>
            )}

            {lista.length < 3 && (
              <p className="text-xs text-neg-on-surface-variant/70 mb-4">
                Faltan{" "}
                <strong>{3 - lista.length}</strong> paradero
                {3 - lista.length !== 1 ? "s" : ""} para poder guardar la ruta.
              </p>
            )}

            {lista.length > 0 && (
              <div className="space-y-2 mt-2">
                {lista.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neg-surface-container-low border border-neg-outline-variant/40"
                  >
                    <span className="w-6 h-6 rounded-full bg-neg-primary-container text-neg-on-primary-container text-xs font-bold flex items-center justify-center shrink-0">
                      {p.orden}
                    </span>
                    <span className="flex-1 text-sm font-medium text-neg-on-surface">
                      {p._nombre}
                    </span>
                    {p.distancia_desde_anterior != null && (
                      <span className="text-xs text-neg-on-surface-variant whitespace-nowrap">
                        {p.distancia_desde_anterior} km
                      </span>
                    )}
                    <span className="text-xs text-neg-on-surface-variant whitespace-nowrap">
                      {p.tiempo_estimado_min} min
                    </span>
                    <button
                      type="button"
                      onClick={() => removeParadero(idx)}
                      className="p-1 rounded-lg text-neg-on-surface-variant hover:text-neg-error hover:bg-neg-error/10 transition-colors"
                      title="Quitar paradero"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </NegCard>

          {/* Vista previa de la ruta como timeline */}
          {lista.length > 0 && (
            <NegCard>
              <NegSectionHeader
                title="Vista previa de la ruta"
                hint="Orden secuencial de paradas"
              />
              <NegTimeline items={timelineItems} />
            </NegCard>
          )}
        </>
      )}

      {isEdit && (
        <div className="px-1">
          <p className="text-xs text-neg-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Los paraderos de esta ruta se gestionan desde el detalle de la ruta.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <NegButton
          variant="outlined"
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </NegButton>
        <NegButton
          type="submit"
          icon={loading ? "hourglass_top" : isEdit ? "save" : "add_road"}
          disabled={!canSubmit || loading}
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear ruta"}
        </NegButton>
      </div>
    </form>
  );
}
