import { useEffect, useMemo, useState } from "react";
import {
  NegButton,
  NegCard,
  NegEmptyState,
  NegInput,
  NegPageHeader,
  NegSectionHeader,
  NegSelect,
  NegStatusBadge,
  NegTextarea,
  NegTimeline,
} from "../../../../components/negocio";
import {
  useAuth,
  ROL_ADMIN_EMPRESA,
  ROL_ADMIN_SISTEMA,
  ROL_CIUDADANO,
  ROL_CONDUCTOR,
  ROL_SUPERVISOR,
} from "../../../../context/AuthContext";
import { resolveStaticUrl } from "../../../../services/negocioApi";
import PhotoUploader from "../../incidentes/components/PhotoUploader";
import {
  actualizarPqrs,
  consultarPqrsPorRadicado,
  crearPqrs,
  listarMisPqrs,
  listarPqrsGestion,
} from "../pqrsService";

const TIPOS = [
  { value: "peticion", label: "Peticion" },
  { value: "queja", label: "Queja" },
  { value: "reclamo", label: "Reclamo" },
  { value: "sugerencia", label: "Sugerencia" },
];

const CATEGORIAS = [
  { value: "conductor", label: "Conductor" },
  { value: "bus", label: "Bus" },
  { value: "ruta", label: "Ruta" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
];

const ESTADOS = [
  { value: "recibido", label: "Recibido" },
  { value: "en_revision", label: "En revision" },
  { value: "en_proceso", label: "En proceso" },
  { value: "resuelto", label: "Resuelto" },
];

const GESTION_ROLES = [
  ROL_ADMIN_SISTEMA,
  ROL_ADMIN_EMPRESA,
  ROL_SUPERVISOR,
];

const INITIAL_FORM = {
  tipo: "peticion",
  categoria: "conductor",
  descripcion: "",
  email_contacto: "",
};

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-CO");
}

