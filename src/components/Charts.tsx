// Minimal, dependency-free chart components (inline SVG).
// Designed for accessible reading and dark-mode safety.
import { useId } from 'react'

export interface SeriesPoint {
  label: string
  value: number | null
}

export function LineChart({ data, height = 120, className }: { data: SeriesPoint[]; height?: number; className?: string }) {
  const gid = useId().replace(/:/g, '')
  if (data.length === 0) return <div className={className} aria-hidden />
  const values = data.map((d) => d.value).filter((v): v is number => v !== null)
  const min = Math.min(60, ...values) - 2
  const max = Math.max(100, ...values) + 2
  const range = max - min || 1
  const width = 300
  const pts: string[] = []
  const n = data.length
  data.forEach((d, i) => {
    const x = n === 1 ? width / 2 : (i / (n - 1)) * width
    const y = d.value === null ? NaN : height - ((d.value - min) / range) * height
    pts.push(`${x},${Number.isNaN(y) ? height : y}`)
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Attendance trend line chart">
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
      ))}
      {pts.length > 1 && (
        <>
          <polygon points={`0,${height} ${pts.join(' ')} ${width},${height}`} fill={`url(#fill-${gid})`} />
          <polyline points={pts.join(' ')} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {pts.map((p, i) => {
        const [x, y] = p.split(',').map(Number)
        return <circle key={i} cx={x} cy={y} r="3" fill="#0ea5e9" opacity={data[i]!.value === null ? 0 : 1} />
      })}
    </svg>
  )
}

export function BarChart({ data, height = 120, className, colorBy }: { data: SeriesPoint[]; height?: number; className?: string; colorBy?: (v: number) => string }) {
  if (data.length === 0) return <div className={className} aria-hidden />
  const max = Math.max(...data.map((d) => d.value ?? 0), 100)
  const width = 300
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Attendance comparison bar chart">
      {data.map((d, i) => {
        const bw = Math.min(28, width / data.length - 8)
        const x = (i / data.length) * width + (width / data.length - bw) / 2
        const h = ((d.value ?? 0) / max) * height
        const c = colorBy ? colorBy(d.value ?? 0) : '#0ea5e9'
        return (
          <g key={i}>
            <rect x={x} y={height - h} width={bw} height={h} rx="3" fill={c} opacity="0.85" />
            <text x={x + bw / 2} y={height - h - 3} textAnchor="middle" fontSize="7" fill="currentColor">
              {d.value === null ? '' : `${d.value.toFixed(0)}%`}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function DonutChart({ value, size = 56, stroke = 6, label }: { value: number | null; size?: number; stroke?: number; label: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = value === null ? 0 : Math.min(100, Math.max(0, value))
  const color = value === null ? '#94a3b8' : pct >= 80 ? '#16a34a' : pct >= 65 ? '#d97706' : '#dc2626'
  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={`${label}: ${value === null ? 'no data' : value.toFixed(1) + '%'}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  )
}