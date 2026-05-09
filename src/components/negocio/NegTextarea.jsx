import { forwardRef } from "react";

const NegTextarea = forwardRef(function NegTextarea(
  { label, hint, error, rows = 4, className = "", id, ...rest },
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
        className={`rounded-lg bg-neg-surface-container-lowest border px-3 py-2 transition-colors ${borderClass}`}
      >
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className="w-full bg-transparent outline-none text-sm text-neg-on-surface placeholder:text-neg-on-surface-variant/70 resize-none"
          {...rest}
        />
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

export default NegTextarea;
