import { useState, useEffect, useCallback, useMemo } from 'react'
import type { PlanTimeSummary } from '@shared/types'
import { DonutChart } from './DonutChart'
import { StatLegend } from './StatLegend'
import './StatView.css'

type RangeType = 'day' | 'week' | 'month'

/** 将 Date 格式化为 YYYY-MM-DD */
function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getRange(range: RangeType, baseDate: Date): { from: string; to: string } {
  if (range === 'day') {
    const base = fmtDate(baseDate)
    return { from: `${base}T00:00:00`, to: `${base}T23:59:59` }
  }

  if (range === 'week') {
    const dayOfWeek = baseDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(baseDate)
    monday.setDate(baseDate.getDate() + mondayOffset)
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
  const y = baseDate.getFullYear()
  const m = String(baseDate.getMonth() + 1).padStart(2, '0')
  return {
    from: `${y}-${m}-01T00:00:00`,
    to: `${y}-${m}-31T23:59:59`
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
  const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()))

  const load = useCallback(async (r: RangeType, dateStr: string) => {
    setLoading(true)
    const baseDate = new Date(dateStr + 'T00:00:00')
    const { from, to } = getRange(r, baseDate)
    const stats = await window.api.db.sessionGetTimeRange({ from, to })
    setData(stats)
    setLoading(false)
  }, [])

  useEffect(() => {
    load(range, selectedDate)
  }, [range, selectedDate, load])

  const totalSeconds = useMemo(() => data.reduce((s, d) => s + d.total_seconds, 0), [data])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
  }

  const goToday = () => {
    const today = fmtDate(new Date())
    setSelectedDate(today)
    setRange('day')
  }

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
        <div className="statview__spacer" />
        <input
          type="date"
          className="statview__datepicker"
          value={selectedDate}
          onChange={handleDateChange}
          title="选择查看日期"
        />
        <button className="statview__today-btn" onClick={goToday} title="回到今天">
          今天
        </button>
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
