// Scene + UI state — see KANAL_STAGE_3C_BRIEF.md §6.1.
//
// CRITICAL (§6.1): never read scrubberProgress reactively inside useFrame —
// it triggers subscriber re-renders. Use useSceneStore.getState() for
// non-reactive per-frame reads.

import { create } from 'zustand'

export type QualityTier = 'high' | 'medium' | 'low'
export type PlaybackSpeed = 1 | 2 | 4

// account/category keys are free strings (real catalog data, not the fixed set).
export type SelectedElement =
  | { type: 'source'; accountId: string }
  | { type: 'destination'; categoryId: string }
  | { type: 'particle'; transactionId: string }
  | null

interface SceneStore {
  // Scrubber
  scrubberProgress: number // 0..1 across the selected period
  isPlaying: boolean
  playbackSpeed: PlaybackSpeed

  // Selection (info panel)
  selectedElement: SelectedElement

  // Performance
  qualityTier: QualityTier

  // Reduced-motion / 2D fallback
  use2DFallback: boolean

  // Actions
  setScrubberProgress: (n: number) => void
  togglePlay: () => void
  setPlaying: (b: boolean) => void
  setSpeed: (s: PlaybackSpeed) => void
  selectElement: (el: SelectedElement) => void
  clearSelection: () => void
  setQualityTier: (t: QualityTier) => void
  toggle2DFallback: () => void
  set2DFallback: (b: boolean) => void
  resetScrubber: () => void
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export const useSceneStore = create<SceneStore>((set) => ({
  scrubberProgress: 0,
  isPlaying: false,
  playbackSpeed: 1,
  selectedElement: null,
  qualityTier: 'high',
  use2DFallback: false,

  setScrubberProgress: (n) => set({ scrubberProgress: clamp01(n) }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (b) => set({ isPlaying: b }),
  setSpeed: (s) => set({ playbackSpeed: s }),
  selectElement: (el) => set({ selectedElement: el }),
  clearSelection: () => set({ selectedElement: null }),
  setQualityTier: (t) => set({ qualityTier: t }),
  toggle2DFallback: () => set((s) => ({ use2DFallback: !s.use2DFallback })),
  set2DFallback: (b) => set({ use2DFallback: b }),
  resetScrubber: () => set({ scrubberProgress: 0, isPlaying: false }),
}))
