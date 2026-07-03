// Runway math (§6.1/§6.3). At the average spending rate, how long do the
// selected liquid assets last? Pure arithmetic — the view presents it neutrally,
// the user interprets. No moralizing here.

import { useMemo } from 'react'
import { addDays } from 'date-fns'
import { useTxStore } from '../../../../data/txStore'
import type { StatistikPeriod } from '../../shared/period'

// Per-month expense totals (keluar only) from the full dataset, ascending.
function monthlyExpense(
  transactions: { type: string; amount: number; timestamp: Date }[],
): Array<{ year: number; month: number; total: number }> {
  const byMonth = new Map<string, { year: number; month: number; total: number }>()
  for (const t of transactions) {
    if (t.type !== 'keluar') continue
    const year = t.timestamp.getFullYear()
    const month = t.timestamp.getMonth()
    const key = `${year}-${month}`
    const e = byMonth.get(key) ?? { year, month, total: 0 }
    e.total += t.amount
    byMonth.set(key, e)
  }
  return [...byMonth.values()].sort(
    (a, b) => a.year * 12 + a.month - (b.year * 12 + b.month),
  )
}

const DAYS_PER_MONTH = 30
const DEFICIT_THRESHOLD = 0.05 // months — rounds to 0,0
const INFINITE_THRESHOLD = 120 // months — show ">10 tahun"

export interface RunwayResult {
  avgMonthlySpend: number
  monthsUsed: number // how many months the average is based on (§6.3)
  liquid: number
  effectiveMonthlySpend: number
  runwayMonths: number
  runwayDays: number
  depletionDate: Date | null
  isDeficit: boolean
  isInfinite: boolean
  hasHistory: boolean
}

export function useRunwayCalculation(
  liquid: number,
  reductionPerMonth: number,
  period: StatistikPeriod,
): RunwayResult {
  const allTx = useTxStore((s) => s.transactions)

  return useMemo(() => {
    // Average over the last up-to-3 months that have data, ending at the
    // selected period. With only May+June available we use 2 (§6.3).
    const periodKey = period.start.getFullYear() * 12 + period.start.getMonth()
    const eligible = monthlyExpense(allTx)
      .filter((m) => m.year * 12 + m.month <= periodKey)
      .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month))
      .slice(-3)

    const monthsUsed = eligible.length
    const hasHistory = monthsUsed > 0
    const avgMonthlySpend = hasHistory
      ? eligible.reduce((a, m) => a + m.total, 0) / monthsUsed
      : 0
    const effectiveMonthlySpend = Math.max(0, avgMonthlySpend - reductionPerMonth)
    const today = new Date()

    const base = {
      avgMonthlySpend,
      monthsUsed,
      liquid,
      hasHistory,
    }

    if (!hasHistory) {
      return {
        ...base,
        effectiveMonthlySpend: 0,
        runwayMonths: 0,
        runwayDays: 0,
        depletionDate: null,
        isDeficit: false,
        isInfinite: false,
      }
    }

    if (effectiveMonthlySpend <= 0) {
      // Spending fully offset — effectively unbounded runway.
      return {
        ...base,
        effectiveMonthlySpend: 0,
        runwayMonths: Infinity,
        runwayDays: Infinity,
        depletionDate: null,
        isDeficit: false,
        isInfinite: true,
      }
    }

    const runwayMonths = liquid / effectiveMonthlySpend
    const runwayDays = runwayMonths * DAYS_PER_MONTH
    const isInfinite = runwayMonths > INFINITE_THRESHOLD
    const isDeficit = runwayMonths < DEFICIT_THRESHOLD

    return {
      ...base,
      effectiveMonthlySpend,
      runwayMonths,
      runwayDays,
      depletionDate: isInfinite ? null : addDays(today, Math.round(runwayDays)),
      isDeficit,
      isInfinite,
    }
  }, [allTx, liquid, reductionPerMonth, period])
}
