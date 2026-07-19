/**
 * 主题系统类型定义
 *
 * 设计目标：把「外观」与「逻辑」彻底分离。
 * 所有界面组件只读取这里定义的 Theme 令牌（token），
 * 换 UI 时只需替换/新增一份 Theme，业务逻辑与组件结构不动。
 */

/** 一组语义化颜色令牌 */
export interface ThemePalette {
  /** 主品牌色 */
  primary: string
  /** 主品牌色-悬浮/高亮 */
  primaryHover: string
  /** 次要强调色 */
  accent: string
  /** 应用背景（最底层） */
  bg: string
  /** 背景渐变副色（用于通透风的柔光渐变） */
  bgAlt: string
  /** 卡片/面板表面色（玻璃拟态基底） */
  surface: string
  /** 面板边框/描边色 */
  border: string
  /** 主文字 */
  text: string
  /** 次要文字 */
  textMuted: string
  /** 成功/进行中 */
  success: string
  /** 警告 */
  warning: string
  /** 危险/删除 */
  danger: string
}

/** 圆角、间距、字体等结构令牌 */
export interface ThemeShape {
  radiusSm: string
  radiusMd: string
  radiusLg: string
  /** 玻璃拟态模糊强度，如 "16px" */
  blur: string
  /** 面板阴影 */
  shadow: string
  /** 基础字体族 */
  fontFamily: string
}

/** 完整主题 = 元信息 + 调色板 + 结构 + 计划配色轮 */
export interface Theme {
  /** 唯一 id，用于持久化选择 */
  id: string
  /** 展示名 */
  name: string
  /** 明/暗，用于系统适配 */
  mode: 'light' | 'dark'
  palette: ThemePalette
  shape: ThemeShape
  /**
   * 计划配色轮：给不同「计划」自动分配可区分的颜色，
   * 供可视化圆环图与计划标签使用（模块4）。
   */
  planColors: string[]
}
