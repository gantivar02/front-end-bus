export default function NegSegmentedControl({
  value,
  onChange,
  options = [],
  className = "",
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 rounded-full bg-neg-surface-container-high ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.value)}
            className={`px-4 h-9 rounded-full text-xs font-semibold transition-colors ${
              active
                ? "bg-neg-surface-container-lowest text-neg-on-surface shadow-sm"
                : "text-neg-on-surface-variant hover:text-neg-on-surface"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
