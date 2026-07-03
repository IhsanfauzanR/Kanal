// Period model for the Statistik tab (Stage 4 §4.1).
// Month-based only for now — custom ranges and presets are out of scope (§11).

import { monthLabel } from './format'

export interface StatistikPeriod {
  start: Date
  end: Date
  label: string // "Jun 2026"
  granularity: 'month' | 'custom'
}

// Inclusive month window: 00:00:00.000 on the 1st → 23:59:59.999 on the last day.
export function monthPeriod(year: number, monthIndex: number): StatistikPeriod {
  return {
    start: new Date(year, monthIndex, 1, 0, 0, 0, 0),
    end: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
    label: monthLabel(year, monthIndex),
    granularity: 'month',
  }
}

// Step the period by whole months (prev/next nav in the header).
export function stepMonthPeriod(p: StatistikPeriod, delta: number): StatistikPeriod {
  return monthPeriod(p.start.getFullYear(), p.start.getMonth() + delta)
}
