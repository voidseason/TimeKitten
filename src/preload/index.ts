import { contextBridge, ipcRenderer } from 'electron'

/**
 * 通过 contextBridge 暴露一个受控的 api 给渲染进程。
 * 渲染进程不能直接访问 Node/Electron，只能用这里白名单的方法。
 */
const api = {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close')
  }
}

export type PreloadApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore fallback（未开启 contextIsolation 时）
  window.api = api
}
