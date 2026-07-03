// App-shell UI state (Stage Final): which tab is active + the two globally
// mounted overlays (the Catat Transaksi sheet and the Pengaturan sheet). Kept
// deliberately small — tab routing is state, not URL (no router dependency);
// the SPA still serves one index.html so deep-links resolve to Beranda.

import { create } from 'zustand'

export type Tab = 'beranda' | 'catatan' | 'statistik' | 'aset'

// What the Catat sheet should open as. `date` seeds a back-dated entry (e.g.
// "catat untuk hari ini" from a calendar day); `editId` opens an existing tx.
export interface CatatIntent {
  editId?: string
  date?: Date
}

interface UiStore {
  tab: Tab
  setTab: (t: Tab) => void

  catatOpen: boolean
  catatIntent: CatatIntent
  openCatat: (intent?: CatatIntent) => void
  closeCatat: () => void

  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  tab: 'beranda',
  setTab: (tab) => set({ tab }),

  catatOpen: false,
  catatIntent: {},
  openCatat: (intent = {}) => set({ catatOpen: true, catatIntent: intent }),
  closeCatat: () => set({ catatOpen: false, catatIntent: {} }),

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}))
