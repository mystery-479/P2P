/**
 * Donut chart — Priority distribution.
 * Center shows total count.
 */
type DonutSegment = { label: string; value: number; color: string };

type DonutChartProps = {
  segments: DonutSegment[];
  total: number;
  size?: number;
};

export function DonutChart({ segments, total, size = 220 }: DonutChartProps) {
  const sumValue = segments.reduce((acc, s) => acc + s.value, 0);
  const center = size / 2;
  const radiusOuter = (size * 0.88) / 2;
  const radiusInner = (size * 0.62) / 2;

  let currentAngle = -90;
  const paths = segments.map((seg) => {
    const sliceAngle = (seg.value / sumValue) * 360;
    const endAngle = currentAngle + sliceAngle;

    const x1 = center + radiusOuter * Math.cos((currentAngle * Math.PI) / 180);
    const y1 = center + radiusOuter * Math.sin((currentAngle * Math.PI) / 180);
    const x2 = center + radiusOuter * Math.cos((endAngle * Math.PI) / 180);
    const y2 = center + radiusOuter * Math.sin((endAngle * Math.PI) / 180);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const d = [
      `M${x1},${y1}`,
      `A${radiusOuter},${radiusOuter} 0 ${largeArc} 1 ${x2},${y2}`,
      `L${center + radiusInner * Math.cos((endAngle * Math.PI) / 180)},${center + radiusInner * Math.sin((endAngle * Math.PI) / 180)}`,
      `A${radiusInner},${radiusInner} 0 ${largeArc} 0 ${center + radiusInner * Math.cos((currentAngle * Math.PI) / 180)},${center + radiusInner * Math.sin((currentAngle * Math.PI) / 180)}`,
      "Z",
    ].join(" ");

    currentAngle = endAngle;
    return <path key={seg.label} d={d} fill={seg.color} />;
  });

  return (
    <div className="chart-wrapper" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Priority distribution">
        {paths}
        {/* Center content */}
        <text
          x={center}
          y={center - 8}
          fontSize="26"
          fontWeight="800"
          fill="#0f172a"
          textAnchor="middle"
        >
          {total}
        </text>
        <text
          x={center}
          y={center + 14}
          fontSize="10"
          fontWeight="700"
          fill="#64748b"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          Total
        </text>
      </svg>
    </div>
  );
}
