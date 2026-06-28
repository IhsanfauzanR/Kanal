// Playback clock (§5 scrubber). When playing, advances scrubberProgress 0→1
// over BASE_DURATION (scaled by playback speed) via rAF, then stops at the end.
// Particles + scrubber UI read the progress; this hook only writes it.

import { useEffect } from 'react'
import { useSceneStore } from './useSceneStore'

const BASE_DURATION_SEC = 24 // full 25 Mei → 26 Jun traversal at 1×

export function usePlayback() {
  const isPlaying = useSceneStore((s) => s.isPlaying)

  useEffect(() => {
    if (!isPlaying) return

    // Restart from the beginning if play is pressed at the end.
    if (useSceneStore.getState().scrubberProgress >= 0.999) {
      useSceneStore.getState().setScrubberProgress(0)
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const s = useSceneStore.getState()
      const next =
        s.scrubberProgress + (dt * s.playbackSpeed) / BASE_DURATION_SEC
      if (next >= 1) {
        s.setScrubberProgress(1)
        s.setPlaying(false)
        return
      }
      s.setScrubberProgress(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying])
}
