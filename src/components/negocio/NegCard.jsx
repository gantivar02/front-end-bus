export default function NegCard({
  as: Tag = "div",
  variant = "elevated",
  padding = "md",
  className = "",
  children,
  ...rest
}) {
  const base = "rounded-2xl";
  const variants = {
    elevated:
      "bg-neg-surface-container-lowest border border-neg-outline-variant/60 shadow-sentinel",
    filled: "bg-neg-surface-container",
    outlined: "bg-neg-surface-container-lowest border border-neg-outline-variant",
    subtle: "bg-neg-surface-container-low",
  };
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <Tag
      className={`${base} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
