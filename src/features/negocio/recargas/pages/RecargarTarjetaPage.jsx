import { useEffect, useMemo, useRef, useState } from "react";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegInput,
  NegSelect,
  NegSectionHeader,
  NegChip,
  NegStatusBadge,
  NegEmptyState,
} from "../../../../components/negocio";
import SaldoCard from "../components/SaldoCard";
import MontoSelector from "../components/MontoSelector";
import MetodoPagoSelector from "../components/MetodoPagoSelector";
import { MONTOS_PREDEFINIDOS } from "../../_mocks/catalogos";
import { formatCurrency } from "../../_utils/format";
import {
  listMetodosPagoCiudadano,
  listMisMetodosPagoCiudadano,
  listMetodosPago,
  registrarMiMetodoPago,
} from "../../_services/catalogosService";
import { useAuth } from "../../../../context/AuthContext";
import {
  previewRecarga,
  iniciarRecarga,
  obtenerRecarga,
} from "../../_services/recargasService";
import { abrirCheckoutEpayco } from "../_utils/epayco";

const STEPS = [
  { id: "titular", label: "Titular" },
  { id: "monto", label: "Monto" },
  { id: "pago", label: "Pago" },
  { id: "confirmacion", label: "Confirmación" },
];

const MIN_MONTO = 5000;
const MAX_MONTO = 500000;

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function nombreCiudadano(mpc) {
  const persona = mpc?.ciudadano?.persona;
  if (!persona) return `Ciudadano #${mpc?.ciudadano_id ?? "?"}`;
  return `${persona.nombre ?? ""} ${persona.apellido ?? ""}`.trim();
}

