import type { Theme } from './types'

/**
 * 把 Theme 展开成 CSS 变量写到 :root。
 * 组件样式一律用 var(--xxx) 引用，从而实现「换主题=换变量」。
 */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const p = theme.palette
  const s = theme.shape
  return {
    '--color-primary': p.primary,
    '--color-primary-hover': p.primaryHover,
    '--color-accent': p.accent,
    '--color-bg': p.bg,
    '--color-bg-alt': p.bgAlt,
    '--color-surface': p.surface,
    '--color-border': p.border,
    '--color-text': p.text,
    '--color-text-muted': p.textMuted,
    '--color-success': p.success,
    '--color-warning': p.warning,
    '--color-danger': p.danger,
    '--radius-sm': s.radiusSm,
    '--radius-md': s.radiusMd,
    '--radius-lg': s.radiusLg,
    '--blur': s.blur,
    '--shadow': s.shadow,
    '--font-family': s.fontFamily
  }
}

/** 应用到 document（渲染进程调用） */
export function applyThemeToDocument(theme: Theme): void {
  const vars = themeToCssVars(theme)
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
  root.setAttribute('data-theme', theme.id)
  root.setAttribute('data-mode', theme.mode)
}
