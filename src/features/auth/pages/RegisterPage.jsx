import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../services/registerService";
import {
  getPasswordRequirementChecks,
  getPasswordStrength,
  isPasswordValid,
} from "../utils/passwordValidation";

const initialForm = {
  name: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validateRegisterForm(form) {
  if (
    !form.name.trim() ||
    !form.lastName.trim() ||
    !form.email.trim() ||
    !form.password ||
    !form.confirmPassword
  ) {
    return "Completa todos los campos antes de continuar.";
  }
  if (!isPasswordValid(form.password)) {
    return "La contraseña no cumple los requisitos minimos de seguridad.";
  }
  if (form.password !== form.confirmPassword) {
    return "La contraseña y su confirmacion deben coincidir.";
  }
  return "";
}

const strengthBarColor = { neutral: "bg-surface-container-high", weak: "bg-red-500", medium: "bg-amber-500", strong: "bg-green-500" };
const strengthTextColor = { neutral: "text-on-surface-variant", weak: "text-red-600", medium: "text-amber-600", strong: "text-green-600" };

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = useMemo(() => getPasswordRequirementChecks(form.password), [form.password]);
  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleChange = ({ target }) => {
    setError("");
    setSuccess(null);
    setForm((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateRegisterForm(form);
    if (validationError) { setError(validationError); return; }
    try {
      setLoading(true);
      setError("");
      const response = await registerUser({
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccess({
        message: response.message || "Cuenta creada exitosamente. Te enviamos un correo de confirmacion.",
        email: response.email || form.email.trim(),
      });
      setForm(initialForm);
    } catch (currentError) {
      const status = currentError.response?.status;
      const backendMessage = currentError.response?.data?.message;
      if (status === 409) setError(backendMessage || "Este correo ya esta registrado en el sistema.");
      else if (status === 400) setError(backendMessage || "Revisa los datos ingresados y vuelve a intentarlo.");
      else setError(backendMessage || "No fue posible completar el registro en este momento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[1100px] relative z-10">
        {/* Brand header — same style as Login & ForgotPassword */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container text-on-primary-container mb-4 shadow-lg">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_person
            </span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-1 block">JAP Team</h1>
          <p className="text-on-surface-variant font-medium">Smart Bus Management System</p>
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-xl shadow-[0px_12px_32px_-4px_rgba(25,28,30,0.06)] bg-surface-container-lowest">
          {/* Left: Visual panel */}
          <div
            className="hidden lg:flex lg:col-span-5 relative flex-col items-center justify-center overflow-hidden min-h-[620px]"
            style={{ background: "linear-gradient(145deg, #000d33 0%, #003a9e 55%, #090f24 100%)" }}
          >
            {/* Dot grid */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(rgba(100,160,255,0.9) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
            />
            {/* Top glow orb */}
            <div
              className="absolute top-[-8%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle, #4d8bff 0%, transparent 68%)" }}
            />
            {/* Bottom-right glow orb */}
            <div
              className="absolute bottom-[-8%] right-[-8%] w-60 h-60 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
            />

            {/* Central content */}
            <div className="relative z-10 flex flex-col items-center text-center px-10">
              <div
                className="w-32 h-32 rounded-3xl flex items-center justify-center mb-7"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontSize: "72px", fontVariationSettings: "'FILL' 1" }}
                >
                  directions_bus
                </span>
              </div>
              <p className="text-white/90 text-2xl font-extrabold font-headline leading-snug mb-2">
                Gestión Inteligente<br />de Flota
              </p>
              <p className="text-white/40 text-[11px] uppercase tracking-widest font-label">
                Smart Transit Network
              </p>
            </div>

            {/* Bottom info strip */}
            <div
              className="absolute bottom-8 inset-x-8 flex items-center gap-3 p-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <span className="material-symbols-outlined text-white/60 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">
                Conexión cifrada AES-256
              </span>
            </div>
          </div>

          {/* Right: Form panel */}
          <div className="lg:col-span-7 p-8 md:p-14 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-on-surface mb-2 font-headline">Crear tu cuenta</h2>
                <p className="text-on-surface-variant">Únete al centro de mando de microservicios seguros.</p>
              </div>

            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <span className="material-symbols-outlined text-green-600 text-5xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="font-bold text-green-800 mb-2">{success.message}</p>
                <p className="text-sm text-green-700 mb-6">Revisa el correo <strong>{success.email}</strong> para confirmar tu cuenta.</p>
                <Link to="/login" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Ir a iniciar sesión
                </Link>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Name + Last name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="name">Nombre</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline text-xl">person</span>
                      </div>
                      <input
                        className="block w-full pl-10 pr-3 py-3 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-outline text-sm transition-all"
                        id="name" name="name" placeholder="Juan" type="text"
                        value={form.name} onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="lastName">Apellido</label>
                    <input
                      className="block w-full px-3 py-3 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-outline text-sm transition-all"
                      id="lastName" name="lastName" placeholder="Pérez" type="text"
                      value={form.lastName} onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="email">Correo electrónico</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-xl">mail</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-3 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-outline text-sm transition-all"
                      id="email" name="email" placeholder="admin@sentinel.io" type="email"
                      value={form.email} onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Contraseña</label>
                    <span className="text-xs font-medium text-outline">Mín. 8 caracteres</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-xl">lock</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-12 py-3 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-outline text-sm transition-all"
                      id="password" name="password" placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={form.password} onChange={handleChange}
                    />
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-primary transition-colors"
                      type="button" onClick={() => setShowPassword((v) => !v)}
                    >
                      <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  {form.password && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-on-surface-variant">Fortaleza</span>
                        <span className={`text-xs font-bold ${strengthTextColor[passwordStrength.tone]}`}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strengthBarColor[passwordStrength.tone]}`} style={{ width: `${passwordStrength.progress}%` }} />
                      </div>
                      <ul className="space-y-1 pt-0.5">
                        {passwordChecks.map((req) => (
                          <li key={req.id} className={`flex items-center gap-1.5 text-xs ${req.passed ? "text-green-600" : "text-on-surface-variant/50"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "13px", fontVariationSettings: req.passed ? "'FILL' 1" : "'FILL' 0" }}>
                              {req.passed ? "check_circle" : "radio_button_unchecked"}
                            </span>
                            {req.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="confirmPassword">Confirmar contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-xl">lock_reset</span>
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-3 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-outline text-sm transition-all"
                      id="confirmPassword" name="confirmPassword" placeholder="••••••••" type="password"
                      value={form.confirmPassword} onChange={handleChange}
                    />
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-error mt-1">La confirmación no coincide con la contraseña.</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-error-container/30 text-error rounded-xl text-sm">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                  </div>
                )}

                <button
                  className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                  type="submit" disabled={loading}
                >
                  <span>{loading ? "Creando cuenta..." : "Inicializar cuenta"}</span>
                  {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-outline-variant/20 text-center">
              <p className="text-on-surface-variant text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link to="/login" className="text-primary font-bold hover:underline ml-1">Iniciar sesión en JAP Team</Link>
              </p>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
