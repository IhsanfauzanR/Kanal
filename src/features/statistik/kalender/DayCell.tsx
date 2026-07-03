// One day in the heatmap (§7.1). Memoized so re-rendering the grid only
// touches cells whose data changed. Layering, bottom to top:
//   weekend baseline tint → intensity fill → hover lift → content.
// Today gets a 1px inset teal border (no glow). Out-of-month days are dimmed
// and inert.

import { memo } from 'react'
import {
  abbreviateRupiah,
  DAYS_ID_LONG,
  MONTHS_ID_LONG,
  rupiah,
} from '../shared/format'
import { intensityFill } from './intensity'

export interface DayCellProps {
  date: Date
  inMonth: boolean
  isToday: boolean
  isWeekend: boolean
  expense: number
  hasIncome: boolean
  txnCount: number
  intensity: number
  onSelect: (date: Date) => void
}

function ariaLabel(p: DayCellProps): string {
  const d = `${p.date.getDate()} ${MONTHS_ID_LONG[p.date.getMonth()]}, ${DAYS_ID_LONG[p.date.getDay()]}`
  if (p.txnCount === 0) return `${d}. Tidak ada catatan`
  const spend = p.expense > 0 ? `pengeluaran ${rupiah(p.expense)}` : 'tanpa pengeluaran'
  const inc = p.hasIncome ? ', ada pemasukan' : ''
  return `${d}. ${spend}${inc}. ${p.txnCount} transaksi`
}

function DayCellImpl(props: DayCellProps) {
  const { date, inMonth, isToday, isWeekend, expense, hasIncome, intensity, onSelect } = props

  if (!inMonth) {
    return (
      <div
        aria-hidden="true"
        className="flex aspect-square min-h-[44px] select-none items-start rounded-md p-[var(--space-2xs)] opacity-30"
      >
        <span className="font-mono text-xs text-kanal-fg4">{date.getDate()}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-label={ariaLabel(props)}
      className={`group relative flex aspect-square min-h-[44px] flex-col overflow-hidden rounded-md p-[var(--space-2xs)] text-left transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-kanal-teal ${
        isToday ? 'ring-1 ring-inset ring-kanal-teal' : ''
      }`}
    >
      {isWeekend && <span aria-hidden="true" className="absolute inset-0 bg-kanal-weekend" />}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundColor: intensityFill(intensity) }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-kanal-fg/[0.03] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />

      <span className="relative z-10 flex items-start justify-between">
        <span className="font-mono text-xs text-kanal-fg2">{date.getDate()}</span>
        {hasIncome && (
          <span className="mt-[3px] h-1 w-1 rounded-full bg-kanal-teal" aria-hidden="true" />
        )}
      </span>

      {expense > 0 && (
        <span className="relative z-10 mt-auto w-full whitespace-nowrap text-center font-mono text-[10px] leading-none text-kanal-fg">
          {abbreviateRupiah(expense, false)}
        </span>
      )}
    </button>
  )
}

// Memo: cells re-render only when their own day data changes.
export const DayCell = memo(DayCellImpl)
