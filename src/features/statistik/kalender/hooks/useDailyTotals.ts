// Groups a period's transactions by calendar day (§7 hooks/useDailyTotals).
// Returns a keyed map plus the month's peak single-day expense, which drives
// the heatmap intensity normalization.

import { useMemo } from 'react'
import type { Transaction } from '../../aliran/data/types'

export interface DayTotals {
  date: Date // local midnight of that day
  expense: number
  income: number
  expenseCount: number
  incomeCount: number
  transferCount: number // 'pindah' — neither income nor expense
  transactions: Transaction[] // that day's rows, time-sorted
}

export interface DailyTotalsResult {
  byKey: Map<string, DayTotals>
  maxExpense: number
}

// Local Y-M-D key (avoids UTC drift from toISOString).
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function useDailyTotals(transactions: Transaction[]): DailyTotalsResult {
  return useMemo(() => {
    const byKey = new Map<string, DayTotals>()

    for (const t of transactions) {
      const key = dateKey(t.timestamp)
      let entry = byKey.get(key)
      if (!entry) {
        entry = {
          date: new Date(
            t.timestamp.getFullYear(),
            t.timestamp.getMonth(),
            t.timestamp.getDate(),
          ),
          expense: 0,
          income: 0,
          expenseCount: 0,
          incomeCount: 0,
          transferCount: 0,
          transactions: [],
        }
        byKey.set(key, entry)
      }
      entry.transactions.push(t)
      if (t.type === 'keluar') {
        entry.expense += t.amount
        entry.expenseCount += 1
      } else if (t.type === 'masuk') {
        entry.income += t.amount
        entry.incomeCount += 1
      } else if (t.type === 'pindah') {
        entry.transferCount += 1
      }
    }

    let maxExpense = 0
    for (const entry of byKey.values()) {
      entry.transactions.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      )
      if (entry.expense > maxExpense) maxExpense = entry.expense
    }

    return { byKey, maxExpense }
  }, [transactions])
}
