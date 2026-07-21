import { useState, useEffect, useRef } from 'react'
import type { AnimState, PetAnimation } from '@shared/types'

/** 每个动画状态的帧数据 */
export type FrameMap = Partial<Record<AnimState, string[]>>

/**
 * 帧动画 hook。
 *
 * 使用 requestAnimationFrame 精确控制帧率，根据动画状态切换不同的帧序列。
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
  const lastTimeRef = useRef(0)
  const rafRef = useRef(0)
  const stateRef = useRef(state)

  // 状态切换时重置帧索引
  useEffect(() => {
    if (stateRef.current !== state) {
      stateRef.current = state
      setFrameIdx(0)
      lastTimeRef.current = 0
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

    const tick = (time: number): void => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time
      }

      const delta = time - lastTimeRef.current

      if (delta >= frameMs) {
        // 直接计算应该在第几帧，避免 delta 累积导致的跳帧
        setFrameIdx((prev) => (prev + 1) % frameCount)
        // 对齐到帧边界，避免误差累积
        lastTimeRef.current = lastTimeRef.current + frameMs
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = 0
    }
  }, [enabled, state, config, frames])

  if (!enabled) return undefined

  const seq = frames[state]
  if (!seq || seq.length === 0) return undefined

  return seq[frameIdx]
}