export default function RecargarTarjetaPage() {
  const { isCiudadano, isAdmin } = useAuth();
  // Si es ciudadano puro (no admin), arrancamos directo en el paso de monto
  // porque su tarjeta se autoselecciona.
  const soloCiudadano = isCiudadano && !isAdmin;
  const [step, setStep] = useState(soloCiudadano ? 1 : 0);
  const [metodos, setMetodos] = useState([]);
  const [loadingMetodos, setLoadingMetodos] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mpcId, setMpcId] = useState(null);
  const [monto, setMonto] = useState(null);
  const [montoCustom, setMontoCustom] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [iniciando, setIniciando] = useState(false);
  const [recarga, setRecarga] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // Estado para "Registrar nuevo método de pago" (solo ciudadano)
  const [showRegistrar, setShowRegistrar] = useState(false);
  const [catalogoMetodos, setCatalogoMetodos] = useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [formMetodo, setFormMetodo] = useState({
    metodo_pago_id: "",
    referencia_externa: "",
  });
  const [registrando, setRegistrando] = useState(false);
  const [registrarError, setRegistrarError] = useState(null);

  useEffect(() => {
    let alive = true;
    // Ciudadano puro: usa el endpoint /mis-metodos (solo sus tarjetas).
    // Admin: usa el endpoint completo (puede recargar la tarjeta de cualquier ciudadano).
    const fetcher = soloCiudadano
      ? listMisMetodosPagoCiudadano
      : listMetodosPagoCiudadano;
    fetcher()
      .then((data) => {
        if (!alive) return;
        const lista = Array.isArray(data) ? data : [];
        setMetodos(lista);
        // Para ciudadano: autoseleccionar la primera tarjeta activa
        if (soloCiudadano) {
          const activa = lista.find((m) => m.activo) ?? lista[0];
          if (activa) setMpcId(activa.id);
        }
      })
      .catch((err) => {
        if (!alive) return;
        setError(
          err?.response?.data?.message ??
            "No se pudieron cargar los métodos de pago.",
        );
      })
      .finally(() => {
        if (alive) setLoadingMetodos(false);
      });
    return () => {
      alive = false;
    };
  }, [soloCiudadano]);

  const metodosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return metodos;
    return metodos.filter((m) => {
      const nombre = nombreCiudadano(m).toLowerCase();
      const tipo = (m.metodoPago?.tipo ?? "").toLowerCase();
      return (
        nombre.includes(term) ||
        tipo.includes(term) ||
        String(m.id).includes(term)
      );
    });
  }, [metodos, busqueda]);

  const mpcSeleccionado = metodos.find((m) => m.id === mpcId) ?? null;
  const saldoActual = Number(mpcSeleccionado?.saldo_actual ?? 0);

  const montoFinal = monto ?? (montoCustom ? Number(montoCustom) : 0);
  const montoValido = montoFinal >= MIN_MONTO && montoFinal <= MAX_MONTO;

  useEffect(() => {
    if (!mpcId || !montoValido) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let alive = true;
    setPreviewError(null);
    const timer = setTimeout(async () => {
      try {
        const data = await previewRecarga({
          metodo_pago_ciudadano_id: mpcId,
          monto: montoFinal,
        });
        if (alive) setPreview(data);
      } catch (err) {
        if (alive) {
          setPreview(null);
          setPreviewError(
            err?.response?.data?.message ??
              "No se pudo calcular la previsualización.",
          );
        }
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [mpcId, montoFinal, montoValido]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const pollRecarga = (recargaId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data = await obtenerRecarga(recargaId);
        setRecarga((prev) => ({ ...(prev ?? {}), ...data }));
        if (data.estado && data.estado !== "pendiente") {
          stopPolling();
        }
      } catch {
        // ignoramos fallos transitorios del polling
      }
    }, 4000);
  };

  const confirmarPago = async () => {
    if (!mpcId || !montoValido || iniciando) return;
    setIniciando(true);
    setError(null);
    try {
      const data = await iniciarRecarga({
        metodo_pago_ciudadano_id: mpcId,
        monto: montoFinal,
      });
      setRecarga({
        id: data.recarga_id,
        referencia: data.referencia,
        estado: "pendiente",
        monto: montoFinal,
        metodo_tipo: mpcSeleccionado?.metodoPago?.tipo,
      });
      setStep(3);
      pollRecarga(data.recarga_id);
      try {
        await abrirCheckoutEpayco(data.epayco);
      } catch (epaycoErr) {
        setError(
          "No se pudo abrir el checkout de ePayco. Verificá tu conexión o reintentá.",
        );
        console.error(epaycoErr);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No se pudo iniciar la recarga. Intentá de nuevo.",
      );
    } finally {
      setIniciando(false);
    }
  };

  const consultarEstado = async () => {
    if (!recarga?.id) return;
    try {
      const data = await obtenerRecarga(recarga.id);
      setRecarga((prev) => ({ ...(prev ?? {}), ...data }));
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          "No se pudo consultar el estado de la recarga.",
      );
    }
  };

  const reset = () => {
    stopPolling();
    setStep(soloCiudadano ? 1 : 0);
    // Para ciudadano: mantener el mpc autoseleccionado (su tarjeta).
    // Para admin: reiniciar la selección de titular.
    if (!soloCiudadano) setMpcId(null);
    setBusqueda("");
    setMonto(null);
    setMontoCustom("");
    setAceptaTerminos(false);
    setPreview(null);
    setPreviewError(null);
    setRecarga(null);
    setError(null);
  };

  const abrirModalRegistrar = async () => {
    setShowRegistrar(true);
    setFormMetodo({ metodo_pago_id: "", referencia_externa: "" });
    setRegistrarError(null);
    if (catalogoMetodos.length === 0) {
      setLoadingCatalogo(true);
      try {
        const data = await listMetodosPago();
        setCatalogoMetodos(Array.isArray(data) ? data : []);
      } catch (err) {
        setRegistrarError(
          err?.response?.data?.message ??
            "No se pudo cargar el catálogo de métodos.",
        );
      } finally {
        setLoadingCatalogo(false);
      }
    }
  };

  const handleRegistrarMetodo = async (e) => {
    e.preventDefault();
    if (!formMetodo.metodo_pago_id || registrando) return;
    setRegistrando(true);
    setRegistrarError(null);
    try {
      const nuevo = await registrarMiMetodoPago({
        metodo_pago_id: Number(formMetodo.metodo_pago_id),
        referencia_externa: formMetodo.referencia_externa.trim() || undefined,
      });
      // Recargar lista y autoseleccionar el método recién creado
      const data = await listMisMetodosPagoCiudadano();
      const lista = Array.isArray(data) ? data : [];
      setMetodos(lista);
      setMpcId(nuevo.id);
      setShowRegistrar(false);
    } catch (err) {
      setRegistrarError(
        err?.response?.data?.message ??
          "No se pudo registrar el método. ¿Tal vez ya tenés uno de ese tipo?",
      );
    } finally {
      setRegistrando(false);
    }
  };

  const canContinueFromTitular = mpcId != null;
  const canContinueFromMonto = montoValido && !!preview;
  const canConfirm = montoValido && aceptaTerminos && !iniciando;

  return (
    <div className="max-w-5xl mx-auto">
      <NegPageHeader
        eyebrow="HU 2-013"
        title="Recargar tarjeta"
        subtitle={
          soloCiudadano
            ? "Recarga con ePayco en 3 pasos: monto, método y confirmación."
            : "Recarga con ePayco en 4 pasos: titular, monto, método y confirmación."
        }
      />

      <Stepper step={step} hideTitular={soloCiudadano} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2 space-y-5">
          {error && (
            <NegCard className="border border-neg-error text-neg-error">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">
                  error
                </span>
                {error}
              </div>
            </NegCard>
          )}

          {step === 0 && !soloCiudadano && (
            <NegCard>
              <NegSectionHeader
                title="Elegí el titular"
                hint="Buscá por nombre, apellido o tipo de método."
              />
              <NegInput
                label="Buscar ciudadano"
                name="busqueda"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej. Juan, Nequi, PSE..."
                iconStart="search"
              />
              <div className="mt-4">
                {loadingMetodos ? (
                  <p className="text-sm text-neg-on-surface-variant">
                    Cargando métodos de pago...
                  </p>
                ) : (
                  <MetodoPagoSelector
                    value={mpcId}
                    onChange={setMpcId}
                    options={metodosFiltrados}
                  />
                )}
              </div>
              <div className="flex justify-end mt-5">
                <NegButton
                  iconEnd="arrow_forward"
                  disabled={!canContinueFromTitular}
                  onClick={() => setStep(1)}
                >
                  Continuar
                </NegButton>
              </div>
            </NegCard>
          )}

          {soloCiudadano && step === 1 && (
            <NegCard>
              <NegSectionHeader
                title="Mis métodos de pago"
                hint="Elegí con cuál de tus tarjetas vas a hacer esta recarga."
                actions={
                  <NegButton
                    variant="outlined"
                    icon="add_card"
                    onClick={abrirModalRegistrar}
                  >
                    Registrar nuevo
                  </NegButton>
                }
              />
              {loadingMetodos ? (
                <p className="text-sm text-neg-on-surface-variant">
                  Cargando tus métodos de pago...
                </p>
              ) : metodos.length === 0 ? (
                <NegEmptyState
                  icon="credit_card_off"
                  title="No tenés métodos de pago"
                  description="Registrá uno con el botón de arriba para poder recargar tu tarjeta."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metodos.map((m) => {
                    const seleccionado = mpcId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMpcId(m.id)}
                        className={`text-left p-4 rounded-2xl border transition-colors ${
                          seleccionado
                            ? "border-neg-primary bg-neg-primary-container/30"
                            : "border-neg-outline-variant hover:border-neg-outline bg-neg-surface-container-lowest"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-neg-primary text-[20px]">
                            credit_card
                          </span>
                          <span className="font-semibold text-neg-on-surface capitalize">
                            {(m.metodoPago?.tipo ?? "Método").replaceAll(
                              "_",
                              " ",
                            )}
                          </span>
                          {seleccionado && (
                            <span className="ml-auto material-symbols-outlined text-neg-primary">
                              check_circle
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neg-on-surface-variant">
                          Saldo actual
                        </p>
                        <p className="font-headline text-lg font-bold text-neg-on-surface">
                          {formatCurrency(Number(m.saldo_actual ?? 0))}
                        </p>
                        {m.referencia_externa && (
                          <p className="text-[10px] font-mono text-neg-on-surface-variant mt-1">
                            {m.referencia_externa}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </NegCard>
          )}

          {step === 1 && (
            <NegCard>
              <NegSectionHeader
                title="Elegí el monto"
                hint={`Entre ${formatCurrency(MIN_MONTO)} y ${formatCurrency(MAX_MONTO)}.`}
              />
              <MontoSelector
                value={monto}
                onChange={(v) => {
                  setMonto(v);
                  setMontoCustom("");
                }}
                options={MONTOS_PREDEFINIDOS}
              />
              <div className="mt-4">
                <NegInput
                  label="Otro monto"
                  name="montoCustom"
                  value={montoCustom}
                  onChange={(e) => {
                    setMontoCustom(onlyDigits(e.target.value));
                    setMonto(null);
                  }}
                  placeholder="Ej. 15000"
                  iconStart="payments"
                  inputMode="numeric"
                  hint={
                    montoCustom && !montoValido
                      ? `El monto debe estar entre ${formatCurrency(MIN_MONTO)} y ${formatCurrency(MAX_MONTO)}`
                      : undefined
                  }
                  error={
                    montoCustom && !montoValido
                      ? "Monto fuera de rango"
                      : undefined
                  }
                />
              </div>
              {previewError && (
                <p className="mt-3 text-sm text-neg-error">{previewError}</p>
              )}
              <div className="flex justify-between mt-5">
                {soloCiudadano ? (
                  <span />
                ) : (
                  <NegButton variant="outlined" onClick={() => setStep(0)}>
                    Atrás
                  </NegButton>
                )}
                <NegButton
                  iconEnd="arrow_forward"
                  disabled={!canContinueFromMonto}
                  onClick={() => setStep(2)}
                >
                  Continuar
                </NegButton>
              </div>
            </NegCard>
          )}

          {step === 2 && (
            <NegCard>
              <NegSectionHeader
                title="Confirmá y pagá"
                hint="Se abrirá el checkout de ePayco para finalizar el pago."
              />
              <div className="rounded-xl border border-neg-outline-variant p-4 bg-neg-surface-container-lowest space-y-2 text-sm">
                <Row label="Titular" value={nombreCiudadano(mpcSeleccionado)} />
                <Row
                  label="Método"
                  value={
                    mpcSeleccionado?.metodoPago?.tipo?.replaceAll("_", " ") ??
                    "—"
                  }
                />
                <Row label="Monto" value={formatCurrency(montoFinal)} />
                <Row
                  label="Comisión estimada"
                  value={formatCurrency(preview?.comision_estimada ?? 0)}
                />
                <Row
                  label="Saldo actual"
                  value={formatCurrency(preview?.saldo_actual ?? saldoActual)}
                />
                <Row
                  label="Saldo después"
                  value={formatCurrency(
                    preview?.saldo_despues_recarga ?? saldoActual + montoFinal,
                  )}
                  strong
                />
              </div>
              <label className="flex items-start gap-2 mt-5 text-sm text-neg-on-surface-variant cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="mt-0.5 accent-neg-primary"
                />
                <span>
                  Acepto los{" "}
                  <a href="#" className="text-neg-primary font-semibold">
                    términos y condiciones
                  </a>{" "}
                  y autorizo el cobro por ePayco.
                </span>
              </label>
              <div className="flex justify-between mt-5">
                <NegButton
                  variant="outlined"
                  onClick={() => setStep(1)}
                  disabled={iniciando}
                >
                  Atrás
                </NegButton>
                <NegButton
                  icon={iniciando ? "hourglass_top" : "lock"}
                  disabled={!canConfirm}
                  onClick={confirmarPago}
                >
                  {iniciando
                    ? "Iniciando..."
                    : `Pagar ${formatCurrency(montoFinal)}`}
                </NegButton>
              </div>
            </NegCard>
          )}

          {step === 3 && recarga && (
            <NegCard padding="lg">
              <div className="text-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    recarga.estado === "aprobada"
                      ? "bg-neg-primary-container text-neg-on-primary-container"
                      : recarga.estado === "rechazada" ||
                          recarga.estado === "fallida"
                        ? "bg-neg-error-container text-neg-on-error-container"
                        : "bg-amber-100 text-amber-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[32px]">
                    {recarga.estado === "aprobada"
                      ? "check_circle"
                      : recarga.estado === "rechazada" ||
                          recarga.estado === "fallida"
                        ? "error"
                        : "hourglass_top"}
                  </span>
                </div>
                <h2 className="font-headline text-2xl font-bold text-neg-on-surface">
                  {recarga.estado === "aprobada"
                    ? "Recarga aprobada"
                    : recarga.estado === "rechazada"
                      ? "Recarga rechazada"
                      : recarga.estado === "fallida"
                        ? "Recarga fallida"
                        : "Recarga pendiente"}
                </h2>
                <p className="text-sm text-neg-on-surface-variant mt-1">
                  {recarga.estado === "aprobada"
                    ? "La tarjeta fue acreditada. El ciudadano ya puede usar el saldo."
                    : recarga.estado === "pendiente"
                      ? "Completá el pago en la ventana de ePayco. El estado se actualizará automáticamente."
                      : "Intentá nuevamente o usá otro método de pago."}
                </p>
              </div>

              <div className="mt-5 max-w-sm mx-auto space-y-2">
                <Row label="Recarga #" value={recarga.id} />
                <Row label="Referencia" value={recarga.referencia} />
                <Row
                  label="Estado"
                  value={
                    <NegStatusBadge kind="recarga" value={recarga.estado} />
                  }
                />
                <Row
                  label="Monto"
                  value={formatCurrency(Number(recarga.monto ?? montoFinal))}
                  strong
                />
                {recarga.transaction_id_epayco && (
                  <Row
                    label="Transacción"
                    value={recarga.transaction_id_epayco}
                  />
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mt-6">
                <NegButton
                  variant="outlined"
                  icon="refresh"
                  onClick={consultarEstado}
                >
                  Consultar estado
                </NegButton>
                <NegButton icon="add" onClick={reset}>
                  Nueva recarga
                </NegButton>
              </div>
            </NegCard>
          )}
        </div>

        <aside className="space-y-4">
          <SaldoCard
            tarjeta={
              mpcSeleccionado?.referencia_externa ?? `MPC-${mpcId ?? "—"}`
            }
            titular={
              mpcSeleccionado
                ? nombreCiudadano(mpcSeleccionado)
                : "Sin seleccionar"
            }
            saldo={saldoActual}
            nuevoSaldo={
              preview?.saldo_despues_recarga ??
              (montoValido ? saldoActual + montoFinal : null)
            }
          />
          <NegCard variant="outlined">
            <h3 className="font-semibold text-neg-on-surface mb-3">Resumen</h3>
            <div className="space-y-2 text-sm">
              <Row
                label="Monto"
                value={montoValido ? formatCurrency(montoFinal) : "—"}
              />
              <Row
                label="Método"
                value={
                  mpcSeleccionado?.metodoPago?.tipo?.replaceAll("_", " ") ?? "—"
                }
              />
              <Row
                label="Comisión"
                value={formatCurrency(preview?.comision_estimada ?? 0)}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-neg-outline-variant/60">
              <Row
                label="Total a abonar"
                value={montoValido ? formatCurrency(montoFinal) : "—"}
                strong
              />
            </div>
            <NegChip tone="primary" icon="security" className="mt-4">
              Procesado por ePayco
            </NegChip>
          </NegCard>
        </aside>
      </div>

      {showRegistrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !registrando && setShowRegistrar(false)}
          />
          <NegCard
            variant="elevated"
            padding="lg"
            className="relative z-10 w-full max-w-md"
          >
            <h2 className="font-headline text-xl font-bold text-neg-on-surface mb-1">
              Registrar nuevo método de pago
            </h2>
            <p className="text-sm text-neg-on-surface-variant mb-5">
              Vinculá un método a tu cuenta para usarlo en tus recargas. Empieza
              con saldo $0 y se carga vía ePayco.
            </p>

            <form onSubmit={handleRegistrarMetodo} className="space-y-4">
              <NegSelect
                label="Tipo de método *"
                name="metodo_pago_id"
                value={formMetodo.metodo_pago_id}
                onChange={(e) =>
                  setFormMetodo((f) => ({
                    ...f,
                    metodo_pago_id: e.target.value,
                  }))
                }
                placeholder={
                  loadingCatalogo
                    ? "Cargando catálogo..."
                    : "Seleccioná un método"
                }
                disabled={loadingCatalogo}
                options={catalogoMetodos.map((mp) => ({
                  value: mp.id,
                  label: `${mp.tipo.replaceAll("_", " ")}${mp.descripcion ? ` · ${mp.descripcion}` : ""}`,
                }))}
              />
              <NegInput
                label="Referencia externa (opcional)"
                name="referencia_externa"
                value={formMetodo.referencia_externa}
                onChange={(e) =>
                  setFormMetodo((f) => ({
                    ...f,
                    referencia_externa: e.target.value,
                  }))
                }
                placeholder="Ej. últimos 4 dígitos, alias, etc."
                iconStart="tag"
                hint="Solo para identificarla. No guardamos datos sensibles."
              />

              {registrarError && (
                <div className="px-3 py-2 rounded-lg border border-neg-error bg-neg-error-container/30 text-sm text-neg-error">
                  {registrarError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <NegButton
                  type="button"
                  variant="outlined"
                  onClick={() => setShowRegistrar(false)}
                  disabled={registrando}
                >
                  Cancelar
                </NegButton>
                <NegButton
                  type="submit"
                  icon={registrando ? "hourglass_top" : "add_card"}
                  disabled={!formMetodo.metodo_pago_id || registrando}
                >
                  {registrando ? "Registrando..." : "Registrar"}
                </NegButton>
              </div>
            </form>
          </NegCard>
        </div>
      )}
    </div>
  );
}

function Stepper({ step, hideTitular = false }) {
  // Cuando el usuario es ciudadano, ocultamos el paso "Titular" (es él mismo).
  // Los índices internos siguen siendo los mismos (0=Titular, 1=Monto, ...).
  const visibleSteps = hideTitular ? STEPS.slice(1) : STEPS;
  const baseOffset = hideTitular ? 1 : 0;
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {visibleSteps.map((s, visibleIdx) => {
        const idx = visibleIdx + baseOffset;
        const done = idx < step;
        const active = idx === step;
        const isLast = visibleIdx === visibleSteps.length - 1;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 h-8 rounded-full text-xs font-semibold ${
                done
                  ? "bg-neg-primary-container text-neg-on-primary-container"
                  : active
                    ? "bg-neg-primary text-neg-on-primary"
                    : "bg-neg-surface-container-high text-neg-on-surface-variant"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                  done || active
                    ? "bg-white/20"
                    : "bg-neg-surface-container-highest"
                }`}
              >
                {done ? "✓" : visibleIdx + 1}
              </span>
              {s.label}
            </div>
            {!isLast && (
              <span className="material-symbols-outlined text-[16px] text-neg-on-surface-variant">
                chevron_right
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neg-on-surface-variant">{label}</span>
      <span
        className={`tabular-nums ${
          strong
            ? "font-headline text-lg font-bold text-neg-on-surface"
            : "font-semibold text-neg-on-surface"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
