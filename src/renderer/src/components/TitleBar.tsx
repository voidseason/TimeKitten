import { useTheme } from '../theme/ThemeProvider'
import './TitleBar.css'

/** 无边框窗口的自绘标题栏：可拖拽 + 主题切换 + 窗口控制按钮 */
export function TitleBar(): JSX.Element {
  const { theme, themeId, setThemeId, available } = useTheme()

  return (
    <header className="titlebar drag-region">
      <div className="titlebar__brand">
        <span className="titlebar__logo" aria-hidden>
          🐾
        </span>
        <span className="titlebar__title">学时喵 · TimeKitten</span>
      </div>

      <div className="titlebar__actions no-drag">
        <select
          className="titlebar__theme"
          value={themeId}
          onChange={(e) => setThemeId(e.target.value)}
          title="切换主题"
        >
          {available.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          className="titlebar__btn"
          onClick={() => window.api.window.minimize()}
          aria-label="最小化"
        >
          &#x2013;
        </button>
        <button
          className="titlebar__btn"
          onClick={() => window.api.window.toggleMaximize()}
          aria-label="最大化"
        >
          &#x25A1;
        </button>
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={() => window.api.window.close()}
          aria-label="关闭"
        >
          &#x2715;
        </button>
      </div>
    </header>
  )
}
