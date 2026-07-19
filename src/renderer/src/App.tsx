import { useState, useCallback, useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { PlanList } from './components/PlanList'
import { TimerPanel } from './components/TimerPanel'
import './App.css'

export function App(): JSX.Element {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [plans, setPlans] = useState<import('@shared/types').Plan[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // 加载计划列表（在 App 层也缓存一份，用于查找选中的 Plan）
  const loadPlansForSelection = useCallback(async () => {
    const list = await window.api.db.planGetAll()
    setPlans(list)
  }, [])

  // 首次加载
  useEffect(() => {
    loadPlansForSelection()
  }, [loadPlansForSelection])

  // 找到当前选中的 Plan 对象
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  const handleSelectPlan = useCallback(
    (id: number | null) => {
      setSelectedPlanId(id)
      if (id != null) loadPlansForSelection()
    },
    [loadPlansForSelection]
  )

  const handleSessionChanged = useCallback(() => {
    setRefreshKey((k) => k + 1)
    loadPlansForSelection()
  }, [loadPlansForSelection])

  return (
    <div className="app">
      <TitleBar />

      <div className="app__layout">
        <aside className="app__sidebar">
          <PlanList
            selectedPlanId={selectedPlanId}
            onSelectPlan={handleSelectPlan}
            refreshKey={refreshKey}
          />
        </aside>

        <main className="app__main glass">
          <TimerPanel plan={selectedPlan} onSessionChanged={handleSessionChanged} />
        </main>
      </div>
    </div>
  )
}
