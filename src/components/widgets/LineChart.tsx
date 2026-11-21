/**
 * Complaint volume line chart — SVG, zero dependencies.
 * Points are evenly spaced; heights scale relative to max value.
 */
type LineChartProps = {
  data: Array<{ label: string; value: number }>;
  height?: number;
};

export function LineChart({ data, height = 160 }: LineChartProps) {
  if (!data.length) return null;

  const width = 360;
  const padding = { top: 24, right: 24, bottom: 28, left: 36 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(" ");

  const areaPath = [
    `M${points[0].x},${padding.top + chartHeight}`,
    linePath.slice(1),
    `L${points[points.length - 1].x},${padding.top + chartHeight}`,
    "Z",
  ].join(" ");

  const maxPoint = points.reduce(
    (best, p, i) => (data[i].value > best.val ? { p, val: data[i].value } : best),
    { p: points[0], val: data[0].value },
  );

  return (
    <div className="chart-wrapper" style={{ width }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Complaint volume over the last 7 days">
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={points[i].x}
            y={padding.top + chartHeight + 18}
            fontSize="10"
            fill="#64748b"
            textAnchor="middle"
            dominantBaseline="alphabetic"
          >
            {d.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#lineGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#fff"
            stroke="#2563eb"
            strokeWidth="3"
            pointerEvents="none"
          />
        ))}

        {/* Max value tooltip label */}
        <text
          x={maxPoint.p.x}
          y={maxPoint.p.y - 10}
          fontSize="11"
          fontWeight="700"
          fill="#0f172a"
          textAnchor="middle"
        >
          {Math.round(data.find((d) => d.value === maxPoint.val)?.value ?? 0)} complaints
        </text>
      </svg>
    </div>
  );
}
