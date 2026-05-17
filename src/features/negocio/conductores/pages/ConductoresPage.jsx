import { useEffect, useMemo, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegInput,
  NegSelect,
  NegDataTable,
  NegEmptyState,
  NegChip,
} from "../../../../components/negocio";
import {
  listConductoresAdmin,
  updateConductor,
  listEmpresas,
} from "../conductoresService";

const CATEGORIA_OPTIONS = [
  { value: "A1", label: "A1 — Motos hasta 125cc" },
  { value: "A2", label: "A2 — Motos sin restricción" },
  { value: "B1", label: "B1 — Vehículos particulares" },
  { value: "B2", label: "B2 — Camiones livianos" },
  { value: "B3", label: "B3 — Camiones / vehículos pesados" },
  { value: "C1", label: "C1 — Servicio público hasta 9 pax" },
  { value: "C2", label: "C2 — Servicio público hasta 16 pax" },
  { value: "C3", label: "C3 — Servicio público > 16 pax" },
];

function esPlaceholder(licencia) {
  return typeof licencia === "string" && licencia.startsWith("PENDIENTE-");
}

function nombreConductor(c) {
  const persona = c?.persona;
  const nombre = `${persona?.nombre ?? ""} ${persona?.apellido ?? ""}`.trim();
  return nombre || `Conductor #${c?.id ?? "?"}`;
}

