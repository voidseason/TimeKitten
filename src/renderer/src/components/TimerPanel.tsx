import { useState, useEffect, useCallback, useRef } from 'react'
import type { Plan, TimeSession } from '@shared/types'
import { TimerRing } from './TimerRing'
import './TimerPanel.css'

interface Props {
  plan: Plan | null
  onSessionChanged?: () => void
}

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/**
 * 获取今日 ISO 日期区间
 */
function todayRange(): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const base = `${y}-${m}-${d}`
  return { from: `${base}T00:00:00`, to: `${base}T23:59:59` }
}

export function TimerPanel({ plan, onSessionChanged }: Props): JSX.Element {
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [todayBase, setTodayBase] = useState(0) // 今日已完成时长(不含本次计时)
  const [loadingToday, setLoadingToday] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 加载今日该计划已完成的总时长
  const loadToday = useCallback(async (planId: number) => {
    setLoadingToday(true)
    const { from, to } = todayRange()
    const stats = await window.api.db.sessionGetTimeRange({
      planIds: [planId],
      from,
      to
    })
    setTodayBase(stats[0]?.total_seconds ?? 0)
    setLoadingToday(false)
  }, [])

  // 检查是否有未关闭的活跃 session
  const checkActive = useCallback(async (planId: number) => {
    const session = await window.api.db.sessionGetActive()
    if (session && session.plan_id === planId) {
      setActiveSession(session)
      const start = new Date(session.started_at + '+08:00').getTime()
      setElapsed(Math.floor((Date.now() - start) / 1000))
    } else {
      setActiveSession(null)
      setElapsed(0)
    }
  }, [])

  // plan 变化时重新加载
  useEffect(() => {
    if (!plan) {
      setActiveSession(null)
      setElapsed(0)
      setTodayBase(0)
      return
    }
    checkActive(plan.id)
    loadToday(plan.id)
  }, [plan, checkActive, loadToday])

  // 计时中每秒更新 elapsed
  useEffect(() => {
    if (activeSession) {
      intervalRef.current = setInterval(() => {
        const start = new Date(activeSession.started_at + '+08:00').getTime()
        setElapsed(Math.floor((Date.now() - start) / 1000))
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [activeSession])

  const handleStart = useCallback(async () => {
    if (!plan) return
    const session = await window.api.db.sessionStart(plan.id)
    setActiveSession(session)
    setElapsed(0)
    onSessionChanged?.()
    // 广播给桌宠窗口
    window.api.pet.broadcastTimerState({
      isRunning: true,
      planTitle: plan.title,
      planColor: plan.color,
      startedAt: session.started_at
    })
  }, [plan, onSessionChanged])

  const handleStop = useCallback(async () => {
    if (!activeSession) return
    const ended = await window.api.db.sessionStop(activeSession.id)
    if (ended) {
      setTodayBase((prev) => prev + ended.duration_seconds)
    }
    setActiveSession(null)
    setElapsed(0)
    onSessionChanged?.()
    if (plan) loadToday(plan.id)
    // 广播给桌宠窗口
    window.api.pet.broadcastTimerState({
      isRunning: false,
      planTitle: null,
      planColor: null,
      startedAt: null
    })
  }, [activeSession, plan, onSessionChanged, loadToday])

  // 当前显示的总秒数
  const displaySeconds = activeSession ? todayBase + elapsed : todayBase

  // 空状态
  if (!plan) {
    return (
      <div className="timer-panel">
        <div className="timer-panel__empty">
          <div className="timer-panel__empty-icon">⏳</div>
          <p className="timer-panel__empty-text">选中一项计划开始计时</p>
        </div>
      </div>
    )
  }

  if (loadingToday) {
    return (
      <div className="timer-panel">
        <div className="timer-panel__empty">
          <p className="timer-panel__empty-text">加载中…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="timer-panel">
      {/* 计划信息头 */}
      <div className="timer-panel__header">
        <span className="timer-panel__dot" style={{ background: plan.color }} />
        <h3 className="timer-panel__title">{plan.title}</h3>
      </div>

      {/* 环形计时盘 */}
      <div className="timer-panel__ring-wrap">
        <TimerRing seconds={displaySeconds} color={plan.color} />
        {activeSession && (
          <div className="timer-panel__live-badge">🔴 计时中</div>
        )}
      </div>

      {/* 统计行 */}
      <div className="timer-panel__stats">
        <div className="timer-panel__stat">
          <span className="timer-panel__stat-label">今日累计</span>
          <span className="timer-panel__stat-value">
            🕒 {formatSeconds(displaySeconds)}
          </span>
        </div>
        {activeSession && (
          <div className="timer-panel__stat">
            <span className="timer-panel__stat-label">当前计时</span>
            <span className="timer-panel__stat-value timer-panel__stat-value--live">
              {formatSeconds(elapsed)}
            </span>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="timer-panel__actions">
        {activeSession ? (
          <button className="timer-btn timer-btn--stop" onClick={handleStop}>
            ⏹ 停止计时
          </button>
        ) : (
          <button className="timer-btn timer-btn--start" onClick={handleStart}>
            ▶ 开始计时
          </button>
        )}
      </div>
    </div>
  )
}
