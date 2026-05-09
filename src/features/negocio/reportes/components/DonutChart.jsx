const TONE_COLORS = {
  primary: "#006948",
  secondary: "#4d6357",
  tertiary: "#224959",
  danger: "#ba1a1a",
  amber: "#d97706",
  violet: "#7c3aed",
};

export default function DonutChart({
  data = [],
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = data.map((d) => {
    const fraction = d.value / total;
    const length = circumference * fraction;
    const arc = {
      ...d,
      length,
      offset,
      color: TONE_COLORS[d.tone] ?? d.color ?? "#006948",
      percent: fraction * 100,
    };
    offset += length;
    return arc;
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e3e0"
          strokeWidth={thickness}
        />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={`${a.length} ${circumference - a.length}`}
            strokeDashoffset={-a.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="-mt-[110px] pointer-events-none text-center">
          {centerValue && (
            <p className="font-headline text-2xl font-bold text-neg-on-surface">
              {centerValue}
            </p>
          )}
          {centerLabel && (
            <p className="text-[11px] uppercase tracking-wider text-neg-on-surface-variant">
              {centerLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
