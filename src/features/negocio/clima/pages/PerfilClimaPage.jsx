import { useEffect, useState } from "react";
import { NegPageHeader, NegCard, NegButton } from "../../../../components/negocio";
import { getClimaPerfi, updateClimaPerfil } from "../climaPerfilService";

const CANALES = [
  { value: "email", label: "Email", icon: "email" },
  { value: "push", label: "Push (app)", icon: "notifications" },
  { value: "whatsapp", label: "WhatsApp", icon: "chat" },
];

export default function PerfilClimaPage() {
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({
    alertas_clima_activas: false,
    horario_viaje: "07:00",
    canal_notificacion_preferido: "email",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getClimaPerfi()
      .then((data) => {
        setPerfil(data);
        setForm({
          alertas_clima_activas: data.alertas_clima_activas ?? false,
          horario_viaje: data.horario_viaje?.slice(0, 5) ?? "07:00",
          canal_notificacion_preferido: data.canal_notificacion_preferido ?? "email",
        });
      })
      .catch(() => setError("No se pudo cargar el perfil."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateClimaPerfil(form);
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.message ?? "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-neg-on-surface-variant text-sm">
        <span className="material-symbols-outlined text-[36px] block mb-2 animate-spin" style={{ animationDuration: "1s" }}>
          progress_activity
        </span>
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <NegPageHeader
        eyebrow="HU 3-013"
        title="Alertas de clima"
        subtitle="Recibí el pronóstico del tiempo cada mañana antes de tu viaje."
      />

      {perfil?.ciudad && (
        <NegCard padding="sm" className="mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-neg-primary">location_city</span>
          <div>
            <p className="text-xs text-neg-on-surface-variant">Ciudad configurada</p>
            <p className="text-sm font-semibold text-neg-on-surface">{perfil.ciudad}</p>
          </div>
        </NegCard>
      )}

      {!perfil?.ciudad && (
        <NegCard className="mb-4 border border-yellow-400" padding="sm">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            No tenés ciudad configurada en tu perfil. Contactá al administrador para agregar tu ciudad y recibir el clima correcto.
          </div>
        </NegCard>
      )}

      <NegCard>
        {/* Toggle alertas */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-neg-on-surface">Activar alertas de clima</p>
            <p className="text-xs text-neg-on-surface-variant mt-0.5">
              Recibís el pronóstico todos los días a las 6:00 AM
            </p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, alertas_clima_activas: !f.alertas_clima_activas }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              form.alertas_clima_activas ? "bg-neg-primary" : "bg-neg-outline"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                form.alertas_clima_activas ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {form.alertas_clima_activas && (
          <div className="space-y-5 border-t border-neg-outline-variant pt-5">
            {/* Horario de viaje */}
            <div>
              <label className="block text-sm font-medium text-neg-on-surface mb-1.5">
                Horario habitual de viaje
              </label>
              <p className="text-xs text-neg-on-surface-variant mb-2">
                La alerta se enviará hasta 2 horas antes de este horario.
              </p>
              <input
                type="time"
                value={form.horario_viaje}
                onChange={(e) => setForm((f) => ({ ...f, horario_viaje: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-neg-outline bg-neg-surface text-neg-on-surface text-sm focus:outline-none focus:border-neg-primary focus:ring-2 focus:ring-neg-primary/20"
              />
            </div>

            {/* Canal de notificación */}
            <div>
              <label className="block text-sm font-medium text-neg-on-surface mb-2">
                Canal de notificación
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CANALES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setForm((f) => ({ ...f, canal_notificacion_preferido: c.value }))}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-colors ${
                      form.canal_notificacion_preferido === c.value
                        ? "bg-neg-primary/10 border-neg-primary text-neg-primary"
                        : "border-neg-outline text-neg-on-surface-variant hover:bg-neg-surface-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
              {form.canal_notificacion_preferido !== "email" && (
                <p className="text-xs text-neg-on-surface-variant mt-2">
                  * Por ahora solo el canal Email está disponible.
                </p>
              )}
            </div>

            {/* Preview mensaje */}
            <div className="rounded-xl bg-neg-surface-container p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-neg-on-surface-variant mb-2">
                Ejemplo de mensaje
              </p>
              {Math.random() > 0.5 ? (
                <p className="text-sm text-neg-on-surface">
                  🌧 Hoy lloverá ({Math.floor(Math.random() * 30) + 55}% probabilidad). Temperatura: 16°C.
                  Te recomendamos salir 15 minutos antes. ¡No olvides tu paraguas!
                </p>
              ) : (
                <p className="text-sm text-neg-on-surface">
                  ☀ Clima favorable hoy. Temperatura: 22°C. ¡Buen viaje!
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 px-3 py-2 rounded-xl border border-neg-error bg-neg-error-container/30 text-neg-error text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </div>
        )}

        {saved && (
          <div className="mt-4 px-3 py-2 rounded-xl border border-green-400 bg-green-50 text-green-700 text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Configuración guardada correctamente.
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-neg-outline-variant">
          <NegButton
            icon={saving ? "hourglass_top" : "save"}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </NegButton>
        </div>
      </NegCard>
    </div>
  );
}
