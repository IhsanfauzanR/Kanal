// Info-panel view models (§5 interaction). Built from the real mock
// transactions + canonical totals; mirrors the Stage 3B buildPanel variants:
//   A account (income)  ·  B category (expense)
// Particle (variant C) taps are not wired yet (Points raycasting — later).

import {
  CANONICAL_DESTINATIONS,
  CANONICAL_SOURCES,
  CANONICAL_TOTAL_EXPENSE,
  MOCK_TRANSACTIONS,
} from './data/mockTransactions'
import {
  ACCOUNT_LABELS,
  CATEGORY_LABELS,
  type AccountId,
  type CategoryId,
} from './data/types'
import { dots } from './format'
import type { SelectedElement } from './hooks/useSceneStore'

const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

export function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`
}

export type AmountTone = 'income' | 'expense'

export interface PanelRow {
  initial: string
  title: string
  note: string
  amount: string
  tone: AmountTone
}

export interface PanelData {
  kicker: string
  title: string
  amount: string
  tone: AmountTone
  sub: string
  breakdown?: { acct: string; amount: string }[]
  rows?: PanelRow[]
  rowsHeader?: string
  linkText: string
}

function accountPanel(id: AccountId): PanelData {
  const bucket = CANONICAL_SOURCES.find((s) => s.accountId === id)
  const total = bucket?.total ?? 0
  const label = ACCOUNT_LABELS[id]
  const txns = MOCK_TRANSACTIONS.filter(
    (t) => t.type === 'masuk' && t.account === id,
  ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return {
    kicker: 'AKUN PEMASUKAN',
    title: label,
    amount: '+Rp ' + dots(total),
    tone: 'income',
    sub: `Total bulan ini · dari ${bucket?.transactionCount ?? txns.length} transaksi`,
    rowsHeader: 'TRANSAKSI',
    rows: txns.map((t) => ({
      initial: t.label.charAt(0).toUpperCase(),
      title: t.label,
      note: `${ACCOUNT_LABELS[t.account]} · ${shortDate(t.timestamp)}`,
      amount: '+Rp ' + dots(t.amount),
      tone: 'income' as const,
    })),
    linkText: `Lihat semua catatan dari ${label}`,
  }
}

function categoryPanel(id: CategoryId): PanelData {
  const bucket = CANONICAL_DESTINATIONS.find((d) => d.categoryId === id)
  const total = bucket?.total ?? 0
  const label = CATEGORY_LABELS[id]
  const pct = ((total / CANONICAL_TOTAL_EXPENSE) * 100).toFixed(1) + '%'

  const txns = MOCK_TRANSACTIONS.filter(
    (t) => t.type === 'keluar' && t.category === id,
  ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // Breakdown by source account (real, summed). Fallback to proportional split.
  const byAcct = new Map<AccountId, number>()
  for (const t of txns) byAcct.set(t.account, (byAcct.get(t.account) ?? 0) + t.amount)
  let breakdown = [...byAcct.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([acct, amt]) => ({
      acct: ACCOUNT_LABELS[acct],
      amount: '−Rp ' + dots(amt),
    }))
  if (breakdown.length === 0) {
    breakdown = [
      { acct: 'Tunai', amount: '−Rp ' + dots(total * 0.5) },
      { acct: 'BJB', amount: '−Rp ' + dots(total * 0.3) },
      { acct: 'GoPay', amount: '−Rp ' + dots(total * 0.2) },
    ]
  }

  return {
    kicker: 'KATEGORI PENGELUARAN',
    title: label,
    amount: '−Rp ' + dots(total),
    tone: 'expense',
    sub: `${pct} dari pengeluaran bulan ini · ${bucket?.transactionCount ?? txns.length} transaksi`,
    breakdown,
    rowsHeader: `${txns.length} TRANSAKSI TERAKHIR`,
    rows: txns.map((t) => ({
      initial: label.charAt(0).toUpperCase(),
      title: t.label,
      note: `${ACCOUNT_LABELS[t.account]} · ${shortDate(t.timestamp)}`,
      amount: '−Rp ' + dots(t.amount),
      tone: 'expense' as const,
    })),
    linkText: `Lihat semua catatan ${label}`,
  }
}

export function buildPanelData(selected: SelectedElement): PanelData | null {
  if (!selected) return null
  if (selected.type === 'source') return accountPanel(selected.accountId)
  if (selected.type === 'destination') return categoryPanel(selected.categoryId)
  return null
}
