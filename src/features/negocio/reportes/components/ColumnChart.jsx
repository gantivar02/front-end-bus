export default function ColumnChart({
  data = [],
  height = 220,
  width = 720,
  valueFormatter = (v) => v,
  colorTone = "primary",
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value)) * 1.15 || 1;
  const paddingX = 32;
  const paddingY = 24;
  const innerW = width - paddingX * 2;
  const innerH = height - paddingY * 2;
  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.55, 44);

  const tones = {
    primary: "#006948",
    secondary: "#4d6357",
    tertiary: "#224959",
    danger: "#ba1a1a",
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

      {data.map((d, i) => {
        const x = paddingX + i * slot + (slot - barW) / 2;
        const h = (d.value / max) * innerH;
        const y = paddingY + innerH - h;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="6"
              fill={tones[colorTone]}
              opacity="0.88"
            />
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="10"
              className="fill-neg-on-surface"
              fontWeight="600"
            >
              {valueFormatter(d.value)}
            </text>
            <text
              x={x + barW / 2}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              className="fill-neg-on-surface-variant"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
