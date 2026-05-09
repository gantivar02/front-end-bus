export default function NegPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}) {
  return (
    <header className="flex flex-col gap-4 mb-6 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-widest font-semibold text-neg-primary mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-neg-on-surface tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-neg-on-surface-variant mt-1 max-w-2xl">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
