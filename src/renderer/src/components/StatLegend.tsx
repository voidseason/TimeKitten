import type { PlanTimeSummary } from '@shared/types'
import './StatLegend.css'

interface Props {
  data: PlanTimeSummary[]
  totalSeconds: number
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return '0'
}

export function StatLegend({ data, totalSeconds }: Props): JSX.Element {
  const filtered = data.filter((d) => d.total_seconds > 0)
  const sorted = [...filtered].sort((a, b) => b.total_seconds - a.total_seconds)

  if (sorted.length === 0) {
    return (
      <div className="legend">
        <p className="legend__empty">喵~ 这个时间段还没有学习记录</p>
      </div>
    )
  }

  return (
    <div className="legend">
      <h4 className="legend__title">排行榜</h4>
      <div className="legend__list">
        {sorted.map((item, idx) => {
          const pct = totalSeconds > 0 ? (item.total_seconds / totalSeconds) * 100 : 0
          return (
            <div key={item.plan_id} className="legend__row">
              <span className="legend__rank">#{idx + 1}</span>
              <span
                className="legend__dot"
                style={{ background: item.color }}
              />
              <span className="legend__name">{item.title}</span>
              <div className="legend__bar-wrap">
                <div
                  className="legend__bar"
                  style={{
                    width: `${pct}%`,
                    background: item.color
                  }}
                />
              </div>
              <span className="legend__time">{formatDuration(item.total_seconds)}</span>
              <span className="legend__pct">{Math.round(pct)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
