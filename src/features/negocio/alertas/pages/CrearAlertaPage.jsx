import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NegPageHeader,
  NegCard,
  NegButton,
  NegInput,
  NegSelect,
  NegSectionHeader,
} from "../../../../components/negocio";
import { listRutas } from "../../_services/catalogosService";
import {
  crearAlertaMasiva,
  redactarConIA,
  vistaPreviaAlcance,
} from "../alertasService";

/**
 * HU 3-008 — Crear alerta masiva.
 * Form para que el admin envie alertas a todos, por ruta o por ciudad,
 * con vista previa de destinatarios, redaccion asistida por IA
 * (LangChain + Gemini) y opcion de programar el envio.
 */
export default function CrearAlertaPage() {
  const navigate = useNavigate();
  const [rutas, setRutas] = useState([]);

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [alcance, setAlcance] = useState("todos"); // todos | por_ruta | por_ciudad
  const [rutaId, setRutaId] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [programar, setProgramar] = useState(false);
  const [programadaPara, setProgramadaPara] = useState("");

  const [previa, setPrevia] = useState(null);
  const [previaLoading, setPreviaLoading] = useState(false);
  const [previaError, setPreviaError] = useState(null);

  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState(null);

  const [enviando, setEnviando] = useState(false);
  const [enviadoOk, setEnviadoOk] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listRutas()
      .then((data) => setRutas(Array.isArray(data) ? data : []))
      .catch(() => setRutas([]));
  }, []);

  const alcanceCompleto = useMemo(() => {
    if (alcance === "por_ruta") return Boolean(rutaId);
    if (alcance === "por_ciudad") return ciudad.trim().length > 0;
    return true;
  }, [alcance, rutaId, ciudad]);

  const formValido =
    titulo.trim().length > 0 &&
    contenido.trim().length > 0 &&
    alcanceCompleto &&
    (!programar || programadaPara.length > 0);

  const handleVistaPrevia = async () => {
    if (!alcanceCompleto) {
      setPreviaError("Completa el alcance antes de previsualizar.");
      return;
    }
    setPreviaLoading(true);
    setPreviaError(null);
    try {
      const payload = { alcance };
      if (alcance === "por_ruta") payload.ruta_id = Number(rutaId);
      if (alcance === "por_ciudad") payload.ciudad = ciudad.trim();
      const data = await vistaPreviaAlcance(payload);
      setPrevia(data);
    } catch (err) {
      setPreviaError(
        err?.response?.data?.message ??
          "No se pudo calcular la vista previa.",
      );
    } finally {
      setPreviaLoading(false);
    }
  };

  const handleRedactarIA = async () => {
    if (contenido.trim().length === 0) {
      setIaError("Escribe un borrador antes de pedir ayuda a la IA.");
      return;
    }
    setIaLoading(true);
    setIaError(null);
    try {
      const data = await redactarConIA({ borrador: contenido, urgente });
      if (data?.texto) {
        setContenido(data.texto);
      }
    } catch (err) {
      setIaError(
        err?.response?.data?.message ?? "No se pudo redactar con IA.",
      );
    } finally {
      setIaLoading(false);
    }
  };

  const handleEnviar = async () => {
    if (!formValido) return;
    setEnviando(true);
    setError(null);
    setEnviadoOk(null);
    try {
      const payload = {
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        alcance,
        urgente,
      };
      if (alcance === "por_ruta") payload.ruta_id = Number(rutaId);
      if (alcance === "por_ciudad") payload.ciudad = ciudad.trim();
      if (programar && programadaPara) {
        payload.programada_para = new Date(programadaPara).toISOString();
      }
      const data = await crearAlertaMasiva(payload);
      setEnviadoOk({
        mensaje:
          data.estado === "programada"
            ? `Alerta programada para ${new Date(data.programada_para).toLocaleString("es-CO")}.`
            : `Alerta enviada a ${data.total_destinatarios} destinatario(s).`,
        id: data.id,
      });
      setTitulo("");
      setContenido("");
      setAlcance("todos");
      setRutaId("");
      setCiudad("");
      setUrgente(false);
      setProgramar(false);
      setProgramadaPara("");
      setPrevia(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "No se pudo crear la alerta.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="space-y-6">
      <NegPageHeader
        eyebrow="HU 3-008"
        title="Crear alerta masiva"
        subtitle="Comunica emergencias o novedades importantes a todos los usuarios, a usuarios de una ruta o a usuarios de una ciudad."
        actions={
          <NegButton
            variant="text"
            icon="list"
            onClick={() => navigate("/negocio/alertas/mis-enviadas")}
          >
            Ver mis alertas enviadas
          </NegButton>
        }
      />

      {enviadoOk && (
        <NegCard
          variant="outlined"
          className="border-emerald-300 bg-emerald-50/80 text-emerald-900"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-700">
              campaign
            </span>
            <div className="flex-1">
              <p className="font-semibold">{enviadoOk.mensaje}</p>
              <button
                type="button"
                onClick={() => navigate("/negocio/alertas/mis-enviadas")}
                className="mt-2 text-sm font-semibold underline text-emerald-800 hover:text-emerald-950"
              >
                Ver estadisticas
              </button>
            </div>
            <button
              type="button"
              onClick={() => setEnviadoOk(null)}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        </NegCard>
      )}

      {error && (
        <NegCard
          variant="outlined"
          className="border-neg-error/40 bg-neg-error-container/40 text-neg-on-error-container"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-neg-error">
              error
            </span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </NegCard>
      )}

      <NegCard className="space-y-5">
        <NegSectionHeader
          title="Contenido del mensaje"
          hint="Titulo y cuerpo de la alerta. Puedes pedir ayuda a la IA para redactarlo."
        />
        <NegInput
          label="Titulo"
          placeholder="Ej. Suspension temporal del servicio en ruta Centro-Norte"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={150}
          required
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-neg-on-surface-variant">
            Contenido
          </label>
          <textarea
            className="w-full rounded-2xl border border-neg-outline-variant bg-neg-surface-container-lowest p-3 text-sm text-neg-on-surface focus:outline-none focus:border-neg-primary"
            rows={5}
            placeholder="Redacta tu borrador. Puedes pedir ayuda a la IA para mejorarlo."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            maxLength={5000}
          />
          <div className="flex justify-end">
            <NegButton
              variant="outlined"
              icon={iaLoading ? "hourglass_top" : "auto_awesome"}
              onClick={handleRedactarIA}
              disabled={iaLoading || contenido.trim().length === 0}
            >
              {iaLoading ? "Redactando..." : "Redactar con IA"}
            </NegButton>
          </div>
          {iaError && (
            <p className="text-xs text-neg-error">{iaError}</p>
          )}
        </div>
      </NegCard>

      <NegCard className="space-y-5">
        <NegSectionHeader
          title="Alcance"
          hint="Selecciona a quien quieres llegar."
        />
        <NegSelect
          label="A quien"
          value={alcance}
          onChange={(e) => {
            setAlcance(e.target.value);
            setPrevia(null);
          }}
          options={[
            { value: "todos", label: "Todos los usuarios" },
            { value: "por_ruta", label: "Usuarios de una ruta" },
            { value: "por_ciudad", label: "Usuarios de una ciudad" },
          ]}
        />
        {alcance === "por_ruta" && (
          <NegSelect
            label="Ruta"
            value={rutaId}
            onChange={(e) => {
              setRutaId(e.target.value);
              setPrevia(null);
            }}
            options={[
              { value: "", label: "Selecciona una ruta..." },
              ...rutas.map((r) => ({
                value: r.id,
                label: r.nombre,
              })),
            ]}
          />
        )}
        {alcance === "por_ciudad" && (
          <NegInput
            label="Ciudad"
            placeholder="Ej. Manizales"
            value={ciudad}
            onChange={(e) => {
              setCiudad(e.target.value);
              setPrevia(null);
            }}
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <NegButton
            variant="outlined"
            icon={previaLoading ? "hourglass_top" : "groups"}
            onClick={handleVistaPrevia}
            disabled={previaLoading || !alcanceCompleto}
          >
            {previaLoading ? "Calculando..." : "Vista previa de destinatarios"}
          </NegButton>
          {previa && (
            <span className="text-sm text-neg-on-surface">
              <strong>{previa.total_destinatarios}</strong> destinatario
              {previa.total_destinatarios === 1 ? "" : "s"} alcanzados.
            </span>
          )}
          {previaError && (
            <span className="text-xs text-neg-error">{previaError}</span>
          )}
        </div>
      </NegCard>

      <NegCard className="space-y-5">
        <NegSectionHeader
          title="Opciones de envio"
          hint="Marca como urgente para prioridad alta. Programa el envio si no es inmediato."
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-neg-error"
            checked={urgente}
            onChange={(e) => setUrgente(e.target.checked)}
          />
          <span className="text-sm">
            <strong>Urgente</strong> — los usuarios reciben prioridad alta y se
            notifica de inmediato.
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-neg-primary"
            checked={programar}
            onChange={(e) => setProgramar(e.target.checked)}
          />
          <span className="text-sm">
            <strong>Programar envio</strong> para una fecha y hora especifica.
          </span>
        </label>
        {programar && (
          <NegInput
            label="Fecha y hora de envio"
            type="datetime-local"
            value={programadaPara}
            onChange={(e) => setProgramadaPara(e.target.value)}
          />
        )}
      </NegCard>

      <div className="flex justify-end gap-3">
        <NegButton
          variant="text"
          onClick={() => navigate("/negocio")}
          disabled={enviando}
        >
          Cancelar
        </NegButton>
        <NegButton
          variant="filled"
          icon={enviando ? "hourglass_top" : programar ? "schedule" : "send"}
          onClick={handleEnviar}
          disabled={!formValido || enviando}
        >
          {enviando
            ? "Enviando..."
            : programar
              ? "Programar alerta"
              : "Enviar ahora"}
        </NegButton>
      </div>
    </section>
  );
}
