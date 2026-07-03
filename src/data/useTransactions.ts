// Single data-access layer (Stage 5). Reads the Dexie-backed in-memory store
// and filters to the requested period. `isLoading` is true until the first
// IndexedDB load completes (drives the views' loading skeletons).

import { useMemo } from 'react'
import type { Transaction } from '../features/statistik/aliran/data/types'
import { useTxStore } from './txStore'

export interface UseTransactionsResult {
  transactions: Transaction[]
  isLoading: boolean
}

export function useTransactions(period: {
  start: Date
  end: Date
}): UseTransactionsResult {
  const all = useTxStore((s) => s.transactions)
  const ready = useTxStore((s) => s.ready)
  const startMs = period.start.getTime()
  const endMs = period.end.getTime()

  const transactions = useMemo(() => {
    return all.filter((t) => {
      const ts = t.timestamp.getTime()
      return ts >= startMs && ts <= endMs
    })
  }, [all, startMs, endMs])

  return { transactions, isLoading: !ready }
}
