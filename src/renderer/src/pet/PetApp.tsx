import { useState, useEffect, useCallback, useRef } from 'react'
import type { PetTimerState } from '@shared/types'
import { PET_FORMS, PET_FORM_ROTATE_MINUTES } from '@shared/petForms'

/**
 * 桌宠主组件：头像框 + 形态自动/手动切换 + 菜单 + 悬浮特效 + 拖拽
 *
 * 形态切换机制：
 * - 计时中：每 PET_FORM_ROTATE_MINUTES 分钟自动切换到下一个形态（按 startedAt 计算）
 * - 非计时时：显示默认形态（form1），可通过菜单手动轮播
 */
export function PetApp(): JSX.Element {
  const [images, setImages] = useState<Record<string, string>>({})
  const [manualFormIdx, setManualFormIdx] = useState(0)
  const [autoFormIdx, setAutoFormIdx] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [timerState, setTimerState] = useState<PetTimerState>({
    isRunning: false,
    planTitle: null,
    planColor: null,
    startedAt: null
  })

  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(
    null
  )
  const draggingRef = useRef(false)

  // 加载所有图片 + 检查已有活跃会话
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // 图片
      const loaded: Record<string, string> = {}
      for (const form of PET_FORMS) {
        const data = await window.api.pet.getAsset(form.file)
        if (data) loaded[form.id] = data
      }
      if (!cancelled) setImages(loaded)

      // 若开启桌宠时已在计时，同步显示
      const active = await window.api.db.sessionGetActive()
      if (!cancelled && active) {
        const plans = await window.api.db.planGetAll()
        const plan = plans.find((p) => p.id === active.plan_id)
        if (plan) {
          setTimerState({
            isRunning: true,
            planTitle: plan.title,
            planColor: plan.color,
            startedAt: active.started_at
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 订阅计时状态
  useEffect(() => {
    const unsub = window.api.pet.onTimerState((state) => {
      setTimerState(state)
    })
    return unsub
  }, [])

  // 计时中：按已过分钟数计算当前应该显示的形态
  useEffect(() => {
    if (!timerState.isRunning || !timerState.startedAt) return

    const rotateMs = PET_FORM_ROTATE_MINUTES * 60 * 1000
    const startMs = new Date(timerState.startedAt + '+08:00').getTime()

    const updateAutoIdx = (): void => {
      const elapsedMs = Date.now() - startMs
      const idx = Math.floor(elapsedMs / rotateMs) % PET_FORMS.length
      setAutoFormIdx(idx)
    }

    updateAutoIdx()
    // 每分钟检查一次是否到切换点（够精确又不耗资源）
    const timer = setInterval(updateAutoIdx, 60 * 1000)
    return () => clearInterval(timer)
  }, [timerState.isRunning, timerState.startedAt])

  // 当前显示的形态
  const currentFormIdx = timerState.isRunning ? autoFormIdx : manualFormIdx
  const currentForm = PET_FORMS[currentFormIdx] ?? PET_FORMS[0]
  const currentImage = images[currentForm.id]

  // 手动切换形态（仅非计时时可用）
  const cycleForm = useCallback(() => {
    if (timerState.isRunning) return
    setManualFormIdx((i) => (i + 1) % PET_FORMS.length)
    setMenuOpen(false)
  }, [timerState.isRunning])

  const handleOpenMain = useCallback(() => {
    window.api.pet.openMain()
    setMenuOpen(false)
  }, [])

  const handleClose = useCallback(() => {
    window.api.pet.close()
  }, [])

  // 拖拽逻辑
  const onPointerDown = useCallback(async (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const pos = await window.api.pet.getPosition()
    if (!pos) return
    dragRef.current = {
      startX: e.screenX,
      startY: e.screenY,
      winX: pos.x,
      winY: pos.y
    }
    draggingRef.current = false
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.screenX - d.startX
    const dy = e.screenY - d.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) draggingRef.current = true
    if (draggingRef.current) {
      window.api.pet.move(d.winX + dx, d.winY + dy)
    }
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const wasDragging = draggingRef.current
    dragRef.current = null
    draggingRef.current = false
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    if (!wasDragging) setMenuOpen((v) => !v)
  }, [])

  return (
    <div className="pet-root">
      <div
        className={`pet ${hovered ? 'pet--hover' : ''} ${
          timerState.isRunning ? 'pet--running' : ''
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 悬浮光晕 */}
        <div
          className="pet__glow"
          style={{
            background: timerState.planColor
              ? `radial-gradient(circle, ${timerState.planColor}55, transparent 70%)`
              : undefined
          }}
        />

        {/* 头像框 */}
        <div className="pet__avatar">
          {currentImage ? (
            <img src={currentImage} alt={currentForm.name} draggable={false} />
          ) : (
            <div className="pet__loading">🐾</div>
          )}
        </div>

        {/* 计时中标记 */}
        {timerState.isRunning && (
          <div className="pet__status">
            <span className="pet__status-dot" />
            专注中
          </div>
        )}

        {/* 悬浮飘浮粒子 */}
        {hovered && (
          <div className="pet__particles">
            {['✦', '♡', '✧', '·', '✦'].map((c, i) => (
              <span key={i} className={`pet__particle pet__particle--${i}`}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 当前形态名 */}
      <div className="pet__form-label">{currentForm.name}</div>

      {/* 点击菜单 */}
      {menuOpen && (
        <div className="pet-menu">
          <button className="pet-menu__item" onClick={handleOpenMain}>
            📋 打开主界面
          </button>
          <button
            className="pet-menu__item"
            onClick={cycleForm}
            disabled={timerState.isRunning}
            title={timerState.isRunning ? '计时中自动切换' : '切换到下一形态'}
          >
            🐾 切换形态（{PET_FORMS.length}）
          </button>
          <button className="pet-menu__item pet-menu__item--danger" onClick={handleClose}>
            ❌ 关闭桌宠
          </button>
        </div>
      )}
    </div>
  )
}
