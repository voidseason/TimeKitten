import { getDb } from './connection'
import type {
  Plan,
  CreatePlanInput,
  UpdatePlanInput,
  TimeSession,
  PlanTimeSummary,
  TimeRangeQuery,
  JournalEntry
} from '../../shared/types'

/** ISO 格式的当前时间（T 分隔，兼容 JS new Date().toISOString() 的字典序比较） */
const NOW_ISO = "strftime('%Y-%m-%dT%H:%M:%S','now','localtime')"

// ========== Plans ==========

export function getAllPlans(): Plan[] {
  return getDb()
    .prepare('SELECT * FROM plans ORDER BY sort_order, id')
    .all() as Plan[]
}

export function createPlan(input: CreatePlanInput): Plan {
  const stmt = getDb().prepare(
    `INSERT INTO plans (title, color, sort_order) VALUES (@title, @color, @sort_order)`
  )
  const id = stmt.run({
    title: input.title,
    color: input.color ?? '#7cc4ff',
    sort_order: input.sort_order ?? 0
  }).lastInsertRowid as number

  return getDb().prepare('SELECT * FROM plans WHERE id = ?').get(id) as Plan
}

export function updatePlan(id: number, input: UpdatePlanInput): Plan | null {
  const sets: string[] = []
  const params: Record<string, unknown> = { id }

  for (const [key, val] of Object.entries(input)) {
    if (val !== undefined) {
      sets.push(`${key} = @${key}`)
      params[key] = val
    }
  }
  if (sets.length === 0) return getDb().prepare('SELECT * FROM plans WHERE id = ?').get(params) as Plan | null

  sets.push(`updated_at = ${NOW_ISO}`)
  getDb()
    .prepare(`UPDATE plans SET ${sets.join(', ')} WHERE id = @id`)
    .run(params)

  return getDb().prepare('SELECT * FROM plans WHERE id = ?').get(id) as Plan | null
}

export function deletePlan(id: number): boolean {
  const result = getDb().prepare('DELETE FROM plans WHERE id = ?').run(id)
  return result.changes > 0
}

// ========== Sessions ==========

export function startSession(planId: number): TimeSession {
  const db = getDb()
  // 先关闭所有未结束的会话（防止孤立的 ended_at=NULL 行）
  db.prepare(`
    UPDATE time_sessions
    SET ended_at = ${NOW_ISO},
        duration_seconds = CAST(
          (julianday(${NOW_ISO}) - julianday(started_at)) * 86400 AS INTEGER
        )
    WHERE ended_at IS NULL
  `).run()

  // 创建新会话，使用 ISO 格式
  const stmt = db.prepare(
    `INSERT INTO time_sessions (plan_id, started_at) VALUES (@plan_id, ${NOW_ISO})`
  )
  const id = stmt.run({ plan_id: planId }).lastInsertRowid as number
  return db.prepare('SELECT * FROM time_sessions WHERE id = ?').get(id) as TimeSession
}

export function stopSession(sessionId: number): TimeSession | null {
  const db = getDb()
  db.prepare(`
    UPDATE time_sessions
    SET ended_at = ${NOW_ISO},
        duration_seconds = CAST(
          (julianday(${NOW_ISO}) - julianday(started_at)) * 86400 AS INTEGER
        )
    WHERE id = ? AND ended_at IS NULL
  `).run(sessionId)

  return db.prepare('SELECT * FROM time_sessions WHERE id = ?').get(sessionId) as TimeSession | null
}

export function getActiveSession(): TimeSession | null {
  return getDb()
    .prepare('SELECT * FROM time_sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1')
    .get() as TimeSession | null
}

