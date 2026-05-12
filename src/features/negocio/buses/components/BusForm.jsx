import { useEffect, useRef, useState } from "react";
import { NegButton } from "../../../../components/negocio";
import { listEmpresas } from "../busesService";
import { resolveStaticUrl } from "../../../../services/negocioApi";

const ESTADO_OPTIONS = [
  { value: "operativo", label: "Operativo" },
  { value: "mantenimiento", label: "En mantenimiento" },
  { value: "fuera_de_servicio", label: "Fuera de servicio" },
];

const CURRENT_YEAR = new Date().getFullYear();

const EMPTY = {
  empresa_id: "",
  placa: "",
  modelo: "",
  anio: CURRENT_YEAR,
  capacidad_maxima: "",
  capacidad_sentados: "",
  capacidad_parados: "",
  estado: "operativo",
};

export default function BusForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [empresas, setEmpresas] = useState([]);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    listEmpresas().then(setEmpresas).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        empresa_id: initialData.empresa_id ?? "",
        placa: initialData.placa ?? "",
        modelo: initialData.modelo ?? "",
        anio: initialData.anio ?? CURRENT_YEAR,
        capacidad_maxima: initialData.capacidad_maxima ?? "",
        capacidad_sentados: initialData.capacidad_sentados ?? "",
        capacidad_parados: initialData.capacidad_parados ?? "",
        estado: initialData.estado ?? "operativo",
      });
      setFotoPreview(resolveStaticUrl(initialData.foto_url));
    } else {
      setForm(EMPTY);
      setFotoPreview(null);
    }
    setFotoFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [initialData]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const clearFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("empresa_id", form.empresa_id);
    fd.append("placa", form.placa.toUpperCase());
    fd.append("modelo", form.modelo);
    fd.append("anio", form.anio);
    fd.append("capacidad_maxima", form.capacidad_maxima);
    fd.append("capacidad_sentados", form.capacidad_sentados);
    fd.append("capacidad_parados", form.capacidad_parados);
    fd.append("estado", form.estado);
    if (fotoFile) fd.append("foto", fotoFile);
    onSubmit(fd);
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-neg-outline bg-neg-surface text-neg-on-surface text-sm focus:outline-none focus:border-neg-primary focus:ring-2 focus:ring-neg-primary/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identificación */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-bold text-neg-on-surface-variant/80">
          Identificación
        </h3>

        <div>
          <label className="block text-sm font-medium text-neg-on-surface mb-1.5">
            Empresa <span className="text-neg-error">*</span>
          </label>
          <select value={form.empresa_id} onChange={set("empresa_id")} required className={inputCls}>
            <option value="">Seleccionar empresa</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neg-on-surface mb-1.5">
              Placa <span className="text-neg-error">*</span>
            </label>
            <input
              type="text"
              value={form.placa}
              onChange={(e) =>
                setForm((p) => ({ ...p, placa: e.target.value.toUpperCase() }))
              }
              required
              maxLength={10}
              placeholder="ABC123"
              className={inputCls + " font-mono uppercase"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neg-on-surface mb-1.5">
              Año <span className="text-neg-error">*</span>
            </label>
            <input
              type="number"
              value={form.anio}
              onChange={set("anio")}
              required
              min={1900}
              max={2100}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neg-on-surface mb-1.5">
            Modelo <span className="text-neg-error">*</span>
          </label>
          <input
            type="text"
            value={form.modelo}
            onChange={set("modelo")}
            required
            maxLength={100}
            placeholder="Ej. Mercedes-Benz OF-1721"
            className={inputCls}
          />
        </div>
      </div>

      {/* Capacidad */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs uppercase tracking-widest font-bold text-neg-on-surface-variant/80">
          Capacidad de pasajeros
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neg-on-surface mb-1.5">
              Total máx. <span className="text-neg-error">*</span>
            </label>
            <input
              type="number"
              value={form.capacidad_maxima}
              onChange={set("capacidad_maxima")}
              required
              min={1}
              placeholder="80"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neg-on-surface mb-1.5">
              Sentados <span className="text-neg-error">*</span>
            </label>
            <input
              type="number"
              value={form.capacidad_sentados}
              onChange={set("capacidad_sentados")}
              required
              min={0}
              placeholder="40"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neg-on-surface mb-1.5">
              Parados <span className="text-neg-error">*</span>
            </label>
            <input
              type="number"
              value={form.capacidad_parados}
              onChange={set("capacidad_parados")}
              required
              min={0}
              placeholder="40"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Estado y foto */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs uppercase tracking-widest font-bold text-neg-on-surface-variant/80">
          Estado y foto
        </h3>

        <div>
          <label className="block text-sm font-medium text-neg-on-surface mb-1.5">
            Estado <span className="text-neg-error">*</span>
          </label>
          <select value={form.estado} onChange={set("estado")} required className={inputCls}>
            {ESTADO_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neg-on-surface mb-2">
            Foto del bus
          </label>
          {fotoPreview && (
            <div className="mb-3 relative">
              <img
                src={fotoPreview}
                alt="Foto del bus"
                className="h-36 w-full object-cover rounded-xl border border-neg-outline"
              />
              <button
                type="button"
                onClick={clearFoto}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-neg-error flex items-center justify-center shadow"
              >
                <span className="material-symbols-outlined text-[16px] text-white">close</span>
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-neg-outline text-sm text-neg-on-surface-variant hover:border-neg-primary hover:text-neg-primary cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            <span>{fotoFile ? fotoFile.name : "Seleccionar imagen (máx. 5 MB)"}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFoto}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-neg-outline-variant">
        <NegButton type="button" variant="outlined" onClick={onCancel} disabled={loading}>
          Cancelar
        </NegButton>
        <NegButton type="submit" icon={loading ? "hourglass_top" : "save"} disabled={loading}>
          {loading ? "Guardando..." : initialData ? "Guardar cambios" : "Registrar bus"}
        </NegButton>
      </div>
    </form>
  );
}
