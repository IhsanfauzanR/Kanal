// transactions → scene buckets — see KANAL_STAGE_3C_BRIEF.md §4.
//
// For Stage 3C the source/destination aggregates come from the locked,
// screenshot-approved CANONICAL_* tables so prism/ridge heights and legends
// match the Stage 3B screens exactly. The transaction list is passed through
// (chronologically sorted) for the particle layer.
//
// deriveAggregates() is the real summing path used in Stage 5 once Dexie data
// arrives: call transformToScene(realTxns) with no canonical override and the
// buckets are computed from the transactions themselves.

import {
  CANONICAL_DESTINATIONS,
  CANONICAL_SOURCES,
  CANONICAL_TOTAL_EXPENSE,
  CANONICAL_TOTAL_INCOME,
  MOCK_TRANSACTIONS,
  PERIOD_END,
  PERIOD_START,
} from './mockTransactions'
import type {
  DestinationBucket,
  SceneBuckets,
  SourceBucket,
  Transaction,
} from './types'

interface TransformOptions {
  periodStart?: Date
  periodEnd?: Date
  /** Locked aggregates to display. Omit to use canonical screenshot data. */
  sources?: SourceBucket[]
  destinations?: DestinationBucket[]
  /** Stage 5: sum aggregates from the transactions instead of canonical. */
  derive?: boolean
}

function deriveAggregates(txns: Transaction[]): {
  sources: SourceBucket[]
  destinations: DestinationBucket[]
} {
  const srcMap = new Map<string, SourceBucket>()
  const dstMap = new Map<string, DestinationBucket>()

  for (const t of txns) {
    if (t.type === 'masuk') {
      const cur = srcMap.get(t.account) ?? {
        accountId: t.account,
        total: 0,
        transactionCount: 0,
      }
      cur.total += t.amount
      cur.transactionCount += 1
      srcMap.set(t.account, cur)
    } else if (t.type === 'keluar' && t.category) {
      const cur = dstMap.get(t.category) ?? {
        categoryId: t.category,
        total: 0,
        transactionCount: 0,
      }
      cur.total += t.amount
      cur.transactionCount += 1
      dstMap.set(t.category, cur)
    }
    // 'pindah' moves between accounts — neither income nor expense.
  }

  return {
    sources: [...srcMap.values()],
    destinations: [...dstMap.values()],
  }
}

export function transformToScene(
  transactions: Transaction[] = MOCK_TRANSACTIONS,
  options: TransformOptions = {},
): SceneBuckets {
  const sorted = [...transactions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  )

  const derived = options.derive ? deriveAggregates(sorted) : null
  const sources =
    options.sources ?? derived?.sources ?? CANONICAL_SOURCES
  const destinations =
    options.destinations ?? derived?.destinations ?? CANONICAL_DESTINATIONS

  // When aggregates are derived/overridden, recompute totals from them;
  // otherwise use the locked canonical totals (screenshot-accurate).
  const usingCanonical = !options.sources && !options.destinations && !derived

  return {
    sources,
    destinations,
    transactions: sorted,
    periodStart: options.periodStart ?? PERIOD_START,
    periodEnd: options.periodEnd ?? PERIOD_END,
    totalIncome: usingCanonical
      ? CANONICAL_TOTAL_INCOME
      : sources.reduce((a, s) => a + s.total, 0),
    totalExpense: usingCanonical
      ? CANONICAL_TOTAL_EXPENSE
      : destinations.reduce((a, d) => a + d.total, 0),
  }
}

export { deriveAggregates }
