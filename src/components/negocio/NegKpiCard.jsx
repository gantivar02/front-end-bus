import NegCard from "./NegCard";

export default function NegKpiCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  iconTone = "primary",
  hint,
}) {
  const iconTones = {
    primary: "bg-neg-primary-container text-neg-on-primary-container",
    secondary: "bg-neg-secondary-container text-neg-on-secondary-container",
    tertiary: "bg-neg-tertiary-container text-neg-on-tertiary-container",
    danger: "bg-neg-error-container text-neg-on-error-container",
  };

  const deltaTones = {
    neutral: "text-neg-on-surface-variant",
    up: "text-neg-primary",
    down: "text-neg-error",
  };

  return (
    <NegCard variant="elevated" padding="md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-neg-on-surface-variant">
            {label}
          </p>
          <p className="mt-2 font-headline text-3xl font-bold text-neg-on-surface">
            {value}
          </p>
          {delta != null && (
            <p className={`mt-1 text-xs font-semibold ${deltaTones[deltaTone]}`}>
              {delta}
            </p>
          )}
          {hint && (
            <p className="mt-1 text-xs text-neg-on-surface-variant">{hint}</p>
          )}
        </div>
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconTones[iconTone]}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        )}
      </div>
    </NegCard>
  );
}
