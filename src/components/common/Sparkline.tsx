interface SparklineProps { points: number[]; width?: number; height?: number; stroke?: string }

export default function Sparkline({ points, width = 120, height = 32, stroke = '#60a5fa' }: SparklineProps) {
  if (points.length === 0) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = width / (points.length - 1)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${height - ((p - min) / range) * height}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  )
}


