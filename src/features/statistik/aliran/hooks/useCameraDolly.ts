// Camera dolly signalling across the Canvas boundary (§5.3).
// DOM/scene code requests a camera move via a nonce; CameraRig animates it.
//   reset  → back to the default framing
//   focus  → glide to centre on a tapped element (world point from the click)

import { create } from 'zustand'

type DollyMode = 'reset' | 'focus'

interface CameraDollyStore {
  nonce: number
  mode: DollyMode
  focusPoint: [number, number, number]
  requestReset: () => void
  focusOn: (point: [number, number, number]) => void
}

export const useCameraDolly = create<CameraDollyStore>((set) => ({
  nonce: 0,
  mode: 'reset',
  focusPoint: [0, 0, 0],
  requestReset: () => set((s) => ({ nonce: s.nonce + 1, mode: 'reset' })),
  focusOn: (point) =>
    set((s) => ({ nonce: s.nonce + 1, mode: 'focus', focusPoint: point })),
}))

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