function prettify(value) {
  return String(value ?? "")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function buildTimeline(items = []) {
  return items.map((item) => ({
    id: item.id,
    title: prettify(item.estado),
    description: item.detalle,
    timestamp: formatDate(item.creado_en),
    tone:
      item.estado === "resuelto"
        ? "success"
        : item.estado === "recibido"
          ? "warning"
          : "neutral",
    icon:
      item.estado === "resuelto"
        ? "task_alt"
        : item.estado === "en_proceso"
          ? "sync"
          : item.estado === "en_revision"
            ? "manage_search"
            : "mark_email_read",
  }));
}

export default function PqrsPage() {
  const { user, hasAnyRole } = useAuth();
  const isGestion = hasAnyRole(GESTION_ROLES);
  const canSeeMine = hasAnyRole([ROL_CIUDADANO, ROL_CONDUCTOR]);

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    email_contacto: user?.email ?? "",
  });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const [consultaRadicado, setConsultaRadicado] = useState("");
  const [consulta, setConsulta] = useState(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaError, setConsultaError] = useState(null);

  const [misPqrs, setMisPqrs] = useState([]);
  const [loadingMine, setLoadingMine] = useState(canSeeMine);

  const [bandeja, setBandeja] = useState([]);
  const [loadingBandeja, setLoadingBandeja] = useState(isGestion);
  const [selectedGestionId, setSelectedGestionId] = useState(null);
  const [gestionForm, setGestionForm] = useState({
    estado: "recibido",
    respuesta_final: "",
  });
  const [gestionSaving, setGestionSaving] = useState(false);
  const [gestionError, setGestionError] = useState(null);
  const [gestionSuccess, setGestionSuccess] = useState(null);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      email_contacto: current.email_contacto || user?.email || "",
    }));
  }, [user?.email]);

  const selectedGestion = useMemo(
    () => bandeja.find((item) => item.id === selectedGestionId) ?? null,
    [bandeja, selectedGestionId],
  );

  const timelineItems = useMemo(
    () => buildTimeline(consulta?.historial ?? []),
    [consulta],
  );

  useEffect(() => {
    if (!canSeeMine) return undefined;
    let active = true;
    setLoadingMine(true);
    listarMisPqrs()
      .then((data) => {
        if (active) setMisPqrs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setMisPqrs([]);
      })
      .finally(() => {
        if (active) setLoadingMine(false);
      });
    return () => {
      active = false;
    };
  }, [canSeeMine]);

  useEffect(() => {
    if (!isGestion) return undefined;
    let active = true;
    setLoadingBandeja(true);
    listarPqrsGestion()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setBandeja(list);
        setSelectedGestionId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setBandeja([]);
      })
      .finally(() => {
        if (active) setLoadingBandeja(false);
      });
    return () => {
      active = false;
    };
  }, [isGestion]);

  useEffect(() => {
    if (!selectedGestion) return;
    setGestionForm({
      estado: selectedGestion.estado ?? "recibido",
      respuesta_final: selectedGestion.respuesta_final ?? "",
    });
  }, [selectedGestion]);

  const refreshMine = async () => {
    if (!canSeeMine) return;
    const data = await listarMisPqrs();
    setMisPqrs(Array.isArray(data) ? data : []);
  };

  const refreshBandeja = async () => {
    if (!isGestion) return;
    const data = await listarPqrsGestion();
    const list = Array.isArray(data) ? data : [];
    setBandeja(list);
    if (selectedGestionId) {
      const updated = list.find((item) => item.id === selectedGestionId);
      if (!updated && list[0]?.id) setSelectedGestionId(list[0].id);
    }
  };

  const runConsulta = async (numeroRadicado) => {
    const numero = numeroRadicado.trim().toUpperCase();
    if (!numero) return;
    setConsultaLoading(true);
    setConsultaError(null);
    try {
      const data = await consultarPqrsPorRadicado(numero);
      setConsulta(data);
      setConsultaRadicado(numero);
    } catch (err) {
      setConsulta(null);
      setConsultaError(
        err?.response?.data?.message ?? "No se pudo consultar el radicado.",
      );
    } finally {
      setConsultaLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);
    try {
      const data = await crearPqrs(
        {
          ...form,
          descripcion: form.descripcion.trim(),
          email_contacto: form.email_contacto.trim(),
        },
        photos,
      );
      setSubmitResult(data);
      setPhotos([]);
      setForm((current) => ({
        ...current,
        descripcion: "",
      }));
      await runConsulta(data.pqrs.numero_radicado);
      await refreshMine();
      await refreshBandeja();
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ?? "No se pudo registrar el PQRS.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGestionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedGestion || gestionSaving) return;
    setGestionSaving(true);
    setGestionError(null);
    setGestionSuccess(null);
    try {
      await actualizarPqrs(selectedGestion.id, {
        estado: gestionForm.estado,
        respuesta_final: gestionForm.respuesta_final.trim() || undefined,
      });
      setGestionSuccess("Estado actualizado y notificado al ciudadano.");
      await refreshBandeja();
      await runConsulta(selectedGestion.numero_radicado);
    } catch (err) {
      setGestionError(
        err?.response?.data?.message ?? "No se pudo actualizar el PQRS.",
      );
    } finally {
      setGestionSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-012b"
        title="PQRS automatizado"
        subtitle="Radica peticiones, quejas, reclamos o sugerencias y consulta el seguimiento por radicado."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <form onSubmit={handleSubmit}>
          <NegCard className="space-y-5">
            <NegSectionHeader
              title="Nuevo PQRS"
              hint="Adjunta hasta 3 fotos, define la categoria y deja un correo de contacto."
            />

            {submitError && (
              <div className="rounded-xl border border-neg-error/40 bg-neg-error-container/40 px-4 py-3 text-sm text-neg-on-error-container">
                {submitError}
              </div>
            )}

            {submitResult && (
              <div className="rounded-xl border border-neg-primary/30 bg-neg-primary-container/35 px-4 py-3 text-sm text-neg-on-primary-container">
                <p className="font-semibold">
                  Radicado generado: {submitResult.pqrs?.numero_radicado}
                </p>
                <p className="mt-1">
                  Resumen enviado por correo: {submitResult.resumen}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NegSelect
                label="Tipo"
                name="tipo"
                value={form.tipo}
                onChange={(e) =>
                  setForm((current) => ({ ...current, tipo: e.target.value }))
                }
                options={TIPOS}
              />
              <NegSelect
                label="Categoria"
                name="categoria"
                value={form.categoria}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    categoria: e.target.value,
                  }))
                }
                options={CATEGORIAS}
              />
            </div>

            <NegInput
              type="email"
              name="email_contacto"
              label="Email de contacto"
              iconStart="mail"
              maxLength={150}
              value={form.email_contacto}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  email_contacto: e.target.value,
                }))
              }
              required
            />

            <NegTextarea
              label="Descripcion"
              name="descripcion"
              rows={6}
              maxLength={500}
              hint={`${form.descripcion.length}/500 caracteres`}
              value={form.descripcion}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  descripcion: e.target.value,
                }))
              }
              placeholder="Cuenta que paso, donde ocurrio y por que necesitas seguimiento."
              required
            />

            <div className="space-y-2">
              <p className="text-xs font-medium text-neg-on-surface-variant">
                Evidencia fotografica
              </p>
              <PhotoUploader photos={photos} onChange={setPhotos} max={3} />
            </div>

            <div className="flex justify-end">
              <NegButton
                type="submit"
                icon="outgoing_mail"
                disabled={
                  submitting ||
                  !form.descripcion.trim() ||
                  !form.email_contacto.trim()
                }
              >
                {submitting ? "Enviando..." : "Radicar PQRS"}
              </NegButton>
            </div>
          </NegCard>
        </form>

        <NegCard className="space-y-5">
          <NegSectionHeader
            title="Consulta por radicado"
            hint="Ingresa tu numero para revisar el estado actual, el resumen y la respuesta final."
          />

          <div className="flex gap-3">
            <NegInput
              className="flex-1"
              label="Numero de radicado"
              placeholder="PQRS-2026-000001"
              iconStart="tag"
              value={consultaRadicado}
              onChange={(e) => setConsultaRadicado(e.target.value.toUpperCase())}
            />
            <div className="pt-6">
              <NegButton
                icon="search"
                onClick={() => runConsulta(consultaRadicado)}
                disabled={!consultaRadicado.trim() || consultaLoading}
              >
                {consultaLoading ? "Buscando..." : "Consultar"}
              </NegButton>
            </div>
          </div>

          {consultaError && (
            <div className="rounded-xl border border-neg-error/40 bg-neg-error-container/40 px-4 py-3 text-sm text-neg-on-error-container">
              {consultaError}
            </div>
          )}

          {!consulta ? (
            <NegEmptyState
              icon="receipt_long"
              title="Sin consulta activa"
              description="Cuando consultes un radicado veras aqui el estado, las fotos y el historial."
            />
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-neg-on-surface-variant">
                    Radicado
                  </p>
                  <h2 className="text-xl font-semibold text-neg-on-surface">
                    {consulta.numero_radicado}
                  </h2>
                  <p className="mt-1 text-sm text-neg-on-surface-variant">
                    {consulta.resumen}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <NegStatusBadge kind="pqrs" value={consulta.estado} />
                  {consulta.vencido && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                      Vencido
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-neg-surface-container p-3">
                  <p className="text-xs text-neg-on-surface-variant">Tipo</p>
                  <p className="text-sm font-semibold text-neg-on-surface">
                    {prettify(consulta.tipo)}
                  </p>
                </div>
                <div className="rounded-xl bg-neg-surface-container p-3">
                  <p className="text-xs text-neg-on-surface-variant">Categoria</p>
                  <p className="text-sm font-semibold text-neg-on-surface">
                    {prettify(consulta.categoria)}
                  </p>
                </div>
                <div className="rounded-xl bg-neg-surface-container p-3">
                  <p className="text-xs text-neg-on-surface-variant">Creado</p>
                  <p className="text-sm font-semibold text-neg-on-surface">
                    {formatDate(consulta.fecha_creacion)}
                  </p>
                </div>
                <div className="rounded-xl bg-neg-surface-container p-3">
                  <p className="text-xs text-neg-on-surface-variant">
                    Tiempo estimado
                  </p>
                  <p className="text-sm font-semibold text-neg-on-surface">
                    {consulta.tiempo_estimado_respuesta_dias} dia(s)
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neg-outline-variant/60 bg-neg-surface-container-lowest p-4">
                <p className="text-xs uppercase tracking-wider text-neg-on-surface-variant">
                  Descripcion original
                </p>
                <p className="mt-2 text-sm text-neg-on-surface">
                  {consulta.descripcion}
                </p>
                <p className="mt-3 text-xs text-neg-on-surface-variant">
                  Contacto: {consulta.email_contacto_mascarado}
                </p>
              </div>

              {consulta.respuesta_final && (
                <div className="rounded-xl border border-neg-primary/20 bg-neg-primary-container/25 p-4">
                  <p className="text-xs uppercase tracking-wider text-neg-on-surface-variant">
                    Respuesta final
                  </p>
                  <p className="mt-2 text-sm text-neg-on-surface">
                    {consulta.respuesta_final}
                  </p>
                </div>
              )}

              {consulta.fotos?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neg-on-surface-variant">
                    Fotos adjuntas
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {consulta.fotos.map((foto) => {
                      const src = resolveStaticUrl(foto.url);
                      return (
                        <a
                          key={foto.id}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-xl border border-neg-outline-variant/60 bg-neg-surface-container-low"
                        >
                          <img
                            src={src}
                            alt={`Adjunto ${foto.id}`}
                            className="aspect-square w-full object-cover"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-neg-on-surface-variant">
                  Historial del caso
                </p>
                <NegTimeline items={timelineItems} />
              </div>
            </div>
          )}
        </NegCard>
      </div>

      {canSeeMine && (
        <NegCard className="space-y-4">
          <NegSectionHeader
            title="Mis PQRS"
            hint="Tus radicados mas recientes para abrirlos sin copiar y pegar el numero."
          />
          {loadingMine ? (
            <p className="text-sm text-neg-on-surface-variant">
              Cargando tus PQRS...
            </p>
          ) : misPqrs.length === 0 ? (
            <NegEmptyState
              icon="mark_email_unread"
              title="Aun no has radicado PQRS"
              description="Cuando envies tu primer caso aparecera aqui con acceso rapido a la consulta."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {misPqrs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => runConsulta(item.numero_radicado)}
                  className="rounded-2xl border border-neg-outline-variant/60 bg-neg-surface-container-lowest p-4 text-left transition-colors hover:border-neg-primary/40 hover:bg-neg-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neg-on-surface">
                        {item.numero_radicado}
                      </p>
                      <p className="mt-1 text-xs text-neg-on-surface-variant">
                        {prettify(item.tipo)} · {prettify(item.categoria)}
                      </p>
                    </div>
                    <NegStatusBadge kind="pqrs" value={item.estado} />
                  </div>
                  <p className="mt-3 text-sm text-neg-on-surface-variant line-clamp-2">
                    {item.descripcion}
                  </p>
                </button>
              ))}
            </div>
          )}
        </NegCard>
      )}

      {isGestion && (
        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <NegCard className="space-y-4">
            <NegSectionHeader
              title="Bandeja operativa"
              hint="Casos recientes para cambiar estado y responder desde el panel."
            />
            {loadingBandeja ? (
              <p className="text-sm text-neg-on-surface-variant">
                Cargando PQRS...
              </p>
            ) : bandeja.length === 0 ? (
              <NegEmptyState
                icon="inventory_2"
                title="Sin PQRS en bandeja"
                description="Cuando entren nuevos casos los veras aqui."
              />
            ) : (
              <div className="space-y-3">
                {bandeja.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedGestionId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      selectedGestionId === item.id
                        ? "border-neg-primary bg-neg-primary/5"
                        : "border-neg-outline-variant/60 bg-neg-surface-container-lowest hover:border-neg-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-neg-on-surface">
                          {item.numero_radicado}
                        </p>
                        <p className="mt-1 text-xs text-neg-on-surface-variant">
                          {item.email_contacto}
                        </p>
                      </div>
                      <NegStatusBadge kind="pqrs" value={item.estado} />
                    </div>
                    <p className="mt-3 text-sm text-neg-on-surface-variant line-clamp-2">
                      {item.descripcion}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </NegCard>

          <NegCard className="space-y-5">
            <NegSectionHeader
              title="Actualizar seguimiento"
              hint="Cada cambio dispara correo automatico al ciudadano. Si cierras el caso, deja respuesta final."
            />

            {!selectedGestion ? (
              <NegEmptyState
                icon="edit_note"
                title="Selecciona un caso"
                description="Elige un PQRS de la bandeja para revisar su detalle y actualizarlo."
              />
            ) : (
              <form onSubmit={handleGestionSubmit} className="space-y-5">
                <div className="rounded-xl bg-neg-surface-container p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neg-on-surface-variant">
                        Radicado seleccionado
                      </p>
                      <h3 className="text-lg font-semibold text-neg-on-surface">
                        {selectedGestion.numero_radicado}
                      </h3>
                      <p className="mt-1 text-sm text-neg-on-surface-variant">
                        {selectedGestion.email_contacto}
                      </p>
                    </div>
                    <NegStatusBadge kind="pqrs" value={selectedGestion.estado} />
                  </div>
                </div>

                {gestionError && (
                  <div className="rounded-xl border border-neg-error/40 bg-neg-error-container/40 px-4 py-3 text-sm text-neg-on-error-container">
                    {gestionError}
                  </div>
                )}

                {gestionSuccess && (
                  <div className="rounded-xl border border-neg-primary/30 bg-neg-primary-container/35 px-4 py-3 text-sm text-neg-on-primary-container">
                    {gestionSuccess}
                  </div>
                )}

                <NegSelect
                  label="Nuevo estado"
                  value={gestionForm.estado}
                  onChange={(e) =>
                    setGestionForm((current) => ({
                      ...current,
                      estado: e.target.value,
                    }))
                  }
                  options={ESTADOS}
                />

                <NegTextarea
                  label="Respuesta final o detalle para el ciudadano"
                  rows={6}
                  value={gestionForm.respuesta_final}
                  onChange={(e) =>
                    setGestionForm((current) => ({
                      ...current,
                      respuesta_final: e.target.value,
                    }))
                  }
                  placeholder="Describe que se reviso, que se hizo o la respuesta final del caso."
                  hint={
                    gestionForm.estado === "resuelto"
                      ? "Obligatorio para cerrar el caso."
                      : "Opcional, pero recomendado para dejar trazabilidad."
                  }
                />

                <div className="flex justify-end">
                  <NegButton
                    type="submit"
                    icon="save"
                    disabled={gestionSaving}
                  >
                    {gestionSaving ? "Guardando..." : "Guardar seguimiento"}
                  </NegButton>
                </div>
              </form>
            )}
          </NegCard>
        </div>
      )}
    </section>
  );
}
