const SCRIPT_URL = "https://checkout.epayco.co/checkout.js";

let loaderPromise = null;

export function loadEpaycoCheckout() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Entorno sin window"));
  }
  if (window.ePayco) return Promise.resolve(window.ePayco);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.ePayco));
      existing.addEventListener("error", () =>
        reject(new Error("No se pudo cargar ePayco")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.ePayco);
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("No se pudo cargar ePayco"));
    };
    document.body.appendChild(script);
  });

  return loaderPromise;
}

export async function abrirCheckoutEpayco(epayco) {
  const ePayco = await loadEpaycoCheckout();
  if (!ePayco?.checkout) {
    throw new Error("ePayco checkout no disponible");
  }
  const handler = ePayco.checkout.configure({
    key: epayco.public_key,
    test: !!epayco.test_mode,
  });
  handler.open({
    name: "Recarga tarjeta transporte",
    description: epayco.description,
    invoice: epayco.invoice,
    currency: epayco.currency?.toLowerCase?.() ?? "cop",
    amount: String(epayco.amount),
    tax_base: String(epayco.tax_base),
    tax: String(epayco.tax),
    country: "co",
    lang: "es",
    external: "false",
    name_billing: epayco.name_billing,
    email_billing: epayco.email_billing,
  });
}
