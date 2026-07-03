// Info-panel view models (§5 interaction), built from the real period data in
// the active scene. Source tap → account activity; destination tap → category
// spend with a per-account breakdown.

import { accountLabel, categoryLabel } from './data/types'
import { dots } from './format'
import type { AliranScene } from './hooks/useSceneData'
import type { SelectedElement } from './hooks/useSceneStore'

const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
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

const ROW_LIMIT = 12
const byTimeDesc = <T extends { timestamp: Date }>(a: T, b: T) =>
  b.timestamp.getTime() - a.timestamp.getTime()

function accountPanel(key: string, scene: AliranScene): PanelData {
  const label = accountLabel(key)
  const txns = scene.transactions
    .filter((t) => t.account === key && t.type !== 'pindah')
    .sort(byTimeDesc)
  const income = txns
    .filter((t) => t.type === 'masuk')
    .reduce((a, t) => a + t.amount, 0)

  return {
    kicker: 'AKUN',
    title: label,
    amount: '+Rp ' + dots(income),
    tone: 'income',
    sub: `Pemasukan periode ini · ${txns.length} transaksi`,
    rowsHeader: 'TRANSAKSI TERAKHIR',
    rows: txns.slice(0, ROW_LIMIT).map((t) => ({
      initial: t.label.charAt(0).toUpperCase(),
      title: t.label,
      note: `${t.type === 'masuk' ? 'Masuk' : t.category ? categoryLabel(t.category) : 'Keluar'} · ${shortDate(t.timestamp)}`,
      amount: (t.type === 'masuk' ? '+Rp ' : '−Rp ') + dots(t.amount),
      tone: t.type === 'masuk' ? ('income' as const) : ('expense' as const),
    })),
    linkText: `Lihat semua catatan ${label}`,
  }
}

function categoryPanel(key: string, scene: AliranScene): PanelData {
  const label = categoryLabel(key)
  const total = scene.destByKey.get(key)?.total ?? 0
  const pct =
    scene.totalExpense > 0
      ? ((total / scene.totalExpense) * 100).toFixed(1) + '%'
      : '0%'
  const txns = scene.transactions
    .filter((t) => t.type === 'keluar' && t.category === key)
    .sort(byTimeDesc)

  const byAcct = new Map<string, number>()
  for (const t of txns) byAcct.set(t.account, (byAcct.get(t.account) ?? 0) + t.amount)
  const breakdown = [...byAcct.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([acct, amt]) => ({ acct: accountLabel(acct), amount: '−Rp ' + dots(amt) }))

  return {
    kicker: 'KATEGORI PENGELUARAN',
    title: label,
    amount: '−Rp ' + dots(total),
    tone: 'expense',
    sub: `${pct} dari pengeluaran periode ini · ${txns.length} transaksi`,
    breakdown,
    rowsHeader: 'TRANSAKSI TERAKHIR',
    rows: txns.slice(0, ROW_LIMIT).map((t) => ({
      initial: label.charAt(0).toUpperCase(),
      title: t.label,
      note: `${accountLabel(t.account)} · ${shortDate(t.timestamp)}`,
      amount: '−Rp ' + dots(t.amount),
      tone: 'expense' as const,
    })),
    linkText: `Lihat semua catatan ${label}`,
  }
}

export function buildPanelData(
  selected: SelectedElement,
  scene: AliranScene,
): PanelData | null {
  if (!selected) return null
  if (selected.type === 'source') return accountPanel(selected.accountId, scene)
  if (selected.type === 'destination')
    return categoryPanel(selected.categoryId, scene)
  return null
}
