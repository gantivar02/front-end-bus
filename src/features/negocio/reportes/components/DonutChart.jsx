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
  onSegmentClick,
  selectedLabel,
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
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 block"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e3e0"
          strokeWidth={thickness}
        />
        {arcs.map((a) => {
          const isSelected = selectedLabel === a.label;
          const interactive = typeof onSegmentClick === "function";
          return (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={isSelected ? thickness + 6 : thickness}
              strokeDasharray={`${a.length} ${circumference - a.length}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
              onClick={interactive ? () => onSegmentClick(a) : undefined}
              style={{
                cursor: interactive ? "pointer" : "default",
                transition: "stroke-width 120ms ease, opacity 120ms ease",
                opacity:
                  selectedLabel && !isSelected ? 0.55 : 1,
              }}
            >
              <title>
                {`${a.label}: ${a.value} (${a.percent.toFixed(1)}%)`}
              </title>
            </circle>
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
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
