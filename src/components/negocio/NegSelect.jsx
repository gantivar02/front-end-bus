import { forwardRef } from "react";

const NegSelect = forwardRef(function NegSelect(
  { label, hint, error, options = [], placeholder, className = "", id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  const borderClass = error
    ? "border-neg-error focus-within:border-neg-error"
    : "border-neg-outline-variant focus-within:border-neg-primary";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-neg-on-surface-variant"
        >
          {label}
        </label>
      )}
      <div
        className={`flex items-center gap-2 h-11 rounded-lg bg-neg-surface-container-lowest border pl-3 pr-2 transition-colors ${borderClass}`}
      >
        <select
          ref={ref}
          id={inputId}
          className="flex-1 bg-transparent outline-none text-sm text-neg-on-surface appearance-none"
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined text-[18px] text-neg-on-surface-variant pointer-events-none">
          expand_more
        </span>
      </div>
      {(hint || error) && (
        <p
          className={`text-xs ${
            error ? "text-neg-error" : "text-neg-on-surface-variant"
          }`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

export default NegSelect;
