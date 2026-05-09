export default function LineAreaChart({
  series = [],
  labels = [],
  height = 220,
  width = 720,
  showDots = true,
}) {
  if (series.length === 0 || labels.length === 0) return null;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues) * 1.1 || 1;
  const paddingX = 40;
  const paddingY = 24;
  const innerW = width - paddingX * 2;
  const innerH = height - paddingY * 2;

  const xAt = (idx) =>
    paddingX + (labels.length === 1 ? 0 : (idx * innerW) / (labels.length - 1));
  const yAt = (val) => paddingY + innerH - (val / max) * innerH;

  const toPath = (values) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(v)}`).join(" ");

  const toArea = (values) => {
    const lastIdx = values.length - 1;
    return `${toPath(values)} L ${xAt(lastIdx)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`;
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => paddingY + innerH * p);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
    >
      {gridLines.map((y, i) => (
        <line
          key={i}
          x1={paddingX}
          x2={width - paddingX}
          y1={y}
          y2={y}
          stroke="#e0e3e0"
          strokeDasharray="3 4"
        />
      ))}

      {labels.map((lbl, i) => (
        <text
          key={lbl}
          x={xAt(i)}
          y={height - 6}
          textAnchor="middle"
          className="fill-neg-on-surface-variant"
          fontSize="10"
        >
          {lbl}
        </text>
      ))}

      {series.map((s, si) => (
        <g key={s.label}>
          <defs>
            <linearGradient id={`grad-${si}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={toArea(s.values)} fill={`url(#grad-${si})`} />
          <path
            d={toPath(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {showDots &&
            s.values.map((v, i) => (
              <circle
                key={i}
                cx={xAt(i)}
                cy={yAt(v)}
                r="3"
                fill="#fff"
                stroke={s.color}
                strokeWidth="2"
              />
            ))}
        </g>
      ))}
    </svg>
  );
}
