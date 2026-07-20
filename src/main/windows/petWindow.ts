import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

let petWindow: BrowserWindow | null = null

/** 桌宠窗口尺寸（含菜单展开空间） */
const PET_WIDTH = 240
const PET_HEIGHT = 320

/** 创建桌宠窗口：透明、无边框、永远置顶、跳过任务栏 */
export function createPetWindow(): BrowserWindow {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.show()
    petWindow.focus()
    return petWindow
  }

  // 默认放在主显示器右下角
  const { workArea } = screen.getPrimaryDisplay()
  const x = workArea.x + workArea.width - PET_WIDTH - 24
  const y = workArea.y + workArea.height - PET_HEIGHT - 24

  petWindow = new BrowserWindow({
    width: PET_WIDTH,
    height: PET_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    // 允许窗口覆盖在全屏软件之上
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 置顶级别：覆盖在普通全屏窗口之上（独占全屏游戏系统限制无法覆盖）
  petWindow.setAlwaysOnTop(true, 'screen-saver')
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (process.env['ELECTRON_RENDERER_URL']) {
    petWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pet.html`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet.html'))
  }

  petWindow.on('closed', () => {
    petWindow = null
  })

  return petWindow
}

export function getPetWindow(): BrowserWindow | null {
  return petWindow
}

export function closePetWindow(): void {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.close()
    petWindow = null
  }
}

/** 移动桌宠窗口到指定位置（拖拽用） */
export function movePetWindow(x: number, y: number): void {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.setPosition(Math.round(x), Math.round(y))
  }
}

export function getPetWindowPosition(): { x: number; y: number } | null {
  if (petWindow && !petWindow.isDestroyed()) {
    const [x, y] = petWindow.getPosition()
    return { x, y }
  }
  return null
}