export default function ConductoresPage() {
  const [conductores, setConductores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    licencia: "",
    categoria_licencia: "C2",
    empresa_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([listConductoresAdmin(), listEmpresas()])
      .then(([condData, empData]) => {
        setConductores(Array.isArray(condData) ? condData : []);
        setEmpresas(Array.isArray(empData) ? empData : []);
      })
      .catch((err) =>
        setError(
          err?.response?.data?.message ??
            "No se pudieron cargar los conductores.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    if (filtro === "pendientes") {
      return conductores.filter((c) => esPlaceholder(c.licencia));
    }
    if (filtro === "completos") {
      return conductores.filter((c) => !esPlaceholder(c.licencia));
    }
    return conductores;
  }, [conductores, filtro]);

  const totalPendientes = useMemo(
    () => conductores.filter((c) => esPlaceholder(c.licencia)).length,
    [conductores],
  );

  const openEdit = (conductor) => {
    setEditing(conductor);
    setForm({
      licencia: esPlaceholder(conductor.licencia) ? "" : conductor.licencia,
      categoria_licencia: conductor.categoria_licencia ?? "C2",
      empresa_id: String(conductor.empresa_id ?? ""),
    });
    setSubmitError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.licencia.trim() || !form.empresa_id || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateConductor(editing.id, {
        licencia: form.licencia.trim(),
        categoria_licencia: form.categoria_licencia,
        empresa_id: Number(form.empresa_id),
      });
      closeEdit();
      load();
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ??
          "No se pudieron guardar los cambios. ¿Licencia ya usada por otro conductor?",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "conductor",
      header: "Conductor",
      render: (r) => (
        <div>
          <p className="font-medium text-neg-on-surface">
            {nombreConductor(r)}
          </p>
          <p className="text-xs text-neg-on-surface-variant">
            {r.persona?.email ?? `ID ${r.id}`}
          </p>
        </div>
      ),
    },
    {
      key: "licencia",
      header: "Licencia",
      render: (r) =>
        esPlaceholder(r.licencia) ? (
          <NegChip tone="warning" icon="warning">
            Pendiente de completar
          </NegChip>
        ) : (
          <span className="font-mono text-sm text-neg-on-surface">
            {r.licencia}
          </span>
        ),
    },
    {
      key: "categoria_licencia",
      header: "Categoría",
      width: 110,
      render: (r) => (
        <span className="text-sm text-neg-on-surface-variant">
          {r.categoria_licencia ?? "—"}
        </span>
      ),
    },
    {
      key: "empresa",
      header: "Empresa",
      render: (r) => (
        <span className="text-sm text-neg-on-surface">
          {r.empresa?.nombre ?? `ID ${r.empresa_id ?? "—"}`}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "",
      width: 80,
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEdit(r);
          }}
          className="p-1.5 rounded-lg text-neg-on-surface-variant hover:text-neg-primary hover:bg-neg-primary/10 transition-colors"
          title="Editar datos del conductor"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <NegPageHeader
        eyebrow="Conductores y turnos"
        title="Gestión de conductores"
        subtitle="Completá los datos de los conductores recién asignados (creados automáticamente con valores placeholder cuando se les asignó el rol en seguridad)."
      />

      {totalPendientes > 0 && (
        <NegCard
          className="mb-5 border border-amber-300 bg-amber-50/60"
          padding="sm"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-700 text-[24px]">
              warning
            </span>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">
                {totalPendientes} conductor{totalPendientes === 1 ? "" : "es"}{" "}
                con datos pendientes
              </p>
              <p className="text-sm text-amber-800/90">
                Tienen licencia/empresa placeholder. Editalos para completar la
                información real antes de asignarles turnos.
              </p>
            </div>
            <NegButton
              variant="outlined"
              onClick={() => setFiltro("pendientes")}
            >
              Ver pendientes
            </NegButton>
          </div>
        </NegCard>
      )}

      {error && (
        <NegCard className="mb-5 border border-neg-error" padding="sm">
          <div className="flex items-center gap-2 text-sm text-neg-error font-medium">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        </NegCard>
      )}

      <div className="flex items-center gap-2 mb-4">
        {["todos", "pendientes", "completos"].map((opt) => (
          <button
            key={opt}
            onClick={() => setFiltro(opt)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filtro === opt
                ? "bg-neg-primary text-neg-on-primary border-neg-primary"
                : "border-neg-outline-variant text-neg-on-surface-variant hover:border-neg-outline"
            }`}
          >
            {opt}
          </button>
        ))}
        <p className="ml-auto text-xs text-neg-on-surface-variant">
          {rows.length} de {conductores.length}
        </p>
      </div>

      <NegCard padding="none">
        {loading ? (
          <div className="py-14 text-center text-sm text-neg-on-surface-variant">
            <span
              className="material-symbols-outlined text-[36px] block mb-2 animate-spin"
              style={{ animationDuration: "1s" }}
            >
              progress_activity
            </span>
            Cargando conductores...
          </div>
        ) : rows.length === 0 ? (
          <NegEmptyState
            icon="badge"
            title="Sin conductores"
            description={
              filtro === "pendientes"
                ? "Excelente, no hay conductores con datos pendientes."
                : "Cuando un user reciba rol Conductor en seguridad, aparecerá acá."
            }
          />
        ) : (
          <NegDataTable columns={columns} rows={rows} keyField="id" />
        )}
      </NegCard>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !submitting && closeEdit()}
          />
          <NegCard
            variant="elevated"
            padding="lg"
            className="relative z-10 w-full max-w-lg"
          >
            <h2 className="font-headline text-xl font-bold text-neg-on-surface mb-1">
              Completar datos del conductor
            </h2>
            <p className="text-sm text-neg-on-surface-variant mb-5">
              {nombreConductor(editing)} ·{" "}
              <span className="text-xs">{editing.persona?.email}</span>
            </p>

            {esPlaceholder(editing.licencia) && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span className="font-semibold">Datos placeholder:</span> este
                conductor fue creado automáticamente. Reemplazá los valores con
                los reales.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <NegInput
                label="Número de licencia *"
                name="licencia"
                value={form.licencia}
                onChange={(e) =>
                  setForm((f) => ({ ...f, licencia: e.target.value }))
                }
                placeholder="Ej. LIC-12345678"
                iconStart="badge"
                required
                hint="Debe ser único en el sistema."
              />
              <NegSelect
                label="Categoría de licencia *"
                name="categoria_licencia"
                value={form.categoria_licencia}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    categoria_licencia: e.target.value,
                  }))
                }
                options={CATEGORIA_OPTIONS}
              />
              <NegSelect
                label="Empresa *"
                name="empresa_id"
                value={form.empresa_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, empresa_id: e.target.value }))
                }
                placeholder="Seleccioná una empresa"
                options={empresas.map((emp) => ({
                  value: emp.id,
                  label: emp.nombre,
                }))}
              />

              {submitError && (
                <div className="px-3 py-2 rounded-lg border border-neg-error bg-neg-error-container/30 text-sm text-neg-error">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <NegButton
                  type="button"
                  variant="outlined"
                  onClick={closeEdit}
                  disabled={submitting}
                >
                  Cancelar
                </NegButton>
                <NegButton
                  type="submit"
                  icon={submitting ? "hourglass_top" : "save"}
                  disabled={
                    !form.licencia.trim() || !form.empresa_id || submitting
                  }
                >
                  {submitting ? "Guardando..." : "Guardar cambios"}
                </NegButton>
              </div>
            </form>
          </NegCard>
        </div>
      )}
    </div>
  );
}
