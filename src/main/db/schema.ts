/**
 * 数据库表结构定义。
 * 后续迁移在此追加新的 CREATE/ALTER。
 */

export const SCHEMA_SQL = /* sql */ `
-- 学习计划表
CREATE TABLE IF NOT EXISTS plans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  color       TEXT    NOT NULL DEFAULT '#7cc4ff',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 计时会话表
CREATE TABLE IF NOT EXISTS time_sessions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id          INTEGER NOT NULL,
  started_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  ended_at         TEXT    NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

-- 设置表（key-value）
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 索引：按日期区间查会话
CREATE INDEX IF NOT EXISTS idx_sessions_plan_started
  ON time_sessions(plan_id, started_at);

-- 每日日记表
CREATE TABLE IF NOT EXISTS journal_entries (
  date       TEXT PRIMARY KEY,  -- 'YYYY-MM-DD'
  content    TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`
