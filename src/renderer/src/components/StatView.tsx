import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PlanTimeSummary } from '@shared/types'
import { DonutChart } from './DonutChart'
import { StatLegend } from './StatLegend'
import './StatView.css'

type RangeType = 'day' | 'week' | 'month'

function getRange(range: RangeType): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')

  if (range === 'day') {
    const base = `${y}-${m}-${d}`
    return { from: `${base}T00:00:00`, to: `${base}T23:59:59` }
  }

  if (range === 'week') {
    // 本周一 ~ 本周日
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const fmt = (dt: Date) => {
      const yy = dt.getFullYear()
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const dd = String(dt.getDate()).padStart(2, '0')
      const hh = String(dt.getHours()).padStart(2, '0')
      const mi = String(dt.getMinutes()).padStart(2, '0')
      const ss = String(dt.getSeconds()).padStart(2, '0')
      return `${yy}-${mm}-${dd}T${hh}:${mi}:${ss}`
    }
    return { from: fmt(monday), to: fmt(sunday) }
  }

  // month
  const base = `${y}-${m}`
  return {
    from: `${base}-01T00:00:00`,
    to: `${base}-31T23:59:59`
  }
}

const RANGE_LABELS: { key: RangeType; label: string }[] = [
  { key: 'day', label: '日' },
  { key: 'week', label: '周' },
  { key: 'month', label: '月' }
]

export function StatView(): JSX.Element {
  const [range, setRange] = useState<RangeType>('day')
  const [data, setData] = useState<PlanTimeSummary[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (r: RangeType) => {
    setLoading(true)
    const { from, to } = getRange(r)
    const stats = await window.api.db.sessionGetTimeRange({ from, to })
    setData(stats)
    setLoading(false)
  }, [])

  useEffect(() => {
    load(range)
  }, [range, load])

  const totalSeconds = useMemo(() => data.reduce((s, d) => s + d.total_seconds, 0), [data])

  return (
    <div className="statview">
      {/* 时间范围切换 */}
      <div className="statview__tabs">
        {RANGE_LABELS.map(({ key, label }) => (
          <button
            key={key}
            className={`statview__tab ${range === key ? 'statview__tab--active' : ''}`}
            onClick={() => setRange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="statview__loading">加载中…</div>
      ) : (
        <>
          <DonutChart data={data} />
          <StatLegend data={data} totalSeconds={totalSeconds} />
        </>
      )}
    </div>
  )
}
