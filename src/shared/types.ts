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
  SETTING_SET: 'db:setting:set'
} as const
