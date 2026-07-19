import { TitleBar } from './components/TitleBar'
import { PlanList } from './components/PlanList'
import './App.css'

export function App(): JSX.Element {
  return (
    <div className="app">
      <TitleBar />

      <div className="app__layout">
        <aside className="app__sidebar">
          <PlanList />
        </aside>

        <main className="app__main glass">
          <div className="app__placeholder">
            <div className="app__placeholder-icon">⏳</div>
            <p className="app__placeholder-text">
              选中一项计划开始计时
            </p>
            <p className="app__placeholder-hint">
              模块3 · 正向计时 / 模块4 · 时长可视化
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
