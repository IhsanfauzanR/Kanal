// Kalender view (§7). Daily spending heatmap for the active month, with a
// factual stats header, intensity legend, and a tap-to-open day detail sheet.
// Single-month only this stage (§7.5); period comes from the tab store.

import { useCallback, useMemo, useState } from 'react'
import { useTransactions } from '../../../data/useTransactions'
import { useUiStore } from '../../../app/uiStore'
import { useStatistikStore } from '../shared/store/useStatistikStore'
import { stepMonthPeriod } from '../shared/period'
import { rupiah, shortDate } from '../shared/format'
import { ViewHeader, type ViewStat } from '../shared/ViewHeader'
import { SectionDivider } from '../shared/SectionDivider'
import { EmptyState } from '../shared/EmptyState'
import { HeatmapGrid } from './HeatmapGrid'
import { GridLegend } from './GridLegend'
import { DayDetailSheet } from './DayDetailSheet'
import { dateKey, useDailyTotals } from './hooks/useDailyTotals'

function KalenderSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <div className="mx-[22px] h-3 w-2/3 rounded bg-kanal-skeleton" />
      <div className="px-3">
        <div className="grid grid-cols-7 gap-[2px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square min-h-[44px] rounded-md bg-kanal-skeleton motion-safe:animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function KalenderView() {
  const period = useStatistikStore((s) => s.period)
  const setPeriod = useStatistikStore((s) => s.setPeriod)
  const { transactions, isLoading } = useTransactions(period)
  const daily = useDailyTotals(transactions)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const todayKey = useMemo(() => dateKey(new Date()), [])

  const stats = useMemo(() => {
    const entries = [...daily.byKey.values()]
    const totalExpense = entries.reduce((a, e) => a + e.expense, 0)
    const expenseDays = entries.filter((e) => e.expense > 0)
    const avgDaily =
      expenseDays.length > 0 ? Math.round(totalExpense / expenseDays.length) : 0

    let busiest: { date: Date; expense: number } | null = null
    for (const e of expenseDays) {
      if (!busiest || e.expense > busiest.expense) {
        busiest = { date: e.date, expense: e.expense }
      }
    }

    const y = period.start.getFullYear()
    const m = period.start.getMonth()
    let lastActiveDay = 0
    for (const e of entries) {
      if (e.date.getMonth() === m && e.date.getDate() > lastActiveDay) {
        lastActiveDay = e.date.getDate()
      }
    }

    // Quietest = lowest-spend day among days that have happened this month;
    // a no-spend day legitimately reads as Rp 0 (§7.1 — never flagged).
    let quietest: { date: Date; expense: number } | null = null
    for (let dd = 1; dd <= lastActiveDay; dd++) {
      const day = new Date(y, m, dd)
      const exp = daily.byKey.get(dateKey(day))?.expense ?? 0
      if (!quietest || exp < quietest.expense) quietest = { date: day, expense: exp }
    }

    return { avgDaily, busiest, quietest, hasData: entries.length > 0 }
  }, [daily, period])

  const headerStats: ViewStat[] = stats.hasData
    ? [
        { label: 'Rata-rata harian', value: rupiah(stats.avgDaily) },
        {
          label: 'Hari tersibuk',
          value: stats.busiest
            ? `${shortDate(stats.busiest.date)} · ${rupiah(stats.busiest.expense)}`
            : '—',
        },
        {
          label: 'Hari terhening',
          value: stats.quietest
            ? `${shortDate(stats.quietest.date)} · ${rupiah(stats.quietest.expense)}`
            : '—',
        },
      ]
    : [
        { label: 'Rata-rata harian', value: 'Rp 0' },
        { label: 'Hari tersibuk', value: '—' },
        { label: 'Hari terhening', value: '—' },
      ]

  const selectedTotals = selectedDate
    ? (daily.byKey.get(dateKey(selectedDate)) ?? null)
    : null

  const onSelectDay = useCallback((date: Date) => setSelectedDate(date), [])
  const onClose = useCallback(() => setSelectedDate(null), [])

  // Stage Final: these tabs exist now — wire the stubbed callbacks through.
  const openCatat = useUiStore((s) => s.openCatat)
  const setTab = useUiStore((s) => s.setTab)
  const onLogForDay = useCallback(
    (date: Date) => {
      setSelectedDate(null)
      openCatat({ date })
    },
    [openCatat],
  )
  const onSeeAll = useCallback(() => {
    setSelectedDate(null)
    setTab('catatan')
  }, [setTab])

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-kanal-line bg-kanal-bg">
      {isLoading ? (
        <KalenderSkeleton />
      ) : (
        <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto py-4">
          <ViewHeader title="Kalender" stats={headerStats} />
          <SectionDivider className="mx-[22px]" />
          <div className="px-3">
            <HeatmapGrid
              monthDate={period.start}
              daily={daily}
              todayKey={todayKey}
              onSelectDay={onSelectDay}
            />
          </div>
          <GridLegend className="px-[22px]" />
          {!stats.hasData && (
            <EmptyState
              className="mt-3"
              message="Tidak ada catatan di bulan ini."
              actionLabel="Pilih periode lain"
              onAction={() => setPeriod(stepMonthPeriod(period, -1))}
            />
          )}
        </div>
      )}

      <DayDetailSheet
        date={selectedDate}
        totals={selectedTotals}
        onClose={onClose}
        onLogForDay={onLogForDay}
        onSeeAll={onSeeAll}
      />
    </div>
  )
}
