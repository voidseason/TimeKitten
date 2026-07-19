import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './windows/mainWindow'
import { registerWindowControlIpc } from './ipc/windowControls'

// 单实例锁：再次启动时聚焦已有窗口，而不是开新进程
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    registerWindowControlIpc()
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })

  // Windows/Linux：关掉所有窗口即退出（桌宠模块后会调整为托盘常驻）
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
