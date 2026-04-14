const RECAPTCHA_SCRIPT_ID = "google-recaptcha-v3-script";

const recaptchaSiteKey =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() || "";

let scriptLoadPromise = null;

function getRecaptchaGlobal() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.grecaptcha || null;
}

function waitForRecaptchaReady() {
  return new Promise((resolve, reject) => {
    const grecaptcha = getRecaptchaGlobal();

    if (!grecaptcha?.ready) {
      reject(new Error("reCAPTCHA no esta disponible."));
      return;
    }

    grecaptcha.ready(() => resolve(grecaptcha));
  });
}

export function loadRecaptchaScript() {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("reCAPTCHA solo se puede cargar en el navegador."));
  }

  if (!recaptchaSiteKey) {
    return Promise.reject(
      new Error(
        "Falta configurar VITE_RECAPTCHA_SITE_KEY en el archivo .env. Agrega la site key publica de Google reCAPTCHA y reinicia Vite."
      )
    );
  }

  if (getRecaptchaGlobal()?.execute) {
    return waitForRecaptchaReady();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);

    const handleLoad = () => {
      waitForRecaptchaReady().then(resolve).catch(reject);
    };

    const handleError = () => {
      reject(new Error("No fue posible cargar Google reCAPTCHA."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = handleLoad;
    script.onerror = handleError;

    document.head.appendChild(script);
  }).catch((error) => {
    scriptLoadPromise = null;
    throw error;
  });

  return scriptLoadPromise;
}

export async function executeRecaptcha(action) {
  const grecaptcha = await loadRecaptchaScript();
  const token = await grecaptcha.execute(recaptchaSiteKey, { action });

  if (!token) {
    throw new Error("No se pudo obtener el token de reCAPTCHA.");
  }

  return token;
}

export async function warmUpRecaptcha() {
  await loadRecaptchaScript();
}

export function getRecaptchaSiteKey() {
  return recaptchaSiteKey;
}
