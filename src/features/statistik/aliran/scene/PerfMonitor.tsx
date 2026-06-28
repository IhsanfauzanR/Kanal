// Auto performance tiering (§8.1). Samples FPS in-canvas; if it stays below
// PERF.lowFps for a sustained streak, steps the quality tier down
// (high → medium → low), which drops DPR and disables bloom. Never upgrades
// automatically (avoids oscillation).

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PERF } from '../config/sceneConstants'
import { useSceneStore } from '../hooks/useSceneStore'

export function PerfMonitor() {
  const acc = useRef({ t: 0, frames: 0, lowStreak: 0 })

  useFrame((_, delta) => {
    const a = acc.current
    a.t += delta
    a.frames += 1
    if (a.t < PERF.sampleSec) return

    const fps = a.frames / a.t
    a.t = 0
    a.frames = 0
    a.lowStreak = fps < PERF.lowFps ? a.lowStreak + 1 : 0

    if (a.lowStreak >= PERF.streakToDowngrade) {
      a.lowStreak = 0
      const s = useSceneStore.getState()
      const next =
        s.qualityTier === 'high'
          ? 'medium'
          : s.qualityTier === 'medium'
            ? 'low'
            : null
      if (next) s.setQualityTier(next)
    }
  })

  return null
}
