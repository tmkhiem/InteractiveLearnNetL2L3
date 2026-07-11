// Step player: walks a Scenario's step list, auto-advancing on timers scaled
// by playback speed, with manual pause / step / reset. Kept UI-agnostic — it
// only exposes the current step index and controls.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Scenario } from '../model/scenario'

export type Speed = 'slow' | 'normal' | 'fast'

/** Multiplier applied to each step's base duration. */
export const SPEED_FACTOR: Record<Speed, number> = {
  slow: 2,
  normal: 1,
  fast: 0.5,
}

export interface Player {
  /** Index of the step currently displayed (-1 before Play). */
  index: number
  isPlaying: boolean
  isFinished: boolean
  speed: Speed
  /** Duration in ms of the current step, already scaled by speed. */
  currentDuration: number
  play: () => void
  pause: () => void
  /** Advance exactly one step (also pauses). */
  step: () => void
  reset: () => void
  setSpeed: (s: Speed) => void
}

export function usePlayer(scenario: Scenario | null): Player {
  const [index, setIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>('normal')

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const steps = useMemo(() => scenario?.steps ?? [], [scenario])
  const lastIndex = steps.length - 1
  const isFinished = index >= lastIndex && lastIndex >= 0

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const currentDuration =
    index >= 0 && index <= lastIndex
      ? steps[index].duration * SPEED_FACTOR[speed]
      : 0

  // Note: resetting on a new sender/receiver pair is handled by remounting the
  // Lesson (keyed by the pair), so this hook needs no scenario-change effect.

  // Auto-advance loop while playing. Schedules the next step only; reaching the
  // end simply stops scheduling (isFinished drives the "Replay" affordance).
  useEffect(() => {
    if (!isPlaying || steps.length === 0 || index >= lastIndex) return
    const next = index + 1
    const dur = steps[next].duration * SPEED_FACTOR[speed]
    timer.current = setTimeout(() => setIndex(next), dur)
    return clear
  }, [isPlaying, index, steps, lastIndex, speed, clear])

  const play = useCallback(() => {
    if (steps.length === 0) return
    // Replay from the start if we're already at the end.
    setIndex((i) => (i >= lastIndex ? -1 : i))
    setIsPlaying(true)
  }, [steps.length, lastIndex])

  const pause = useCallback(() => {
    clear()
    setIsPlaying(false)
  }, [clear])

  const step = useCallback(() => {
    clear()
    setIsPlaying(false)
    setIndex((i) => Math.min(i + 1, lastIndex))
  }, [clear, lastIndex])

  const reset = useCallback(() => {
    clear()
    setIsPlaying(false)
    setIndex(-1)
  }, [clear])

  return {
    index,
    // At the end we're internally still "playing" (no timer pending); surface
    // it as stopped so the UI offers Replay instead of Pause.
    isPlaying: isPlaying && !isFinished,
    isFinished,
    speed,
    currentDuration,
    play,
    pause,
    step,
    reset,
    setSpeed,
  }
}
