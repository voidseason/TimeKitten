import type { Theme } from './types'

/**
 * 内置主题清单。
 *
 * 「二次元通透」为默认皮肤（原神/星穹铁道风：玻璃拟态、柔光渐变、描边）。
 * 新增皮肤：在此数组里追加一份 Theme 即可，UI 会自动出现在主题切换里。
 */

/** 默认：二次元通透（星海蓝） */
export const auroraTheme: Theme = {
  id: 'aurora',
  name: '星海通透',
  mode: 'dark',
  palette: {
    primary: '#7cc4ff',
    primaryHover: '#a5d8ff',
    accent: '#c9a7ff',
    bg: '#0d1b2e',
    bgAlt: '#16324f',
    surface: 'rgba(255, 255, 255, 0.07)',
    border: 'rgba(255, 255, 255, 0.16)',
    text: '#eef4ff',
    textMuted: 'rgba(238, 244, 255, 0.62)',
    success: '#6ee7b7',
    warning: '#ffd479',
    danger: '#ff8a9c'
  },
  shape: {
    radiusSm: '8px',
    radiusMd: '14px',
    radiusLg: '22px',
    blur: '18px',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
    fontFamily:
      "'HarmonyOS Sans SC', 'Microsoft YaHei UI', 'PingFang SC', system-ui, sans-serif"
  },
  planColors: [
    '#7cc4ff',
    '#c9a7ff',
    '#6ee7b7',
    '#ffd479',
    '#ff8a9c',
    '#8affd6',
    '#ffb17c',
    '#b3a5ff',
    '#7cffe0',
    '#ff9ecb'
  ]
}

/** 备选：治愈暖阳（浅色，演示皮肤可替换） */
export const sunnyTheme: Theme = {
  id: 'sunny',
  name: '治愈暖阳',
  mode: 'light',
  palette: {
    primary: '#ff9a76',
    primaryHover: '#ffb599',
    accent: '#ffc85c',
    bg: '#fff6ec',
    bgAlt: '#ffe8d6',
    surface: 'rgba(255, 255, 255, 0.55)',
    border: 'rgba(180, 130, 90, 0.22)',
    text: '#5a3d2b',
    textMuted: 'rgba(90, 61, 43, 0.6)',
    success: '#79c9a6',
    warning: '#f0b429',
    danger: '#f2726f'
  },
  shape: {
    radiusSm: '8px',
    radiusMd: '14px',
    radiusLg: '22px',
    blur: '14px',
    shadow: '0 8px 28px rgba(180, 130, 90, 0.2)',
    fontFamily:
      "'HarmonyOS Sans SC', 'Microsoft YaHei UI', 'PingFang SC', system-ui, sans-serif"
  },
  planColors: [
    '#ff9a76',
    '#ffc85c',
    '#79c9a6',
    '#78b7ff',
    '#c89aff',
    '#f2726f',
    '#5cc9c4',
    '#ffab5c',
    '#a0d468',
    '#f78fb3'
  ]
}

export const themes: Theme[] = [auroraTheme, sunnyTheme]

export const defaultThemeId = auroraTheme.id

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) ?? auroraTheme
}
