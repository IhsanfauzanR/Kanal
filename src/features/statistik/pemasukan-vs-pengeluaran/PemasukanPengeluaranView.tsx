// Pemasukan vs Pengeluaran view (§5). Dual cumulative lines with a sign-colored
// selisih fill, or daily delta bars with a net line. Custom tooltip, factual
// RINCIAN block, no celebratory motion on a positive selisih.

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTransactions } from '../../../data/useTransactions'
import { useStatistikStore } from '../shared/store/useStatistikStore'
import { stepMonthPeriod } from '../shared/period'
import { rupiah, shortDate, signedRupiah } from '../shared/format'
import { ViewHeader, type ViewStat } from '../shared/ViewHeader'
import { SectionDivider } from '../shared/SectionDivider'
import { EmptyState } from '../shared/EmptyState'
import { DualLineChart } from './DualLineChart'
import { useDailySeries } from './hooks/useDailySeries'

type Mode = 'kumulatif' | 'harian'

function ModeToggle({
  mode,
  onChange,
  className,
}: {
  mode: Mode
  onChange: (m: Mode) => void
  className?: string
}) {
  const reduce = useReducedMotion()
  const opts: Array<[Mode, string]> = [
    ['kumulatif', 'Kumulatif'],
    ['harian', 'Harian'],
  ]
  return (
    <div className={className}>
      <div className="inline-flex rounded-[10px] border border-kanal-line bg-kanal-surf p-0.5">
        {opts.map(([key, label]) => {
          const active = mode === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active}
              className="relative rounded-[8px] px-3.5 py-1.5 text-[12px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
            >
              {active && (
                <motion.span
                  layoutId="pp-mode-indicator"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[8px] border border-kanal-line bg-kanal-surf2"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 320, damping: 30 }
                  }
                />
              )}
              <span
                className={`relative z-10 ${active ? 'text-kanal-fg' : 'text-kanal-fg3'}`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChartLegend({ mode, className }: { mode: Mode; className?: string }) {
  return (
    <div
      className={`flex items-center gap-4 font-mono text-[11px] text-kanal-fg2 ${className ?? ''}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#7CB1AE' }} />
        Pemasukan
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#C16B5B' }} />
        Pengeluaran
      </span>
      {mode === 'kumulatif' ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-[2px] border border-kanal-line"
            style={{ backgroundColor: 'rgba(124,177,174,0.12)' }}
          />
          Selisih
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[2px] w-3.5 bg-kanal-fg" />
          Net
        </span>
      )}
    </div>
  )
}

function RincianRow({
  label,
  date,
  amount,
  sign,
}: {
  label: string
  date: Date | undefined
  amount: number | undefined
  sign: '+' | '−'
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] text-kanal-fg2">{label}</span>
      {date && amount != null ? (
        <span className="tnum font-mono text-[13px]">
          <span className="text-kanal-fg3">{shortDate(date)} · </span>
          <span className={sign === '+' ? 'text-kanal-teal' : 'text-kanal-exp'}>
            {rupiah(amount, sign)}
          </span>
        </span>
      ) : (
        <span className="font-mono text-[13px] text-kanal-fg4">—</span>
      )}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center opacity-40 motion-safe:animate-pulse">
      <svg viewBox="0 0 320 180" className="h-full w-full" preserveAspectRatio="none">
        <line x1="34" y1="8" x2="34" y2="160" stroke="var(--line-strong)" strokeWidth="1" />
        <line x1="34" y1="160" x2="312" y2="160" stroke="var(--line-strong)" strokeWidth="1" />
        <line x1="34" y1="96" x2="312" y2="96" stroke="var(--fg4)" strokeWidth="2" />
      </svg>
    </div>
  )
}

export function PemasukanPengeluaranView() {
  const period = useStatistikStore((s) => s.period)
  const setPeriod = useStatistikStore((s) => s.setPeriod)
  const { transactions, isLoading } = useTransactions(period)
  const series = useDailySeries(transactions, period)
  const [mode, setMode] = useState<Mode>('kumulatif')

  const headerStats: ViewStat[] = [
    { label: 'Pemasukan', value: rupiah(series.totalIncome) },
    { label: 'Pengeluaran', value: rupiah(series.totalExpense) },
    {
      label: 'Selisih',
      value: signedRupiah(series.selisih),
      tone: series.selisih >= 0 ? 'accent' : 'expense',
    },
    {
      label: 'Rasio simpanan',
      value: series.savingsRatio.toFixed(1).replace('-', '−') + '%',
    },
  ]

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-kanal-line bg-kanal-bg">
      <div className="flex min-h-0 flex-1 flex-col gap-3 py-4">
        <ViewHeader title="Pemasukan vs Pengeluaran" stats={headerStats} />
        <ModeToggle mode={mode} onChange={setMode} className="px-[22px]" />
        <SectionDivider className="mx-[22px]" />

        <div
          className="relative min-h-0 flex-1 px-1.5"
          role="img"
          aria-label={`Grafik ${mode === 'kumulatif' ? 'kumulatif' : 'harian'} pemasukan dan pengeluaran, ${period.label}. Pemasukan ${rupiah(series.totalIncome)}, pengeluaran ${rupiah(series.totalExpense)}, selisih ${signedRupiah(series.selisih)}.`}
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : series.hasData ? (
            <DualLineChart points={series.points} ticks={series.ticks} mode={mode} />
          ) : (
            <EmptyState
              className="h-full"
              message="Tidak ada catatan di periode ini."
              actionLabel="Pilih periode lain"
              onAction={() => setPeriod(stepMonthPeriod(period, -1))}
            />
          )}
        </div>

        <ChartLegend mode={mode} className="px-[22px]" />
        <SectionDivider label="RINCIAN" className="mx-[22px] mt-1" />
        <div className="flex flex-col gap-2.5 px-[22px]">
          <RincianRow
            label="Hari pemasukan terbesar"
            date={series.topIncomeDay?.date}
            amount={series.topIncomeDay?.amount}
            sign="+"
          />
          <RincianRow
            label="Hari pengeluaran terbesar"
            date={series.topExpenseDay?.date}
            amount={series.topExpenseDay?.amount}
            sign="−"
          />
        </div>
      </div>
    </div>
  )
}
