export default function NegChip({
  tone = "neutral",
  icon,
  className = "",
  children,
  ...rest
}) {
  const tones = {
    neutral:
      "bg-neg-surface-container-high text-neg-on-surface-variant border-neg-outline-variant",
    primary:
      "bg-neg-primary-container text-neg-on-primary-container border-transparent",
    secondary:
      "bg-neg-secondary-container text-neg-on-secondary-container border-transparent",
    tertiary:
      "bg-neg-tertiary-container text-neg-on-tertiary-container border-transparent",
    success: "bg-neg-primary-container text-neg-on-primary-container border-transparent",
    warning: "bg-amber-100 text-amber-900 border-transparent",
    danger:
      "bg-neg-error-container text-neg-on-error-container border-transparent",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 h-7 rounded-full border text-xs font-semibold ${tones[tone]} ${className}`}
      {...rest}
    >
      {icon && (
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
      )}
      {children}
    </span>
  );
}
