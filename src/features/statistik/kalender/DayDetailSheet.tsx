// Day detail bottom sheet (§7.3). Opens when a day cell is tapped; shows that
// day's expense total, a factual count line, and the transaction list — or a
// quiet empty message with a "log for this day" action.
//
// Motion: framer-motion slide-up on a calm spring (no overshoot — Kanal does
// not bounce), backdrop fade, drag-down to dismiss. prefers-reduced-motion
// collapses it to an instant show/hide and disables drag. Content is retained
// through the exit so the slide-down animates with data still present.
//
// The app renders inside a phone frame, so the mobile bottom sheet is the right
// form here; the §7.3 desktop side-panel variant is deferred.

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, X } from '@phosphor-icons/react'
import { useSheetHistory } from '../../../components/useSheetHistory'
import { accountLabel } from '../aliran/data/types'
import { dayHeaderLabel, rupiah, shortDate, signedRupiah } from '../shared/format'
import { SectionDivider } from '../shared/SectionDivider'
import type { DayTotals } from './hooks/useDailyTotals'

interface DayDetailSheetProps {
  date: Date | null
  totals: DayTotals | null
  onClose: () => void
  onLogForDay: (date: Date) => void
  onSeeAll: (date: Date) => void
}

const pad = (n: number) => String(n).padStart(2, '0')
const timeLabel = (d: Date) => `${pad(d.getHours())}.${pad(d.getMinutes())}`

export function DayDetailSheet({
  date,
  totals,
  onClose,
  onLogForDay,
  onSeeAll,
}: DayDetailSheetProps) {
  const reduce = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)
  const open = date !== null

  // Android back gesture/button closes the sheet instead of exiting the app.
  useSheetHistory(open, onClose)

  // Retain last content so the slide-down animates with data still rendered.
  const retained = useRef<{ date: Date; totals: DayTotals | null } | null>(null)
  if (date) retained.current = { date, totals }
  const data = date ? { date, totals } : retained.current

  useEffect(() => {
    if (!open) return
    sheetRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const d = data?.date ?? null
  const t = data?.totals ?? null
  const expense = t?.expense ?? 0
  const rows = t?.transactions ?? []
  const isEmpty = rows.length === 0

  const amountLabel = expense > 0 ? rupiah(expense, '−') : 'Rp 0'
  const countParts: string[] = []
  if (t && t.incomeCount > 0) countParts.push(`${t.incomeCount} pemasukan`)
  if (t && t.expenseCount > 0) countParts.push(`${t.expenseCount} pengeluaran`)
  if (t && t.transferCount > 0) countParts.push(`${t.transferCount} pindah`)
  const countLine = countParts.length > 0 ? countParts.join(' · ') : null

  return (
    // Direct keyed children only — a fragment breaks AnimatePresence's exit
    // tracking (ghost backdrop that eats taps after closing).
    <AnimatePresence>
      {open && d && (
        <motion.div
          key="backdrop"
          className="absolute inset-0 z-20 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {open && d && (
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={dayHeaderLabel(d)}
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 z-30 flex max-h-[74%] flex-col rounded-t-[26px] border-t border-kanal-line bg-kanal-bg shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.6)] focus:outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: 'spring', stiffness: 130, damping: 26, mass: 0.9 }
            }
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 650) onClose()
            }}
          >
            <div className="relative flex-none pt-2.5">
              <span
                aria-hidden="true"
                className="mx-auto block h-1 w-9 rounded-full bg-kanal-handle"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="absolute right-3 top-1.5 flex p-1 text-kanal-fg3 transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-[22px] pb-7 pt-3">
              <div className="font-mono text-[10px] tracking-[0.14em] text-kanal-fg3">
                {dayHeaderLabel(d)}
              </div>
              <div
                className={`mt-1.5 text-xl font-medium ${expense > 0 ? 'text-kanal-exp' : 'text-kanal-fg'}`}
              >
                {amountLabel}
              </div>
              {countLine && (
                <div className="mt-1 font-mono text-[11px] text-kanal-fg3">
                  {countLine}
                </div>
              )}

              {isEmpty ? (
                <div className="mt-12 flex flex-col items-center gap-4 text-center">
                  <p className="text-sm text-kanal-fg2">
                    Tidak ada catatan di hari ini.
                  </p>
                  <button
                    type="button"
                    onClick={() => onLogForDay(d)}
                    className="rounded-[10px] border border-kanal-line bg-kanal-surf px-3.5 py-2 text-[13px] font-medium text-kanal-fg2 transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
                  >
                    Catat untuk hari ini
                  </button>
                </div>
              ) : (
                <>
                  <SectionDivider label="TRANSAKSI" className="mt-5" />
                  <div className="mt-1">
                    {rows.map((r) => {
                      const isIncome = r.type === 'masuk'
                      const isTransfer = r.type === 'pindah'
                      const amountClass = isIncome
                        ? 'text-kanal-teal'
                        : isTransfer
                          ? 'text-kanal-fg2'
                          : 'text-kanal-exp'
                      const amountText = isTransfer
                        ? rupiah(r.amount)
                        : signedRupiah(isIncome ? r.amount : -r.amount)
                      const note =
                        isTransfer && r.toAccount
                          ? `${accountLabel(r.account)} → ${accountLabel(r.toAccount)} · ${timeLabel(r.timestamp)}`
                          : `${accountLabel(r.account)} · ${timeLabel(r.timestamp)}`
                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 border-t border-kanal-line py-3 first:border-t-0"
                        >
                          <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-kanal-surf font-mono text-[13px] text-kanal-fg">
                            {r.label.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[0.9375rem] text-kanal-fg">
                              {r.label}
                            </div>
                            <div className="font-mono text-[0.8125rem] text-kanal-fg3">
                              {note}
                            </div>
                          </div>
                          <span
                            className={`tnum flex-none font-mono text-[0.9375rem] ${amountClass}`}
                          >
                            {amountText}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSeeAll(d)}
                    className="mt-4 flex items-center gap-1.5 p-0.5 text-sm font-medium text-kanal-teal transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
                  >
                    Lihat semua catatan dari {shortDate(d)}
                    <ArrowRight size={14} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  )
}
