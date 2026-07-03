// Month heatmap (§7.1, §7.2). CSS grid, 7 columns, Monday-first. Leading and
// trailing days from adjacent months are shown dimmed for alignment. Cells are
// memoized; this component only recomputes the day list when month/data change.

import { useMemo } from 'react'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { WEEKDAY_HEADERS } from '../shared/format'
import { DayCell } from './DayCell'
import { dateKey, type DailyTotalsResult } from './hooks/useDailyTotals'

interface HeatmapGridProps {
  monthDate: Date
  daily: DailyTotalsResult
  todayKey: string
  onSelectDay: (date: Date) => void
}

export function HeatmapGrid({
  monthDate,
  daily,
  todayKey,
  onSelectDay,
}: HeatmapGridProps) {
  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
    const last = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start: first, end: last })
  }, [monthDate])

  return (
    <div>
      <div className="grid grid-cols-7 gap-[2px] pb-1.5">
        {WEEKDAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center font-mono text-[11px] text-kanal-fg3"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[2px]">
        {days.map((day) => {
          const key = dateKey(day)
          const totals = daily.byKey.get(key)
          const expense = totals?.expense ?? 0
          const intensity =
            daily.maxExpense > 0 ? expense / daily.maxExpense : 0
          const weekday = day.getDay()
          return (
            <DayCell
              key={key}
              date={day}
              inMonth={isSameMonth(day, monthDate)}
              isToday={key === todayKey}
              isWeekend={weekday === 0 || weekday === 6}
              expense={expense}
              hasIncome={(totals?.incomeCount ?? 0) > 0}
              txnCount={totals?.transactions.length ?? 0}
              intensity={intensity}
              onSelect={onSelectDay}
            />
          )
        })}
      </div>
    </div>
  )
}
