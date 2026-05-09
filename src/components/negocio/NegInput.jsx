import { forwardRef } from "react";

const NegInput = forwardRef(function NegInput(
  {
    label,
    hint,
    error,
    iconStart,
    iconEnd,
    className = "",
    id,
    ...rest
  },
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
        className={`flex items-center gap-2 h-11 rounded-lg bg-neg-surface-container-lowest border px-3 transition-colors ${borderClass}`}
      >
        {iconStart && (
          <span className="material-symbols-outlined text-[18px] text-neg-on-surface-variant">
            {iconStart}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className="flex-1 bg-transparent outline-none text-sm text-neg-on-surface placeholder:text-neg-on-surface-variant/70"
          {...rest}
        />
        {iconEnd && (
          <span className="material-symbols-outlined text-[18px] text-neg-on-surface-variant">
            {iconEnd}
          </span>
        )}
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

export default NegInput;
