export default function NegBarRow({
  label,
  value,
  total,
  formatter,
  tone = "primary",
  hint,
}) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  const tones = {
    primary: "bg-neg-primary",
    secondary: "bg-neg-secondary",
    tertiary: "bg-neg-tertiary",
    danger: "bg-neg-error",
  };
  const formattedValue = formatter ? formatter(value) : value;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-neg-on-surface truncate">{label}</span>
        <span className="font-semibold text-neg-on-surface tabular-nums">
          {formattedValue}
        </span>
      </div>
      <div className="h-2 rounded-full bg-neg-surface-container-high overflow-hidden">
        <div
          className={`h-full rounded-full ${tones[tone]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {hint && (
        <span className="text-[11px] text-neg-on-surface-variant">{hint}</span>
      )}
    </div>
  );
}
