export default function NegRadioCard({
  name,
  value,
  checked,
  onChange,
  icon,
  title,
  description,
  accent = "primary",
  disabled = false,
}) {
  const accents = {
    primary: "border-neg-primary bg-neg-primary-container/50",
    warning: "border-amber-500 bg-amber-50",
    danger: "border-neg-error bg-neg-error-container/60",
  };
  const iconAccents = {
    primary: "bg-neg-primary text-neg-on-primary",
    warning: "bg-amber-500 text-white",
    danger: "bg-neg-error text-neg-on-error",
  };

  const base =
    "relative flex flex-col gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-colors";
  const state = checked
    ? accents[accent]
    : "border-neg-outline-variant bg-neg-surface-container-lowest hover:border-neg-outline";

  return (
    <label className={`${base} ${state} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="sr-only"
      />
      {icon && (
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            checked
              ? iconAccents[accent]
              : "bg-neg-surface-container-high text-neg-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      )}
      <div>
        <p className="text-sm font-bold text-neg-on-surface">{title}</p>
        {description && (
          <p className="text-xs text-neg-on-surface-variant mt-0.5">
            {description}
          </p>
        )}
      </div>
    </label>
  );
}
