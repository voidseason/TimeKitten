import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Plan, PlanTimeSummary } from '@shared/types'
import { PlanCard } from './PlanCard'
import { PlanAddInput } from './PlanAddInput'
import { useTheme } from '../theme/ThemeProvider'
import './PlanList.css'

/** 获取今日 ISO 日期起止 */
function todayRange(): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const base = `${y}-${m}-${d}`
  return { from: `${base}T00:00:00`, to: `${base}T23:59:59` }
}

/** 可排序的单条计划包装 */
function SortablePlanCard({
  plan,
  todayMinutes,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onColorChange,
  planColors
}: Omit<React.ComponentProps<typeof PlanCard>, 'dragHandle'>): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: plan.id
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <PlanCard
        plan={plan}
        todayMinutes={todayMinutes}
        isActive={isActive}
        onSelect={onSelect}
        onRename={onRename}
        onDelete={onDelete}
        onColorChange={onColorChange}
        planColors={planColors}
        dragHandle={listeners}
      />
    </div>
  )
}

export function PlanList(): JSX.Element {
  const { theme } = useTheme()
  const [plans, setPlans] = useState<Plan[]>([])
  const [todayStats, setTodayStats] = useState<PlanTimeSummary[]>([])
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // 加载计划列表
  const loadPlans = useCallback(async () => {
    const list = await window.api.db.planGetAll()
    setPlans(list)
    setLoading(false)
  }, [])

  // 加载今日各计划时长
  const loadToday = useCallback(async () => {
    const { from, to } = todayRange()
    const stats = await window.api.db.sessionGetTimeRange({ from, to })
    setTodayStats(stats)
  }, [])

  useEffect(() => {
    loadPlans()
    loadToday()
  }, [loadPlans, loadToday])

  const todayMap = useMemo(() => {
    const m = new Map<number, number>()
    for (const s of todayStats) {
      m.set(s.plan_id, Math.round(s.total_seconds / 60))
    }
    return m
  }, [todayStats])

  const handleAdd = useCallback(
    async (title: string) => {
      // 按顺序自动分配颜色
      const colorIdx = plans.length % theme.planColors.length
      const color = theme.planColors[colorIdx]
      await window.api.db.planCreate({ title, color, sort_order: plans.length })
      await loadPlans()
    },
    [plans, theme.planColors, loadPlans]
  )

  const handleRename = useCallback(
    async (id: number, title: string) => {
      await window.api.db.planUpdate(id, { title })
      await loadPlans()
    },
    [loadPlans]
  )

  const handleDelete = useCallback(
    async (id: number) => {
      await window.api.db.planDelete(id)
      await loadPlans()
    },
    [loadPlans]
  )

  const handleColorChange = useCallback(
    async (id: number, color: string) => {
      await window.api.db.planUpdate(id, { color })
      await loadPlans()
    },
    [loadPlans]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIdx = plans.findIndex((p) => p.id === active.id)
      const newIdx = plans.findIndex((p) => p.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return

      const reordered = [...plans]
      const [moved] = reordered.splice(oldIdx, 1)
      reordered.splice(newIdx, 0, moved)

      setPlans(reordered)
      // 批量更新 sort_order
      for (let i = 0; i < reordered.length; i++) {
        await window.api.db.planUpdate(reordered[i].id, { sort_order: i })
      }
    },
    [plans]
  )

  if (loading) return <div className="planlist__empty">加载中…</div>

  return (
    <div className="planlist">
      <div className="planlist__header drag-region">
        <span className="planlist__icon" aria-hidden>
          📋
        </span>
        <h2 className="planlist__heading">今日计划</h2>
      </div>

      {plans.length === 0 ? (
        <div className="planlist__empty">喵~ 今天还没安排计划哦</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={plans.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="planlist__cards">
              {plans.map((p) => (
                <SortablePlanCard
                  key={p.id}
                  plan={p}
                  todayMinutes={todayMap.get(p.id) ?? 0}
                  isActive={false}
                  onSelect={() => {
                    /* 模块3：计时逻辑 */
                  }}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onColorChange={handleColorChange}
                  planColors={theme.planColors}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <PlanAddInput onAdd={handleAdd} />
    </div>
  )
}
