import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import * as dao from '../db/dao'

/**
 * 注册所有数据库相关 IPC 处理函数。
 * 每个 handle 的返回值是 Promise<T | null> 或直接 void。
 */
export function registerDbIpc(): void {
  // ---------- Plans ----------
  ipcMain.handle(IPC_CHANNELS.PLAN_GET_ALL, () => {
    return dao.getAllPlans()
  })

  ipcMain.handle(IPC_CHANNELS.PLAN_CREATE, (_e, input) => {
    return dao.createPlan(input)
  })

  ipcMain.handle(IPC_CHANNELS.PLAN_UPDATE, (_e, id: number, input) => {
    return dao.updatePlan(id, input)
  })

  ipcMain.handle(IPC_CHANNELS.PLAN_DELETE, (_e, id: number) => {
    return dao.deletePlan(id)
  })

  // ---------- Sessions ----------
  ipcMain.handle(IPC_CHANNELS.SESSION_START, (_e, planId: number) => {
    return dao.startSession(planId)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_STOP, (_e, sessionId: number) => {
    return dao.stopSession(sessionId)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_GET_ACTIVE, () => {
    return dao.getActiveSession()
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_GET_TIME_RANGE, (_e, query) => {
    return dao.getPlanTimeInRange(query)
  })

  // ---------- Settings ----------
  ipcMain.handle(IPC_CHANNELS.SETTING_GET, (_e, key: string) => {
    return dao.getSetting(key)
  })

  ipcMain.handle(IPC_CHANNELS.SETTING_SET, (_e, key: string, value: string) => {
    dao.setSetting(key, value)
  })
}
