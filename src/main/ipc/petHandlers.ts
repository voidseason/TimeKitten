import { ipcMain, app } from 'electron'
import { readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'
import { IPC_CHANNELS, type PetTimerState } from '../../shared/types'
import * as dao from '../db/dao'
import {
  createPetWindow,
  closePetWindow,
  movePetWindow,
  getPetWindowPosition,
  getPetWindow
} from '../windows/petWindow'
import { createMainWindow } from '../windows/mainWindow'

/**
 * 桌宠图片资源目录。
 * 开发模式：项目根 assets/pet；打包后：resources/assets/pet。
 */
function petAssetDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'assets', 'pet')
  }
  return join(app.getAppPath(), 'assets', 'pet')
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
}

export function registerPetIpc(): void {
  // 打开桌宠窗口
  ipcMain.handle(IPC_CHANNELS.PET_OPEN, () => {
    createPetWindow()
  })

  // 关闭桌宠窗口
  ipcMain.handle(IPC_CHANNELS.PET_CLOSE, () => {
    closePetWindow()
  })

  // 拖拽移动
  ipcMain.on(IPC_CHANNELS.PET_MOVE, (_e, x: number, y: number) => {
    movePetWindow(x, y)
  })

  ipcMain.handle(IPC_CHANNELS.PET_GET_POSITION, () => {
    return getPetWindowPosition()
  })

  // 从桌宠打开主界面
  ipcMain.handle(IPC_CHANNELS.PET_OPEN_MAIN, () => {
    createMainWindow()
  })

  // 主界面广播计时状态 → 转发给桌宠窗口
  ipcMain.on(IPC_CHANNELS.PET_TIMER_STATE, (_e, state: PetTimerState) => {
    const pet = getPetWindow()
    if (pet && !pet.isDestroyed()) {
      pet.webContents.send(IPC_CHANNELS.PET_TIMER_STATE, state)
    }
  })

  // 累计学习总秒数（形态解锁用）
  ipcMain.handle(IPC_CHANNELS.PET_GET_TOTAL_SECONDS, () => {
    return dao.getTotalStudySeconds()
  })

  // 列出 assets/pet 下的图片文件名
  ipcMain.handle(IPC_CHANNELS.PET_LIST_ASSETS, async () => {
    const dir = petAssetDir()
    if (!existsSync(dir)) return []
    const files = await readdir(dir)
    return files.filter((f) => MIME[extname(f).toLowerCase()])
  })

  // 列出指定形态/动画状态的帧文件（按文件名排序保证帧顺序）
  ipcMain.handle(
    IPC_CHANNELS.PET_LIST_FRAMES,
    async (_e, formId: string, state: string) => {
      const dir = join(petAssetDir(), formId, state)
      if (!existsSync(dir)) return []
      try {
        const files = await readdir(dir)
        return files
          .filter((f) => MIME[extname(f).toLowerCase()])
          .sort()
      } catch {
        return []
      }
    }
  )

  // 读取指定图片 → base64 data URL
  ipcMain.handle(IPC_CHANNELS.PET_GET_ASSET, async (_e, fileName: string) => {
    const dir = petAssetDir()
    const filePath = join(dir, fileName)
    // 防目录穿越
    if (!filePath.startsWith(dir) || !existsSync(filePath)) return null
    const ext = extname(fileName).toLowerCase()
    const mime = MIME[ext]
    if (!mime) return null
    const buf = await readFile(filePath)
    return `data:${mime};base64,${buf.toString('base64')}`
  })
}
