// Dynamic scene layout (Stage 5). Derives the income prisms (per account) and
// expense ridges (per category) from the REAL transactions of the active
// period, and computes their 3D positions — count is no longer fixed at 5/7.
// Sources, Destinations and Particles all read positioned banks from here, so
// the layout has a single source of truth.

import { useMemo } from 'react'
import { useTransactions } from '../../../../data/useTransactions'
import { useStatistikStore } from '../../shared/store/useStatistikStore'
import {
  DESTINATIONS,
  SOURCES,
  heightForTotal,
} from '../config/sceneConstants'
import type { Transaction } from '../data/types'

export interface SceneBank {
  key: string // account or category name
  total: number
  count: number
  x: number
  y: number // top of the prism/ridge
  z: number
  height: number
  widthScale: number // ridge width factor so dense banks don't overlap
}

export interface AliranScene {
  sources: SceneBank[]
  destinations: SceneBank[]
  transactions: Transaction[]
  sourceByKey: Map<string, SceneBank>
  destByKey: Map<string, SceneBank>
  totalIncome: number
  totalExpense: number
  txCount: number
}

const Z_HALF = 2.7

// n positions evenly spread across [-Z_HALF, Z_HALF].
function spreadZ(n: number): number[] {
  if (n <= 0) return []
  if (n === 1) return [0]
  return Array.from({ length: n }, (_, i) => -Z_HALF + (i * (2 * Z_HALF)) / (n - 1))
}

// Biggest at centre, alternating outward: [3,2,4,1,5,0,6].
function centerOut(n: number): number[] {
  const center = Math.floor(n / 2)
  const pos = [center]
  for (let k = 1; k < n; k++) {
    const off = Math.ceil(k / 2)
    pos[k] = center + (k % 2 === 1 ? -off : off)
  }
  return pos
}

function tally(
  transactions: Transaction[],
  type: 'masuk' | 'keluar',
  keyOf: (t: Transaction) => string | undefined,
): Array<[string, { total: number; count: number }]> {
  const by = new Map<string, { total: number; count: number }>()
  for (const t of transactions) {
    if (t.type !== type) continue
    const key = keyOf(t)
    if (!key) continue
    const e = by.get(key) ?? { total: 0, count: 0 }
    e.total += t.amount
    e.count += 1
    by.set(key, e)
  }
  return [...by.entries()].sort((a, b) => b[1].total - a[1].total)
}

export function useSceneData(): AliranScene {
  const period = useStatistikStore((s) => s.period)
  const { transactions } = useTransactions(period)

  return useMemo(() => {
    // Sources = every account with activity (money is spent FROM accounts, so an
    // expense flow needs its account on the left bank even if it has no income).
    // Height reflects income received; spending-only accounts stay short.
    const accMap = new Map<string, { income: number; expense: number; count: number }>()
    for (const t of transactions) {
      if (t.type === 'pindah') continue
      const e = accMap.get(t.account) ?? { income: 0, expense: 0, count: 0 }
      if (t.type === 'masuk') e.income += t.amount
      else if (t.type === 'keluar') e.expense += t.amount
      e.count += 1
      accMap.set(t.account, e)
    }
    const src = [...accMap.entries()].sort(
      (a, b) => b[1].income - a[1].income || b[1].expense - a[1].expense,
    )
    const dst = tally(transactions, 'keluar', (t) => t.category)

    // Income prisms: spread along the left bank, biggest → smallest.
    const srcZ = spreadZ(src.length)
    const sources: SceneBank[] = src.map(([key, v], i) => {
      const height = Math.max(0.3, heightForTotal(v.income || v.expense * 0.35))
      return {
        key,
        total: v.income,
        count: v.count,
        x: SOURCES.x,
        y: height,
        z: srcZ[i] ?? 0,
        height,
        widthScale: 1,
      }
    })

    // Expense ridges: centre-out (biggest in the middle). Ridge width shrinks
    // as count grows so a busy month's categories still read as separate banks.
    const dstZ = spreadZ(dst.length)
    const order = centerOut(dst.length)
    const spacing = dst.length > 1 ? (2 * Z_HALF) / (dst.length - 1) : 2 * Z_HALF
    const widthScale = Math.min(1, Math.max(0.34, (spacing * 0.82) / DESTINATIONS.step.baseW))
    const destinations: SceneBank[] = dst.map(([key, v], rank) => {
      const height = Math.max(0.4, heightForTotal(v.total))
      return {
        key,
        total: v.total,
        count: v.count,
        x: DESTINATIONS.x,
        y: height,
        z: dstZ[order[rank]] ?? 0,
        height,
        widthScale,
      }
    })

    return {
      sources,
      destinations,
      transactions,
      sourceByKey: new Map(sources.map((s) => [s.key, s])),
      destByKey: new Map(destinations.map((d) => [d.key, d])),
      totalIncome: src.reduce((a, [, v]) => a + v.income, 0),
      totalExpense: dst.reduce((a, [, v]) => a + v.total, 0),
      txCount: transactions.length,
    }
  }, [transactions])
}
