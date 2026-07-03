// Period selector — the single, store-backed month stepper shared by every
// view (§4.3, §8.1). Month nav only for now (§11). Changing the period here
// updates the store, so switching views keeps the same period.

import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useStatistikStore } from './shared/store/useStatistikStore'
import { stepMonthPeriod } from './shared/period'

export function PeriodSelector() {
  const period = useStatistikStore((s) => s.period)
  const setPeriod = useStatistikStore((s) => s.setPeriod)

  const step = (delta: number) => setPeriod(stepMonthPeriod(period, delta))

  return (
    <div className="flex items-center gap-0.5 rounded-[9px] border border-kanal-line bg-kanal-surf px-1 py-0.5">
      <button
        type="button"
        aria-label="Bulan sebelumnya"
        onClick={() => step(-1)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-kanal-fg3 transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-kanal-teal"
      >
        <CaretLeft size={13} weight="bold" />
      </button>
      <span className="tnum min-w-[62px] text-center font-mono text-[13px] text-kanal-fg2">
        {period.label}
      </span>
      <button
        type="button"
        aria-label="Bulan berikutnya"
        onClick={() => step(1)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-kanal-fg3 transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-kanal-teal"
      >
        <CaretRight size={13} weight="bold" />
      </button>
    </div>
  )
}
