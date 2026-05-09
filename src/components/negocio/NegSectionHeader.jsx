export default function NegSectionHeader({ title, hint, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div>
        <h2 className="font-headline text-lg font-bold text-neg-on-surface">
          {title}
        </h2>
        {hint && (
          <p className="text-xs text-neg-on-surface-variant mt-0.5">{hint}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
