// Suasana (§4.3) — a spending "mood map": hour-of-day (six 4h buckets) ×
// day-of-week, built from all recorded expenses. Same stepped muted-red
// intensity scale as Kalender. Tapping a cell opens the slot's total, average,
// and its transactions. Needs ≥30 days of history; below that it shows a quiet
// skeleton with a factual note.

import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { useTxStore } from '../../../data/txStore'
import { useUiStore } from '../../../app/uiStore'
import { BottomSheet } from '../../../components/BottomSheet'
import { SectionDivider } from '../shared/SectionDivider'
import { ViewHeader, type ViewStat } from '../shared/ViewHeader'
import { abbreviateRupiah, rupiah } from '../shared/format'
import { intensityFill } from '../kalender/intensity'
import type { Transaction } from '../aliran/data/types'

const BUCKET_LABELS = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24'] as const
const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const
// Column index (Mon-first) → JS getDay() (0=Sun).
const jsDay = (col: number) => (col + 1) % 7
const pad = (n: number) => String(n).padStart(2, '0')
const timeLabel = (d: Date) => `${pad(d.getHours())}.${pad(d.getMinutes())}`

interface Slot {
  total: number
  count: number
  avg: number
  intensity: number
  txns: Transaction[]
}

function useSuasana(transactions: Transaction[]) {
  return useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'keluar')
    const empty = {
      grid: [] as Slot[][],
      stats: null as null | { busyHour: number; busyAvg: number; calmDay: number; calmAvg: number },
      months: 0,
      enough: false,
    }
    if (expenses.length === 0) return empty

    let min = expenses[0].timestamp.getTime()
    let max = min
    for (const t of expenses) {
      const ms = t.timestamp.getTime()
      if (ms < min) min = ms
      if (ms > max) max = ms
    }
    const spanDays = (max - min) / 86_400_000
    const enough = spanDays >= 30

    // Distinct occurrences of each weekday within the data span (for per-day avgs).
    const weekdayOccur = new Array(7).fill(0)
    for (let d = new Date(min); d.getTime() <= max; d.setDate(d.getDate() + 1)) {
      weekdayOccur[d.getDay()] += 1
    }

    // 6 buckets × 7 columns.
    const grid: Slot[][] = Array.from({ length: 6 }, () =>
      Array.from({ length: 7 }, () => ({ total: 0, count: 0, avg: 0, intensity: 0, txns: [] })),
    )
    // Per-hour totals + distinct active dates (for the busiest-hour stat).
    const hourTotal = new Array(24).fill(0)
    const hourDates: Array<Set<string>> = Array.from({ length: 24 }, () => new Set())

    for (const t of expenses) {
      const d = t.timestamp
      const bucket = Math.floor(d.getHours() / 4)
      const col = (d.getDay() + 6) % 7 // JS day → Mon-first column
      const cell = grid[bucket][col]
      cell.total += t.amount
      cell.count += 1
      cell.txns.push(t)
      hourTotal[d.getHours()] += t.amount
      hourDates[d.getHours()].add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    }

    let maxAvg = 0
    for (let b = 0; b < 6; b++) {
      for (let c = 0; c < 7; c++) {
        const cell = grid[b][c]
        const occ = weekdayOccur[jsDay(c)] || 1
        cell.avg = cell.total / occ
        cell.txns.sort((a, z) => z.timestamp.getTime() - a.timestamp.getTime())
        if (cell.avg > maxAvg) maxAvg = cell.avg
      }
    }
    for (let b = 0; b < 6; b++)
      for (let c = 0; c < 7; c++)
        grid[b][c].intensity = maxAvg > 0 ? grid[b][c].avg / maxAvg : 0

    // Busiest hour (highest avg per active date).
    let busyHour = 0
    let busyAvg = 0
    for (let h = 0; h < 24; h++) {
      const n = hourDates[h].size
      const avg = n ? hourTotal[h] / n : 0
      if (avg > busyAvg) {
        busyAvg = avg
        busyHour = h
      }
    }
    // Calmest weekday (lowest avg per weekday occurrence, among days with spend).
    const dayTotal = new Array(7).fill(0)
    for (const t of expenses) dayTotal[t.timestamp.getDay()] += t.amount
    let calmDay = 0
    let calmAvg = Infinity
    for (let jd = 0; jd < 7; jd++) {
      const occ = weekdayOccur[jd] || 1
      const avg = dayTotal[jd] / occ
      if (avg < calmAvg) {
        calmAvg = avg
        calmDay = jd
      }
    }

    const months = new Set(
      expenses.map((t) => `${t.timestamp.getFullYear()}-${t.timestamp.getMonth()}`),
    ).size

    return {
      grid,
      stats: { busyHour, busyAvg, calmDay, calmAvg: calmAvg === Infinity ? 0 : calmAvg },
      months,
      enough,
    }
  }, [transactions])
}

