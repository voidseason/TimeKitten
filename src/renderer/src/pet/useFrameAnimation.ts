import { useState, useEffect, useRef } from 'react'
import type { AnimState, PetAnimation } from '@shared/types'

/** 每个动画状态的帧数据 */
export type FrameMap = Partial<Record<AnimState, string[]>>

/**
 * 帧动画 hook。
 *
 * 使用 setInterval 固定间隔切换帧，不受显示器刷新率影响。
 * 当 frames 数据尚未加载完成时，返回 undefined（调用方应 fallback 到单图）。
 *
 * @param frames  按 AnimState 分组的 base64 帧数组
 * @param state   当前动画状态
 * @param config  各状态的帧数/fps 配置（用于查找 fps）
 * @param enabled 是否启用帧动画（有帧数据时为 true）
 * @returns 当前应显示的帧 base64，或 undefined（尚未就绪）
 */
export function useFrameAnimation(
  frames: FrameMap,
  state: AnimState,
  config: PetAnimation[] | undefined,
  enabled: boolean
): string | undefined {
  const [frameIdx, setFrameIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)

  // 状态切换时重置帧索引
  useEffect(() => {
    if (stateRef.current !== state) {
      stateRef.current = state
      setFrameIdx(0)
    }
  }, [state])

  useEffect(() => {
    if (!enabled || !config) return

    const animCfg = config.find((c) => c.state === state)
    if (!animCfg || animCfg.frames <= 1) return

    const frameMs = 1000 / animCfg.fps
    const frameCount = animCfg.frames
    const seq = frames[state]
    if (!seq || seq.length === 0) return

    intervalRef.current = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % frameCount)
    }, frameMs)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, state, config, frames])

  if (!enabled) return undefined

  const seq = frames[state]
  if (!seq || seq.length === 0) return undefined

  return seq[frameIdx]
}
