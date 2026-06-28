// Memoized scene buckets (sources / destinations / sorted transactions).
// Single source consumed by Sources, Destinations, particles (Day 4) and the
// desktop legends. Swaps to a Dexie hook in Stage 5 — call site unchanged.

import { useMemo } from 'react'
import { transformToScene } from '../data/transformToScene'
import type { SceneBuckets } from '../data/types'

export function useSceneData(): SceneBuckets {
  return useMemo(() => transformToScene(), [])
}
