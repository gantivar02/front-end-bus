import { useState } from "react";
import { unlinkGoogle } from "../../auth/services/googleAuthService";
import { unlinkGithub } from "../../auth/services/githubAuthService";
import { useAuth } from "../../../context/AuthContext";

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const GoogleLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GithubLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

export default function AccountSettingsPage() {
  const { token } = useAuth();
  const claims = token ? decodeJwtPayload(token) : null;
  const githubUsername = claims?.githubUsername ?? null;

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleMessage, setGoogleMessage] = useState("");
  const [googleError, setGoogleError] = useState("");

  const [githubLoading, setGithubLoading] = useState(false);
  const [githubMessage, setGithubMessage] = useState("");
  const [githubError, setGithubError] = useState("");
  const [githubUnlinked, setGithubUnlinked] = useState(false);

  const handleUnlinkGoogle = async () => {
    if (!window.confirm("¿Seguro que deseas desvincular tu cuenta de Google?")) return;
    try {
      setGoogleLoading(true);
      setGoogleMessage("");
      setGoogleError("");
      const response = await unlinkGoogle();
      setGoogleMessage(response.message || "Cuenta de Google desvinculada correctamente.");
    } catch (currentError) {
      const status = currentError.response?.status;
      const backendMessage = currentError.response?.data?.message;
      if (status === 409) setGoogleError(backendMessage || "Tu cuenta no tiene una integración de Google vinculada.");
      else setGoogleError(backendMessage || "No fue posible desvincular la cuenta de Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleUnlinkGithub = async () => {
    if (!window.confirm("¿Seguro que deseas desvincular tu cuenta de GitHub?")) return;
    try {
      setGithubLoading(true);
      setGithubMessage("");
      setGithubError("");
      const response = await unlinkGithub();
      setGithubMessage(response.message || "Cuenta de GitHub desvinculada correctamente.");
      setGithubUnlinked(true);
    } catch (currentError) {
      const status = currentError.response?.status;
      const backendMessage = currentError.response?.data?.message;
      if (status === 409) setGithubError(backendMessage || "Tu cuenta no tiene GitHub vinculado.");
      else setGithubError(backendMessage || "No fue posible desvincular la cuenta de GitHub.");
    } finally {
      setGithubLoading(false);
    }
  };

  const userEmail = claims?.sub || claims?.email || "—";
  const userName = claims?.name || "Admin";

  return (
    <div className="max-w-4xl">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Configuración de Cuenta</h1>
        <p className="text-on-surface-variant max-w-2xl">
          Administra tus conexiones externas y la seguridad de tu perfil de acceso al sistema JAP Team.
        </p>
      </div>

      {/* Linked accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Google card */}
        <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#f2f2f2] flex items-center justify-center">
                <GoogleLogo />
              </div>
              <span className="px-3 py-1 bg-green-600/10 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                {googleMessage ? "Desvinculado" : "Disponible"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-1">Google</h3>
            <p className="text-sm text-on-surface-variant font-medium mb-2">
              Vincula tu cuenta de Google para iniciar sesión con un solo clic.
            </p>
            {googleMessage && <p className="text-sm text-green-700 font-medium mt-2">{googleMessage}</p>}
            {googleError && <p className="text-sm text-error font-medium mt-2">{googleError}</p>}
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/15 mt-6">
            <span className="text-xs font-semibold text-on-surface-variant/60">OAuth 2.0 · Google Identity</span>
            <button
              onClick={handleUnlinkGoogle}
              disabled={googleLoading}
              className="px-5 py-2 rounded-lg bg-error text-on-error text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm disabled:opacity-60"
            >
              {googleLoading ? "Desvinculando..." : "Desvincular"}
            </button>
          </div>
        </div>

        {/* GitHub card */}
        <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#24292e] flex items-center justify-center">
                <GithubLogo />
              </div>
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${githubUsername && !githubUnlinked ? "bg-green-600/10 text-green-700" : "bg-surface-container text-on-surface-variant"}`}>
                {githubUsername && !githubUnlinked ? "Vinculado" : "No vinculado"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-1">GitHub</h3>
            <p className="text-sm text-on-surface-variant font-medium">
              {githubUsername && !githubUnlinked ? (
                <>Tu cuenta está vinculada como <strong>@{githubUsername}</strong>.</>
              ) : (
                "Tu cuenta no tiene ningún usuario de GitHub vinculado."
              )}
            </p>
            {githubMessage && <p className="text-sm text-green-700 font-medium mt-2">{githubMessage}</p>}
            {githubError && <p className="text-sm text-error font-medium mt-2">{githubError}</p>}
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/15 mt-6">
            <span className="text-xs font-semibold text-on-surface-variant/60">OAuth Apps · GitHub</span>
            {githubUsername && !githubUnlinked && (
              <button
                onClick={handleUnlinkGithub}
                disabled={githubLoading}
                className="px-5 py-2 rounded-lg bg-error text-on-error text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm disabled:opacity-60"
              >
                {githubLoading ? "Desvinculando..." : "Desvincular"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Security insights dark card */}
      <div className="bg-slate-900 rounded-xl p-8 overflow-hidden relative mb-10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-blue-400" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Estado de seguridad</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">Tu cuenta está protegida</h2>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Usuario</p>
              <p className="text-white font-semibold text-sm">{userName}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Email</p>
              <p className="text-white font-semibold text-sm">{userEmail}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl">
              <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">GitHub</p>
              <p className="text-white font-semibold text-sm">
                {githubUsername && !githubUnlinked ? `@${githubUsername}` : "No vinculado"}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
          <span className="material-symbols-outlined text-[280px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        </div>
      </div>

      {/* Danger zone */}
      <div className="pt-8 border-t border-outline-variant/30">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-error">warning</span>
          <h2 className="text-lg font-bold text-on-surface">Zona de Peligro</h2>
        </div>
        <div className="bg-error-container/20 border border-error/10 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="font-bold text-on-surface">Eliminar cuenta permanentemente</p>
            <p className="text-sm text-on-surface-variant mt-1">
              Una vez eliminada la cuenta, no hay marcha atrás. Todos los permisos y roles serán revocados.
            </p>
          </div>
          <button className="ml-6 flex-shrink-0 px-6 py-2.5 rounded-lg border-2 border-error text-error text-sm font-bold hover:bg-error hover:text-on-error transition-all active:scale-95">
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
