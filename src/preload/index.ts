import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type {
  Plan,
  CreatePlanInput,
  UpdatePlanInput,
  TimeSession,
  TimeRangeQuery,
  PlanTimeSummary,
  PetTimerState,
  JournalEntry
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
      ipcRenderer.invoke(IPC_CHANNELS.SETTING_SET, key, value),

    // 数据路径
    getDataPath: (): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_DATA_PATH),

    setDataPath: (newPath: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_DATA_PATH, newPath),

    pickDataPath: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.PICK_DATA_PATH),

    // 日记
    journalUpsert: (date: string, content: string): Promise<JournalEntry> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_UPSERT, date, content),

    journalGet: (date: string): Promise<JournalEntry | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_GET, date),

    journalDelete: (date: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_DELETE, date)
  },
  pet: {
    // 窗口控制
    open: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.PET_OPEN),
    close: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.PET_CLOSE),
    openMain: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.PET_OPEN_MAIN),

    // 拖拽移动
    move: (x: number, y: number): void =>
      ipcRenderer.send(IPC_CHANNELS.PET_MOVE, x, y),
    getPosition: (): Promise<{ x: number; y: number } | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.PET_GET_POSITION),

    // 累计时长 & 资源
    getTotalSeconds: (): Promise<number> =>
      ipcRenderer.invoke(IPC_CHANNELS.PET_GET_TOTAL_SECONDS),
    listAssets: (): Promise<string[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.PET_LIST_ASSETS),
    getAsset: (fileName: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.PET_GET_ASSET, fileName),
    listFrames: (formId: string, state: string): Promise<string[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.PET_LIST_FRAMES, formId, state),

    // 计时状态：主界面广播
    broadcastTimerState: (state: PetTimerState): void =>
      ipcRenderer.send(IPC_CHANNELS.PET_TIMER_STATE, state),
    // 计时状态：桌宠窗口订阅
    onTimerState: (cb: (state: PetTimerState) => void): (() => void) => {
      const listener = (_e: unknown, state: PetTimerState): void => cb(state)
      ipcRenderer.on(IPC_CHANNELS.PET_TIMER_STATE, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.PET_TIMER_STATE, listener)
    }
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