export function getPlanTimeInRange(query: TimeRangeQuery): PlanTimeSummary[] {
  const db = getDb()
  let sql: string
  let params: unknown[]

  if (query.planIds && query.planIds.length > 0) {
    const placeholders = query.planIds.map(() => '?').join(',')
    sql = /* sql */ `
      SELECT
        p.id   AS plan_id,
        p.title,
        p.color,
        COALESCE(SUM(s.duration_seconds), 0) AS total_seconds
      FROM plans p
      LEFT JOIN time_sessions s
        ON s.plan_id = p.id
        AND s.started_at >= ?
        AND s.started_at <  ?
      WHERE p.id IN (${placeholders})
      GROUP BY p.id
      ORDER BY total_seconds DESC
    `
    params = [query.from, query.to, ...query.planIds]
  } else {
    sql = /* sql */ `
      SELECT
        p.id   AS plan_id,
        p.title,
        p.color,
        COALESCE(SUM(s.duration_seconds), 0) AS total_seconds
      FROM plans p
      LEFT JOIN time_sessions s
        ON s.plan_id = p.id
        AND s.started_at >= ?
        AND s.started_at <  ?
      GROUP BY p.id
      ORDER BY total_seconds DESC
    `
    params = [query.from, query.to]
  }

  return db.prepare(sql).all(...params) as PlanTimeSummary[]
}

// ========== Settings ==========

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, value)
}

// ========== 桌宠：累计统计 ==========

/** 所有计划、所有时间的累计学习总秒数（用于桌宠形态解锁） */
export function getTotalStudySeconds(): number {
  const row = getDb()
    .prepare('SELECT COALESCE(SUM(duration_seconds), 0) AS total FROM time_sessions')
    .get() as { total: number }
  return row.total
}

// ========== 日记 ==========

export function journalUpsert(date: string, content: string): JournalEntry {
  getDb()
    .prepare(
      `INSERT INTO journal_entries (date, content, updated_at)
       VALUES (?, ?, ${NOW_ISO})
       ON CONFLICT(date) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`
    )
    .run(date, content)

  return getDb()
    .prepare('SELECT * FROM journal_entries WHERE date = ?')
    .get(date) as JournalEntry
}

export function journalGet(date: string): JournalEntry | null {
  const row = getDb()
    .prepare('SELECT * FROM journal_entries WHERE date = ?')
    .get(date) as JournalEntry | undefined
  return row ?? null
}

export function journalDelete(date: string): boolean {
  const result = getDb()
    .prepare('DELETE FROM journal_entries WHERE date = ?')
    .run(date)
  return result.changes > 0
}

// ========== 数据迁移 ==========

/** 将旧数据中的空格格式日期（datetime('now','localtime')）替换为 ISO 格式（T 分隔） */
export function migrateOldDateFormat(): void {
  const db = getDb()
  // 检查是否已迁移（settings 表记录标记）
  const migrated = getSetting('_schema_migrated_iso_date')
  if (migrated === '1') return

  // 迁移 time_sessions 表：空格 → T
  const sessions = db
    .prepare("SELECT id, started_at, ended_at FROM time_sessions WHERE started_at LIKE '% %' OR (ended_at IS NOT NULL AND ended_at LIKE '% %')")
    .all() as { id: number; started_at: string; ended_at: string | null }[]

  if (sessions.length > 0) {
    const updateStmt = db.prepare(
      'UPDATE time_sessions SET started_at = ?, ended_at = ? WHERE id = ?'
    )
    const migrate = db.transaction(() => {
      for (const row of sessions) {
        updateStmt.run(
          row.started_at.replace(' ', 'T'),
          row.ended_at ? row.ended_at.replace(' ', 'T') : null,
          row.id
        )
      }
    })
    migrate()
  }

  // 迁移 plans 表
  const plans = db
    .prepare("SELECT id, created_at, updated_at FROM plans WHERE created_at LIKE '% %' OR updated_at LIKE '% %'")
    .all() as { id: number; created_at: string; updated_at: string }[]

  if (plans.length > 0) {
    const updateStmt = db.prepare(
      'UPDATE plans SET created_at = ?, updated_at = ? WHERE id = ?'
    )
    const migrate = db.transaction(() => {
      for (const row of plans) {
        updateStmt.run(
          row.created_at.replace(' ', 'T'),
          row.updated_at.replace(' ', 'T'),
          row.id
        )
      }
    })
    migrate()
  }

  setSetting('_schema_migrated_iso_date', '1')
}
