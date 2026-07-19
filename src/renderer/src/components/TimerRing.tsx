import { useMemo } from 'react'
import './TimerRing.css'

interface Props {
  /** 已过秒数 */
  seconds: number
  /** 圆环半径 */
  radius?: number
  /** 描边宽度 */
  strokeWidth?: number
  /** 一圈代表多少秒（默认3600=1小时） */
  lapSeconds?: number
  /** 计划颜色 */
  color?: string
}

/** SVG 环形进度盘：一圈 = lapSeconds 秒，自动累积多圈 */
export function TimerRing({
  seconds,
  radius = 100,
  strokeWidth = 10,
  lapSeconds = 3600,
  color = 'var(--color-primary)'
}: Props): JSX.Element {
  const size = (radius + strokeWidth) * 2
  const center = radius + strokeWidth

  // 当前圈内的进度 (0~1)
  const lapProgress = useMemo(() => (seconds % lapSeconds) / lapSeconds, [seconds, lapSeconds])
  // 已完成整圈数
  const laps = useMemo(() => Math.floor(seconds / lapSeconds), [seconds, lapSeconds])

  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - lapProgress)

  // 格式化显示时间
  const formatted = useMemo(() => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [seconds])

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 底色轨道 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity={0.12}
        />
        {/* 进度弧 */}
        <circle
          className="ring__progress"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {/* 中心数字 */}
      <div className="ring__center">
        <span className="ring__time">{formatted}</span>
        {laps > 0 && <span className="ring__laps">+{laps}圈</span>}
      </div>
    </div>
  )
}
