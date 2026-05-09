import { formatCurrency } from "../../_utils/format";

export default function MontoSelector({ value, onChange, options = [] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {options.map((amount) => {
        const active = value === amount;
        return (
          <button
            key={amount}
            type="button"
            onClick={() => onChange?.(amount)}
            className={`h-11 rounded-full border font-semibold text-sm transition-colors ${
              active
                ? "bg-neg-primary text-neg-on-primary border-neg-primary"
                : "bg-neg-surface-container-lowest text-neg-on-surface border-neg-outline-variant hover:border-neg-outline"
            }`}
          >
            {formatCurrency(amount)}
          </button>
        );
      })}
    </div>
  );
}
