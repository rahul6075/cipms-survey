/**
 * Tiny inline sparkline — pure SVG, zero deps. Designed for table rows.
 * Given a numeric series, draws a smooth polyline inside a fixed box.
 * Empty data (all zeros) renders a flat dashed baseline so the row still
 * reads evenly instead of showing a scary spike at 0.
 */
export function MiniSparkline({
  data,
  width = 56,
  height = 16,
  stroke = "currentColor",
  fill,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  className?: string
}) {
  const n = data.length
  if (n === 0) return <svg width={width} height={height} className={className} />

  const max = Math.max(...data, 1)
  const stepX = n > 1 ? width / (n - 1) : 0
  const flat = max === 0 || data.every((v) => v === 0)

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = flat ? height - 2 : height - 2 - (v / max) * (height - 4)
    return [x, y] as const
  })

  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ")

  // Area fill — only when we have a non-flat series and the caller requested it.
  const area = fill && !flat
    ? `${d} L${width.toFixed(2)},${(height - 2).toFixed(2)} L0,${(height - 2).toFixed(2)} Z`
    : null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {area && <path d={area} fill={fill} opacity={0.18} />}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={flat ? "2 3" : undefined}
        opacity={flat ? 0.5 : 1}
      />
    </svg>
  )
}
