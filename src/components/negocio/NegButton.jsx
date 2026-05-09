export default function NegButton({
  variant = "filled",
  size = "md",
  icon,
  iconEnd,
  fullWidth = false,
  className = "",
  children,
  type = "button",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    filled:
      "bg-neg-primary text-neg-on-primary hover:bg-neg-primary/90 active:bg-neg-primary",
    tonal:
      "bg-neg-primary-container text-neg-on-primary-container hover:bg-neg-primary-container/80",
    outlined:
      "border border-neg-outline text-neg-primary hover:bg-neg-primary/5",
    text: "text-neg-primary hover:bg-neg-primary/5",
    danger:
      "bg-neg-error text-neg-on-error hover:bg-neg-error/90",
    "danger-tonal":
      "bg-neg-error-container text-neg-on-error-container hover:bg-neg-error-container/80",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    >
      {icon && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
      {iconEnd && (
        <span className="material-symbols-outlined text-[18px]">{iconEnd}</span>
      )}
    </button>
  );
}
