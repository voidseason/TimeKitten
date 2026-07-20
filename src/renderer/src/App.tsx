import { useState, useCallback, useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { PlanList } from './components/PlanList'
import { TimerPanel } from './components/TimerPanel'
import { StatView } from './components/StatView'
import { SettingsModal } from './components/SettingsModal'
import './App.css'

type RightTab = 'timer' | 'stats'

export function App(): JSX.Element {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [plans, setPlans] = useState<import('@shared/types').Plan[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [rightTab, setRightTab] = useState<RightTab>('timer')
  const [settingsVisible, setSettingsVisible] = useState(false)

  // 监听标题栏的设置按钮事件
  useEffect(() => {
    const handler = () => setSettingsVisible(true)
    window.addEventListener('open-settings', handler)
    return () => window.removeEventListener('open-settings', handler)
  }, [])

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
          {/* 右侧顶部标签 */}
          <div className="app__tabs no-drag">
            <button
              className={`app__tab ${rightTab === 'timer' ? 'app__tab--active' : ''}`}
              onClick={() => setRightTab('timer')}
            >
              🕒 计时
            </button>
            <button
              className={`app__tab ${rightTab === 'stats' ? 'app__tab--active' : ''}`}
              onClick={() => setRightTab('stats')}
            >
              📊 统计
            </button>
          </div>

          <div className="app__main-body">
            {rightTab === 'timer' ? (
              <TimerPanel plan={selectedPlan} onSessionChanged={handleSessionChanged} />
            ) : (
              <StatView />
            )}
          </div>
        </main>
      </div>
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </div>
  )
}
