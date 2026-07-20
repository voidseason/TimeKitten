import { useState, useRef, useEffect, useCallback } from 'react'
import type { Plan } from '@shared/types'
import './PlanCard.css'

interface Props {
  plan: Plan
  todayMinutes: number
  isActive: boolean
  onSelect: () => void
  onRename: (id: number, title: string) => void
  onDelete: (id: number) => void
  onColorChange: (id: number, color: string) => void
  planColors: string[]
  /** dnd-kit 提供的拖拽手柄 props */
  dragHandle?: React.HTMLAttributes<HTMLDivElement>
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0h'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function PlanCard({
  plan,
  todayMinutes,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onColorChange,
  planColors,
  dragHandle
}: Props): JSX.Element {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(plan.title)
  const [showColorPick, setShowColorPick] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const handleDoubleClick = useCallback(() => {
    setEditTitle(plan.title)
    setEditing(true)
  }, [plan.title])

  const commitEdit = useCallback(() => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== plan.title) {
      onRename(plan.id, trimmed)
    } else {
      setEditTitle(plan.title)
    }
    setEditing(false)
  }, [editTitle, plan.title, plan.id, onRename])

  return (
    <div
      className={`plancard glass ${isActive ? 'plancard--active' : ''}`}
      onClick={onSelect}
    >
      {/* 拖拽手柄 */}
      <div className="plancard__handle" {...(dragHandle ?? {})}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="4.5" cy="2.5" r="1.2" fill="currentColor" opacity="0.5" />
          <circle cx="7.5" cy="2.5" r="1.2" fill="currentColor" opacity="0.5" />
          <circle cx="4.5" cy="6" r="1.2" fill="currentColor" opacity="0.5" />
          <circle cx="7.5" cy="6" r="1.2" fill="currentColor" opacity="0.5" />
          <circle cx="4.5" cy="9.5" r="1.2" fill="currentColor" opacity="0.5" />
          <circle cx="7.5" cy="9.5" r="1.2" fill="currentColor" opacity="0.5" />
        </svg>
      </div>

      {/* 颜色指示条 */}
      <div className="plancard__color-dot" style={{ background: plan.color }} />

      {/* 标题区域 */}
      <div className="plancard__body">
        {editing ? (
          <input
            ref={inputRef}
            className="plancard__input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') {
                setEditTitle(plan.title)
                setEditing(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="plancard__title" onDoubleClick={handleDoubleClick}>
            {plan.title}
          </span>
        )}

        <div className="plancard__meta">
          <span className="plancard__time">
            🕒 {formatDuration(todayMinutes)}
          </span>

          {/* 颜色选择按钮 */}
          <button
            className="plancard__color-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowColorPick((v) => !v)
            }}
            title="更换颜色"
          >
            <span
              className="plancard__color-swatch"
              style={{ background: plan.color }}
            />
          </button>

          <button
            className="plancard__delete"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(plan.id)
            }}
            title="删除计划"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 颜色选择弹出 */}
      {showColorPick && (
        <div className="plancard__color-popup" onClick={(e) => e.stopPropagation()}>
          {planColors.map((c) => (
            <button
              key={c}
              className={`plancard__color-option ${c === plan.color ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => {
                onColorChange(plan.id, c)
                setShowColorPick(false)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
