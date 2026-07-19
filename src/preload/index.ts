import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
  Plan,
  CreatePlanInput,
  UpdatePlanInput,
  TimeSession,
  TimeRangeQuery,
  PlanTimeSummary
} from '../shared/types'

/**
 * 通过 contextBridge 暴露一个受控的 api 给渲染进程。
 * 渲染进程不能直接访问 Node/Electron，只能用这里白名单的方法。
 *
 * 模块1新增：db.* 系列，封装 ipcRenderer.invoke。
 */
const api = {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close')
  },
  db: {
    // Plans
    planGetAll: (): Promise<Plan[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAN_GET_ALL),

    planCreate: (input: CreatePlanInput): Promise<Plan> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAN_CREATE, input),

    planUpdate: (id: number, input: UpdatePlanInput): Promise<Plan | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAN_UPDATE, id, input),

    planDelete: (id: number): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAN_DELETE, id),

    // Sessions
    sessionStart: (planId: number): Promise<TimeSession> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_START, planId),

    sessionStop: (sessionId: number): Promise<TimeSession | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_STOP, sessionId),

    sessionGetActive: (): Promise<TimeSession | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET_ACTIVE),

    sessionGetTimeRange: (query: TimeRangeQuery): Promise<PlanTimeSummary[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET_TIME_RANGE, query),

    // Settings
    settingGet: (key: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTING_GET, key),

    settingSet: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTING_SET, key, value)
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
