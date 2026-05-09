import NegCard from "../../../../components/negocio/NegCard";
import { formatCurrency } from "../../_utils/format";

export default function SaldoCard({ tarjeta, titular, saldo, nuevoSaldo }) {
  return (
    <NegCard
      variant="filled"
      className="relative overflow-hidden bg-neg-tertiary text-neg-on-tertiary"
    >
      <div
        aria-hidden
        className="absolute -right-6 -top-10 w-32 h-32 rounded-full bg-neg-on-tertiary/10"
      />
      <div
        aria-hidden
        className="absolute -right-12 bottom-0 w-40 h-40 rounded-full bg-neg-on-tertiary/5"
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest font-semibold opacity-80">
            Tarjeta civic
          </p>
          <span className="material-symbols-outlined">contactless</span>
        </div>
        <p className="mt-4 font-mono text-lg tracking-widest">
          {tarjeta ?? "•••• •••• •••• ••••"}
        </p>
        <p className="mt-4 text-[11px] uppercase tracking-widest opacity-70">
          Titular
        </p>
        <p className="font-semibold">{titular ?? "—"}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-70">
              Saldo actual
            </p>
            <p className="font-headline text-2xl font-bold">
              {formatCurrency(saldo)}
            </p>
          </div>
          {nuevoSaldo != null && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest opacity-70">
                Nuevo saldo
              </p>
              <p className="font-headline text-lg font-bold">
                {formatCurrency(nuevoSaldo)}
              </p>
            </div>
          )}
        </div>
      </div>
    </NegCard>
  );
}
