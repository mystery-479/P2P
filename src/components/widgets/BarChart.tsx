/**
 * Horizontal bar chart — Complaints by Category.
 */
type BarChartProps = {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  max?: number;
};

export function BarChart({ data, height = 260, max }: BarChartProps) {
  if (!data.length) return null;

  const width = 340;
  const padding = { top: 20, right: 52, bottom: 28, left: 76 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = max ?? Math.max(...data.map((d) => d.value));
  const rowHeight = chartHeight / data.length;

  return (
    <div className="chart-wrapper" style={{ width }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Complaints by category">
        {/* Axis labels */}
        {data.map((d, i) => {
          const y = padding.top + i * rowHeight + rowHeight / 2 + 5;
          return (
            <text
              key={i}
              x={padding.left - 8}
              y={y}
              fontSize="10"
              fill="#64748b"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {d.label}
            </text>
          );
        })}

        {data.map((d, i) => {
          const y = padding.top + i * rowHeight + rowHeight / 2;
          const barWidth = (d.value / maxValue) * chartWidth;

          return (
            <g key={i}>
              <rect
                x={padding.left}
                y={y - 10}
                width={barWidth}
                height="12"
                rx="4"
                fill={d.color || "#2563eb"}
              />
              <text
                x={padding.left + barWidth + 6}
                y={y + 4}
                fontSize="10"
                fontWeight="700"
                fill="#0f172a"
              >
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
