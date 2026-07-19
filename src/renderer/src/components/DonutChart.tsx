import { useMemo } from 'react'
import type { PlanTimeSummary } from '@shared/types'
import './DonutChart.css'

interface Props {
  data: PlanTimeSummary[]
  radius?: number
  strokeWidth?: number
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle - 90) * (Math.PI / 180)
  const endRad = (endAngle - 90) * (Math.PI / 180)
  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

function formatTotal(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return '0'
}

export function DonutChart({
  data,
  radius = 110,
  strokeWidth = 26
}: Props): JSX.Element {
  const total = useMemo(() => data.reduce((s, d) => s + d.total_seconds, 0), [data])
  const size = (radius + strokeWidth) * 2
  const center = radius + strokeWidth

  const segments = useMemo(() => {
    if (total === 0) return []
    let accumulated = 0
    return data
      .filter((d) => d.total_seconds > 0)
      .map((d) => {
        const startAngle = (accumulated / total) * 360
        const sweep = (d.total_seconds / total) * 360
        accumulated += d.total_seconds
        return {
          ...d,
          startAngle,
          sweep,
          path: describeArc(center, center, radius, startAngle, startAngle + sweep),
          percent: Math.round((d.total_seconds / total) * 100)
        }
      })
  }, [data, total, center, radius])

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 底盘轨道（仅在有数据时显示，且作为背景圈） */}
        {total > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            opacity={0.08}
          />
        )}
        {/* 扇区 */}
        {segments.map((seg, i) => (
          <path
            key={seg.plan_id}
            d={seg.path}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            className="donut__segment"
            style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}
          />
        ))}
      </svg>

      {/* 中心文字 */}
      <div className="donut__center">
        {total === 0 ? (
          <>
            <span className="donut__empty-icon">📊</span>
            <span className="donut__empty-text">暂无记录</span>
          </>
        ) : (
          <>
            <span className="donut__total-label">总时长</span>
            <span className="donut__total-value">{formatTotal(total)}</span>
          </>
        )}
      </div>
    </div>
  )
}
