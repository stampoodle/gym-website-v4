import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatLongDate } from '../lib/format'

/** Real record behind one chart point, used by the hover/tap tooltip. */
export type ChartPointInfo = {
  /** The workout's stored date (ISO "YYYY-MM-DD") — never estimated. */
  date: string
  /** Optional extra line, e.g. "82.5 kg × 6". */
  detail?: string
}

type LineChartProps = {
  values: number[]
  labels: string[]
  height?: number
  formatValue?: (v: number) => string
  /** When provided (one entry per value), hovering or tapping the chart
   * shows a tooltip with the exact date and value for the nearest point. */
  points?: ChartPointInfo[]
  /** What the value means, shown in the tooltip, e.g. "Estimated 1RM". */
  valueName?: string
}

// A small, self-contained line chart. No charting library required —
// keeps the project's dependencies minimal.
export default function LineChart({
  values,
  labels,
  height = 160,
  formatValue = (v) => `${Math.round(v)}`,
  points: pointInfo,
  valueName,
}: LineChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)

  // Keep the tooltip fully inside the chart's box so it can never be
  // clipped by the screen edge, whatever the device width. Runs after
  // every render, measuring the real tooltip size.
  useLayoutEffect(() => {
    const tip = tipRef.current
    const wrap = wrapRef.current
    if (!tip || !wrap) return
    const wrapW = wrap.getBoundingClientRect().width
    const tipW = tip.getBoundingClientRect().width
    const target = parseFloat(tip.dataset.anchor ?? '0') // anchor in px
    const half = tipW / 2
    const clamped = Math.min(Math.max(target, half), Math.max(half, wrapW - half))
    tip.style.left = `${clamped}px`
  })

  if (values.length === 0) {
    return <p className="chart-empty">Not enough data yet.</p>
  }

  const width = 560
  const padX = 28
  const padY = 22
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values.map((v, i) => {
    const x =
      values.length === 1
        ? width / 2
        : padX + (i / (values.length - 1)) * (width - padX * 2)
    const y = height - padY - ((v - min) / range) * (height - padY * 2)
    return { x, y, v }
  })

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${(
    height - padY
  ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`

  const last = points[points.length - 1]

  // Tooltips only appear when real per-point records were supplied.
  const interactive = Boolean(pointInfo && pointInfo.length === values.length)

  function nearestIndex(clientX: number): number {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return 0
    const xInChart = ((clientX - rect.left) / rect.width) * width
    let best = 0
    let bestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - xInChart)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    return best
  }

  function handlePointer(e: PointerEvent<HTMLDivElement>) {
    if (!interactive) return
    setActive(nearestIndex(e.clientX))
  }

  function handleLeave(e: PointerEvent<HTMLDivElement>) {
    // Mouse: hide when the cursor leaves. Touch: keep the tapped point
    // visible until another point is tapped.
    if (e.pointerType === 'mouse') setActive(null)
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const step = e.key === 'ArrowRight' ? 1 : -1
      setActive((cur) => Math.min(values.length - 1, Math.max(0, (cur ?? (step === 1 ? -1 : values.length)) + step)))
    } else if (e.key === 'Escape') {
      setActive(null)
    }
  }

  const activePoint = active !== null ? points[active] : null
  const activeInfo = active !== null && pointInfo ? pointInfo[active] : null
  const leftPct = activePoint ? (activePoint.x / width) * 100 : 0
  const topPct = activePoint ? (activePoint.y / height) * 100 : 0
  const below = topPct < 38

  return (
    <div
      ref={wrapRef}
      className={'linechart-wrap' + (interactive ? ' linechart-wrap--interactive' : '')}
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
      onPointerLeave={handleLeave}
      onKeyDown={handleKey}
      onBlur={() => setActive(null)}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? 'Chart. Hover, tap, or use the arrow keys to see the date and value for each point.' : undefined}
    >
      <svg
        className="linechart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Chart showing values from ${formatValue(values[0])} to ${formatValue(
          values[values.length - 1],
        )}`}
      >
        <path d={areaPath} className="linechart__area" />
        <path d={path} className="linechart__line" />
        {activePoint && (
          <line
            className="linechart__guide"
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padY / 2}
            y2={height - padY}
          />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === active ? 5.5 : i === points.length - 1 ? 4 : 2.5}
            className={'linechart__dot' + (i === active ? ' linechart__dot--active' : '')}
          />
        ))}
        <text x={last.x} y={last.y - 12} className="linechart__value" textAnchor="end">
          {formatValue(last.v)}
        </text>
        <text x={points[0].x} y={height - 4} className="linechart__label" textAnchor="start">
          {labels[0]}
        </text>
        <text x={last.x} y={height - 4} className="linechart__label" textAnchor="end">
          {labels[labels.length - 1]}
        </text>
      </svg>

      {interactive && activePoint && activeInfo && (
        <div
          ref={tipRef}
          data-anchor={(leftPct / 100) * (wrapRef.current?.getBoundingClientRect().width ?? 0)}
          className={'chart-tooltip' + (below ? ' chart-tooltip--below' : '')}
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
          }}
          role="status"
        >
          <p className="chart-tooltip__date">{formatLongDate(activeInfo.date)}</p>
          <p className="chart-tooltip__value">
            {valueName ? `${valueName}: ` : ''}
            {formatValue(activePoint.v)}
          </p>
          {activeInfo.detail && <p className="chart-tooltip__detail">{activeInfo.detail}</p>}
        </div>
      )}
    </div>
  )
}
