import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

/**
 * 获取数据库实例（单例）。
 * 数据库文件存放在 Electron userData 目录下。
 */
export function getDb(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'timekitten.db')
  db = new Database(dbPath)

  // WAL 模式提升并发读写性能
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // 执行建表
  db.exec(SCHEMA_SQL)

  return db
}

/** 优雅关闭数据库连接 */
export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
