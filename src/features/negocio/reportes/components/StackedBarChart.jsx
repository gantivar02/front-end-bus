/**
 * Gráfico de barras apiladas múltiples con evolución mensual.
 *
 * Props:
 * - labels: ["feb de 26", "mar de 26", ...] - etiquetas del eje X
 * - series: [{ label, color, values: [v1, v2, ...] }] - una serie por categoría apilada
 * - valueFormatter: función opcional para formatear valores en tooltip
 * - height/width: dimensiones del SVG
 */
export default function StackedBarChart({
  labels = [],
  series = [],
  valueFormatter = (v) => v,
  height = 280,
  width = 720,
}) {
  if (labels.length === 0 || series.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-neg-on-surface-variant">
        Sin datos para graficar.
      </div>
    );
  }

  const paddingLeft = 56;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 36;
  const innerW = width - paddingLeft - paddingRight;
  const innerH = height - paddingTop - paddingBottom;
  const slot = innerW / labels.length;
  const barW = Math.min(slot * 0.6, 56);

  const totalsPerLabel = labels.map((_, i) =>
    series.reduce((acc, s) => acc + Number(s.values[i] ?? 0), 0),
  );
  const max = Math.max(...totalsPerLabel) * 1.15 || 1;

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
      >
        {/* Grid horizontal */}
        {gridSteps.map((p) => {
          const y = paddingTop + innerH * (1 - p);
          const value = max * p;
          return (
            <g key={p}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke="#e0e3e0"
                strokeDasharray="3 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                className="fill-neg-on-surface-variant"
              >
                {valueFormatter(Math.round(value))}
              </text>
            </g>
          );
        })}

        {/* Barras apiladas */}
        {labels.map((label, i) => {
          const x = paddingLeft + i * slot + (slot - barW) / 2;
          let accumulatedHeight = 0;

          return (
            <g key={`${label}-${i}`}>
              {series.map((s) => {
                const value = Number(s.values[i] ?? 0);
                if (value <= 0) return null;
                const segmentH = (value / max) * innerH;
                const y =
                  paddingTop + innerH - accumulatedHeight - segmentH;
                accumulatedHeight += segmentH;

                return (
                  <rect
                    key={`${s.label}-${i}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={segmentH}
                    fill={s.color ?? "#006948"}
                    opacity="0.92"
                  >
                    <title>
                      {`${s.label} · ${label}: ${valueFormatter(value)}`}
                    </title>
                  </rect>
                );
              })}
              {/* Total encima de la barra */}
              {totalsPerLabel[i] > 0 && (
                <text
                  x={x + barW / 2}
                  y={paddingTop + innerH - accumulatedHeight - 6}
                  textAnchor="middle"
                  fontSize="10"
                  className="fill-neg-on-surface"
                  fontWeight="600"
                >
                  {valueFormatter(totalsPerLabel[i])}
                </text>
              )}
              {/* Label eje X */}
              <text
                x={x + barW / 2}
                y={height - 14}
                textAnchor="middle"
                fontSize="11"
                className="fill-neg-on-surface-variant"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 mt-3 px-2">
        {series.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 text-xs text-neg-on-surface-variant"
          >
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: s.color ?? "#006948" }}
            />
            <span className="capitalize">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
