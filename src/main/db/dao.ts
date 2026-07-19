import { getDb } from './connection'
import type {
  Plan,
  CreatePlanInput,
  UpdatePlanInput,
  TimeSession,
  PlanTimeSummary,
  TimeRangeQuery
} from '../../shared/types'

// ========== Plans ==========

export function getAllPlans(): Plan[] {
  return getDb()
    .prepare('SELECT * FROM plans ORDER BY sort_order, id')
    .all() as Plan[]
}

export function createPlan(input: CreatePlanInput): Plan {
  const stmt = getDb().prepare(
    'INSERT INTO plans (title, color, sort_order) VALUES (@title, @color, @sort_order)'
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

  sets.push("updated_at = datetime('now','localtime')")
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
  const stmt = getDb().prepare(
    "INSERT INTO time_sessions (plan_id, started_at) VALUES (@plan_id, datetime('now','localtime'))"
  )
  const id = stmt.run({ plan_id: planId }).lastInsertRowid as number
  return getDb().prepare('SELECT * FROM time_sessions WHERE id = ?').get(id) as TimeSession
}

export function stopSession(sessionId: number): TimeSession | null {
  const db = getDb()
  db.prepare(
    `UPDATE time_sessions
     SET ended_at = datetime('now','localtime'),
         duration_seconds = CAST(
           (julianday(datetime('now','localtime')) - julianday(started_at)) * 86400 AS INTEGER
         )
     WHERE id = ? AND ended_at IS NULL`
  ).run(sessionId)

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
