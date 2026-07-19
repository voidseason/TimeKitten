import { ipcMain, BrowserWindow } from 'electron'

/**
 * 无边框窗口的自绘控制按钮（最小化/最大化/关闭）IPC。
 * 渲染进程通过 preload 暴露的 api.window.* 调用。
 */
export function registerWindowControlIpc(): void {
  ipcMain.on('window:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })

  ipcMain.on('window:toggle-maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  ipcMain.on('window:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })
}
