/**
 * 常用数据类型，共享给 preload 和 renderer。
 */

export interface Plan {
  id: number
  title: string
  color: string
  sort_order: number
  is_active: number
  created_at: string
  updated_at: string
}

export interface CreatePlanInput {
  title: string
  color?: string
  sort_order?: number
}

export interface UpdatePlanInput {
  title?: string
  color?: string
  sort_order?: number
  is_active?: number
}

export interface TimeSession {
  id: number
  plan_id: number
  started_at: string
  ended_at: string | null
  duration_seconds: number
  created_at: string
}

/** 日/周/月/自定义统计查询参数 */
export interface TimeRangeQuery {
  planIds?: number[]
  from: string // ISO datetime
  to: string // ISO datetime
}

/** 单条计划的统计汇总 */
export interface PlanTimeSummary {
  plan_id: number
  title: string
  color: string
  total_seconds: number
}

/** IPC 通道名常量 */
export const IPC_CHANNELS = {
  // Plans
  PLAN_GET_ALL: 'db:plan:get-all',
  PLAN_CREATE: 'db:plan:create',
  PLAN_UPDATE: 'db:plan:update',
  PLAN_DELETE: 'db:plan:delete',

  // Time Sessions
  SESSION_START: 'db:session:start',
  SESSION_STOP: 'db:session:stop',
  SESSION_GET_ACTIVE: 'db:session:get-active',
  SESSION_GET_TIME_RANGE: 'db:session:get-time-range',

  // Settings
  SETTING_GET: 'db:setting:get',
  SETTING_SET: 'db:setting:set',

  // 桌宠
  PET_OPEN: 'pet:open',
  PET_CLOSE: 'pet:close',
  PET_MOVE: 'pet:move',
  PET_GET_POSITION: 'pet:get-position',
  PET_OPEN_MAIN: 'pet:open-main',
  PET_GET_TOTAL_SECONDS: 'pet:get-total-seconds',
  PET_GET_ASSET: 'pet:get-asset',
  PET_LIST_ASSETS: 'pet:list-assets',
  PET_LIST_FRAMES: 'pet:list-frames',
  // 主进程 → 桌宠：计时状态变化广播
  PET_TIMER_STATE: 'pet:timer-state',

  // 数据路径
  GET_DATA_PATH: 'db:get-data-path',
  SET_DATA_PATH: 'db:set-data-path',
  PICK_DATA_PATH: 'db:pick-data-path',

  // 日记
  JOURNAL_UPSERT: 'db:journal:upsert',
  JOURNAL_GET: 'db:journal:get',
  JOURNAL_DELETE: 'db:journal:delete'
} as const

/** 每日日记条目 */
export interface JournalEntry {
  date: string // 'YYYY-MM-DD'
  content: string
  updated_at: string
}

/** 桌宠帧动画状态 */
export type AnimState = 'idle' | 'active' | 'happy'

/** 单个动画状态的帧配置 */
export interface PetAnimation {
  /** 动画状态名 */
  state: AnimState
  /** 该状态包含的帧数 */
  frames: number
  /** 播放帧率 */
  fps: number
}

/** 桌宠形态定义（图片文件 + 解锁阈值 + 可选帧动画） */
export interface PetForm {
  /** 形态 id */
  id: string
  /** 展示名 */
  name: string
  /** 图片文件名（相对 assets/pet/，帧序列不存在时 fallback） */
  file: string
  /** 解锁所需累计学习秒数（0 = 默认解锁） */
  unlockSeconds: number
  /** 帧动画配置（可选，无配置则退回单图 + CSS 动画） */
  animations?: PetAnimation[]
}

/** 桌宠计时状态（主进程广播给桌宠窗口） */
export interface PetTimerState {
  isRunning: boolean
  planTitle: string | null
  planColor: string | null
  /** 当前会话开始时间（ISO），用于计算已计时秒数 */
  startedAt: string | null
}