const DAY_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function SuasanaView() {
  const transactions = useTxStore((s) => s.transactions)
  const setTab = useUiStore((s) => s.setTab)
  const { grid, stats, months, enough } = useSuasana(transactions)
  const [sel, setSel] = useState<{ b: number; c: number } | null>(null)

  const headerStats: ViewStat[] = stats
    ? [
        {
          label: 'Jam paling sibuk',
          value: `${pad(stats.busyHour)}.00–${pad((stats.busyHour + 1) % 24)}.00 · rata-rata ${rupiah(Math.round(stats.busyAvg))}`,
        },
        {
          label: 'Hari paling tenang',
          value: `${DAY_LONG[stats.calmDay]} · rata-rata ${rupiah(Math.round(stats.calmAvg))}`,
        },
      ]
    : []

  const selected = sel ? grid[sel.b][sel.c] : null

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-kanal-line bg-kanal-bg">
      {!enough ? (
        <div className="relative flex flex-1 flex-col px-[22px] pt-5">
          <div className="pointer-events-none opacity-[0.15]">
            <div className="mb-1.5 grid grid-cols-[38px_repeat(7,1fr)] gap-[5px]">
              <span />
              {DAY_HEADERS.map((d) => (
                <span key={d} className="text-center font-mono text-[10px] text-kanal-fg3">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-[38px_repeat(7,1fr)] gap-[5px]">
              {Array.from({ length: 6 }).map((_, b) => (
                <FragmentRow key={b} label={BUCKET_LABELS[b]}>
                  {Array.from({ length: 7 }).map((_, c) => (
                    <span key={c} className="aspect-square rounded-md bg-kanal-skeleton" />
                  ))}
                </FragmentRow>
              ))}
            </div>
          </div>
          <p className="absolute inset-x-[22px] top-[44%] text-center text-sm leading-relaxed text-kanal-fg2">
            Butuh minimal 30 hari data untuk melihat pola suasana.
          </p>
        </div>
      ) : (
        <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto py-4">
          <ViewHeader title="Suasana" stats={headerStats} />
          <SectionDivider className="mx-[22px]" />

          <div className="px-[22px]">
            {/* day headers */}
            <div className="mb-1.5 grid grid-cols-[38px_repeat(7,1fr)] gap-[5px]">
              <span />
              {DAY_HEADERS.map((d) => (
                <span key={d} className="text-center font-mono text-[10px] text-kanal-fg3">
                  {d}
                </span>
              ))}
            </div>
            {/* grid */}
            <div className="grid grid-cols-[38px_repeat(7,1fr)] gap-[5px]">
              {grid.map((row, b) => (
                <FragmentRow key={b} label={BUCKET_LABELS[b]}>
                  {row.map((cell, c) => {
                    const weekend = c >= 5
                    const show = cell.intensity > 0.1
                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={cell.count === 0}
                        onClick={() => setSel({ b, c })}
                        aria-label={`${DAY_LONG[jsDay(c)]} ${BUCKET_LABELS[b]}${cell.count ? `, ${rupiah(Math.round(cell.avg))} rata-rata` : ', tanpa catatan'}`}
                        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-md transition-transform active:scale-[0.96] disabled:cursor-default disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-kanal-teal ${
                          weekend ? 'bg-kanal-weekend' : ''
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-0"
                          style={{ backgroundColor: intensityFill(cell.intensity) }}
                        />
                        {show && (
                          <span className="relative z-10 font-mono text-[10px] text-kanal-fg">
                            {abbreviateRupiah(cell.avg, false)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </FragmentRow>
              ))}
            </div>
            <div className="mt-5 font-mono text-[10px] text-kanal-fg3">
              Pola dari {months} bulan terakhir
            </div>
          </div>
        </div>
      )}

      <BottomSheet
        open={sel !== null}
        onClose={() => setSel(null)}
        ariaLabel="Rincian pola"
        maxHeight="64%"
      >
        {sel && selected && (
          <div className="px-[22px] pb-8 pt-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">
              {DAY_HEADERS[sel.c]} · {BUCKET_LABELS[sel.b]}
            </div>
            <div className="tnum mt-2.5 font-mono text-[1.75rem] font-normal tracking-[-0.02em] text-kanal-exp">
              {rupiah(selected.total, '−')}
            </div>
            <div className="mt-1.5 font-mono text-[11px] text-kanal-fg3">
              {rupiah(Math.round(selected.avg))} rata-rata per hari · {selected.count} kejadian dalam periode
            </div>
            <SectionDivider label="TRANSAKSI DALAM POLA INI" className="mt-4" />
            <div className="mt-1">
              {selected.txns.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 border-t border-kanal-line py-3 first:border-t-0"
                >
                  <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-kanal-surf font-mono text-[13px] text-kanal-fg">
                    {t.label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.9375rem] text-kanal-fg">{t.label}</div>
                    <div className="font-mono text-[0.8125rem] text-kanal-fg3">
                      {t.account} · {timeLabel(t.timestamp)}
                    </div>
                  </div>
                  <span className="tnum flex-none font-mono text-[0.9375rem] text-kanal-exp">
                    {rupiah(t.amount, '−')}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setSel(null)
                setTab('catatan')
              }}
              className="mt-4 flex items-center gap-1.5 p-0.5 text-sm font-medium text-kanal-teal transition-transform active:scale-[0.98]"
            >
              Lihat semua di Catatan
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

// Renders the left bucket label then its 7 cells (keeps the grid flat).
function FragmentRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="flex items-center font-mono text-[9px] text-kanal-fg3">{label}</span>
      {children}
    </>
  )
}
