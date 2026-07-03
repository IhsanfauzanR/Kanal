// One transaction row (Beranda + Catatan). Monogram from the label's first
// letter (accounts are word-first elsewhere; transactions get the monogram —
// §4.2 keeps the two deliberately distinct), title, a factual secondary line,
// and the toned amount. Tapping opens the edit sheet.

import { rupiah, signedRupiah } from '../features/statistik/shared/format'
import type { Transaction } from '../features/statistik/aliran/data/types'

const pad = (n: number) => String(n).padStart(2, '0')
const timeLabel = (d: Date) => `${pad(d.getHours())}.${pad(d.getMinutes())}`

function secondary(tx: Transaction, withTime: boolean): string {
  const parts: string[] = []
  if (tx.type === 'pindah') {
    parts.push(`${tx.account} → ${tx.toAccount ?? '—'}`)
  } else {
    if (tx.category && tx.category !== tx.label) parts.push(tx.category)
    parts.push(tx.account)
  }
  if (withTime) parts.push(timeLabel(tx.timestamp))
  return parts.join(' · ')
}

interface TransactionRowProps {
  tx: Transaction
  onClick?: (tx: Transaction) => void
  withTime?: boolean
}

export function TransactionRow({ tx, onClick, withTime = false }: TransactionRowProps) {
  const isIncome = tx.type === 'masuk'
  const isTransfer = tx.type === 'pindah'
  const amountClass = isIncome
    ? 'text-kanal-teal'
    : isTransfer
      ? 'text-kanal-fg2'
      : 'text-kanal-exp'
  const amountText = isTransfer
    ? rupiah(tx.amount)
    : signedRupiah(isIncome ? tx.amount : -tx.amount)

  return (
    <button
      type="button"
      onClick={() => onClick?.(tx)}
      className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-[13px] rounded-[11px] border-t border-kanal-line px-2 py-[13px] text-left transition-[background,transform] duration-150 first:border-t-0 active:scale-[0.985] hover:bg-kanal-fg/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
    >
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-kanal-surf font-mono text-[13px] text-kanal-fg">
        {tx.label.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] text-kanal-fg">{tx.label}</span>
        <span className="block truncate font-mono text-[0.8125rem] text-kanal-fg3">
          {secondary(tx, withTime)}
        </span>
      </span>
      <span className={`tnum flex-none font-mono text-[0.9375rem] font-medium ${amountClass}`}>
        {amountText}
      </span>
    </button>
  )
}
