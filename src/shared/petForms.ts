import type { PetForm } from './types'

/**
 * 桌宠形态配置。
 *
 * 机制：计时中每 PET_FORM_ROTATE_MINUTES 分钟自动切换到下一个形态，
 * 非计时时用第 0 个（默认形态）。
 * 手动切换按钮仅在非计时时可用（避免和自动轮播冲突）。
 */

/** 计时中每 N 分钟自动切换形态 */
export const PET_FORM_ROTATE_MINUTES = 30

export const PET_FORMS: PetForm[] = [
  {
    id: 'form1',
    name: '水手服',
    file: '图片4.png',
    unlockSeconds: 0,
    animations: [
      { state: 'idle', frames: 8, fps: 1.2 },
      { state: 'active', frames: 8, fps: 2 },
      { state: 'happy', frames: 10, fps: 3 }
    ]
  },
  {
    id: 'form2',
    name: '元气马尾',
    file: '图片1.png',
    unlockSeconds: 0,
    animations: [
      { state: 'idle', frames: 8, fps: 1.2 },
      { state: 'active', frames: 8, fps: 2 },
      { state: 'happy', frames: 10, fps: 3 }
    ]
  },
  {
    id: 'form3',
    name: '悠闲时刻',
    file: '图片3.png',
    unlockSeconds: 0,
    animations: [
      { state: 'idle', frames: 8, fps: 1.2 },
      { state: 'active', frames: 8, fps: 2 },
      { state: 'happy', frames: 10, fps: 3 }
    ]
  },
  {
    id: 'form4',
    name: '温柔一面',
    file: '图片2.png',
    unlockSeconds: 0,
    animations: [
      { state: 'idle', frames: 8, fps: 1.2 },
      { state: 'active', frames: 8, fps: 2 },
      { state: 'happy', frames: 10, fps: 3 }
    ]
  },
  {
    id: 'form5',
    name: '闪耀盛装',
    file: '图片5.png',
    unlockSeconds: 0,
    animations: [
      { state: 'idle', frames: 8, fps: 1.2 },
      { state: 'active', frames: 8, fps: 2 },
      { state: 'happy', frames: 10, fps: 3 }
    ]
  }
]
