// Tab-level Statistik state (Stage 4 §4.1): which view is active + the period.
// The Aliran scene keeps its own useSceneStore (scrubber/selection/quality) —
// this store is strictly tab-level concerns shared by all six segments.

import { create } from 'zustand'
import { monthPeriod, type StatistikPeriod } from '../period'

export type StatistikView =
  | 'aliran'
  | 'pemasukan-vs-pengeluaran'
  | 'runway'
  | 'kalender'
  | 'suasana'
  | 'tinjauan'

interface StatistikStore {
  currentView: StatistikView
  period: StatistikPeriod
  setView: (v: StatistikView) => void
  setPeriod: (p: StatistikPeriod) => void
}

// Default to the real current month — the app always opens on "now"; the
// stepper walks back into history from there.
const now = new Date()

export const useStatistikStore = create<StatistikStore>((set) => ({
  currentView: 'aliran',
  period: monthPeriod(now.getFullYear(), now.getMonth()),
  setView: (v) => set({ currentView: v }),
  setPeriod: (p) => set({ period: p }),
}))
