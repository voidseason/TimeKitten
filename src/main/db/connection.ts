import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { SCHEMA_SQL } from './schema'
import { migrateOldDateFormat } from './dao'

let db: Database.Database | null = null
let currentDataPath: string | null = null

/** 数据路径指针文件 —— 始终在 C 盘 userData 下（C 盘只存这个 100 字节的 JSON，不存大数据） */
function configFilePath(): string {
  return join(app.getPath('userData'), 'datapath.json')
}

/** 读取用户自定的数据目录，若未设置则返回默认（userData） */
export function getDataPath(): string {
  try {
    if (existsSync(configFilePath())) {
      const raw = readFileSync(configFilePath(), 'utf-8')
      const cfg = JSON.parse(raw) as { dataPath?: string }
      if (cfg.dataPath && existsSync(cfg.dataPath)) {
        return cfg.dataPath
      }
    }
  } catch {
    /* 文件损坏或不可读，fallback 到默认 */
  }
  return app.getPath('userData')
}

/**
 * 设置新的数据目录。
 * 如果旧位置已有数据库文件，自动迁移到新位置。
 * 关闭旧连接 → 复制 DB 文件 → 写入配置 → 在新位置打开。
 */
export function setDataPath(newPath: string): boolean {
  try {
    // 确保目录存在
    if (!existsSync(newPath)) {
      mkdirSync(newPath, { recursive: true })
    }

    const oldDataPath = currentDataPath
    const newDbPath = join(newPath, 'timekitten.db')

    // 关闭旧连接
    if (db) {
      db.close()
      db = null
    }

    // 如果旧位置有 DB 文件，复制到新位置
    if (oldDataPath && oldDataPath !== newPath) {
      const oldFile = join(oldDataPath, 'timekitten.db')
      if (existsSync(oldFile)) {
        copyFileSync(oldFile, newDbPath)
        // WAL/SHM 文件由 WAL 模式自动重建，无需迁移
      }
    }

    // 写入配置指针（始终在 C 盘 userData）
    writeFileSync(configFilePath(), JSON.stringify({ dataPath: newPath }), 'utf-8')

    // 在新位置打开
    db = new Database(newDbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.exec(SCHEMA_SQL)
    migrateOldDateFormat()
    currentDataPath = newPath

    return true
  } catch (err) {
    console.error('[TimeKitten] setDataPath failed:', err)
    // 回退：尝试在原位置重新打开
    try {
      currentDataPath = getDataPath()
      const dbPath = join(currentDataPath, 'timekitten.db')
      db = new Database(dbPath)
      db.pragma('journal_mode = WAL')
      db.pragma('foreign_keys = ON')
      db.exec(SCHEMA_SQL)
      migrateOldDateFormat()
    } catch {
      db = null
      currentDataPath = null
    }
    return false
  }
}

/** 获取数据库实例（单例） */
export function getDb(): Database.Database {
  if (db) return db

  currentDataPath = getDataPath()
  const dbPath = join(currentDataPath, 'timekitten.db')

  // 确保父目录存在
  const dir = currentDataPath
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)
  migrateOldDateFormat()

  return db
}

/** 优雅关闭数据库连接 */
export function closeDb(): void {
  if (db) {
    db.close()
    db = null
    currentDataPath = null
  }
}
