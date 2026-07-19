import { TitleBar } from './components/TitleBar'
import { useTheme } from './theme/ThemeProvider'
import './App.css'

export function App(): JSX.Element {
  const { theme } = useTheme()

  return (
    <div className="app">
      <TitleBar />

      <main className="app__body">
        <section className="welcome glass">
          <div className="welcome__badge">v0.1 · 模块0 脚手架就绪</div>
          <h1 className="welcome__title">
            学时喵 <span className="welcome__accent">TimeKitten</span>
          </h1>
          <p className="welcome__subtitle">
            记录每天的学习时长，让专注被看见。当前主题：<b>{theme.name}</b>
          </p>

          <ul className="welcome__roadmap">
            <li className="done">主题/皮肤系统底座（可替换 UI）</li>
            <li className="done">无边框通透窗口 + 自绘标题栏</li>
            <li>数据层（计划 / 计时记录）— 模块1</li>
            <li>每日计划列表 — 模块2</li>
            <li>正向计时 — 模块3</li>
            <li>时长圆环可视化 — 模块4</li>
            <li>桌宠（兽耳娘）— 模块5</li>
          </ul>

          <div className="welcome__palette">
            {theme.planColors.slice(0, 8).map((c) => (
              <span key={c} className="welcome__swatch" style={{ background: c }} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
