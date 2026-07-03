// Runway timeline (§6.2). Horizontal track from "now" forward. The right edge
// scales to the runway itself (≈2× the base runway), so the spent-fund fill and
// the depletion marker fill the track instead of cramming into a sliver against
// a mostly-empty 12-month scale. Spent portion = soft muted-red fade; depletion
// point = teal anchor. Marker/fill animate 300ms easeInOutCubic when the
// scenario slider moves (CSS transition — also honors reduced-motion).

import { addDays } from 'date-fns'
import { longDate, shortDate } from '../shared/format'
import type { RunwayResult } from './hooks/useRunwayCalculation'

const EASE = 'cubic-bezier(0.65,0,0.35,1)'
const NICE_DAYS = [1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 180, 365]

export function RunwayTimeline({
  result,
  baseRunwayDays,
  className,
}: {
  result: RunwayResult
  baseRunwayDays: number
  className?: string
}) {
  const finite = Number.isFinite(result.runwayDays)
  const runwayDays = finite ? result.runwayDays : 0

  // Domain is fixed to the BASE runway (so the marker still moves when the
  // scenario slider changes), with headroom so the scenario stays on screen.
  const safeBase =
    Number.isFinite(baseRunwayDays) && baseRunwayDays > 0 ? baseRunwayDays : 30
  const domainDays = Math.max(14, Math.ceil(safeBase * 2))
  const markerPct = finite ? Math.min(100, (runwayDays / domainDays) * 100) : 0

  // ~4 evenly-spaced ticks, snapped to a readable interval, labelled by date.
  const rawInterval = domainDays / 4
  const interval = NICE_DAYS.find((n) => n >= rawInterval) ?? Math.ceil(rawInterval)
  const today = new Date()
  const ticks: number[] = []
  for (let d = interval; d < domainDays - interval * 0.4; d += interval) ticks.push(d)

  return (
    <div className={className}>
      {/* depletion date, above its marker (kept clear of the baseline labels) */}
      <div className="relative mb-1.5 h-4 font-mono text-[11px]">
        {finite && result.depletionDate && (
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap text-kanal-teal transition-[left] duration-300"
            style={{
              left: `${Math.max(8, Math.min(92, markerPct))}%`,
              transitionTimingFunction: EASE,
            }}
          >
            {shortDate(result.depletionDate)}
          </span>
        )}
      </div>

      {/* track */}
      <div
        className="relative h-16 overflow-hidden rounded-lg"
        style={{
          background:
            'linear-gradient(90deg, var(--timeline-start) 0%, var(--timeline-mid) 60%, var(--timeline-end) 100%)',
        }}
      >
        {finite && (
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-300"
            style={{
              width: `${markerPct}%`,
              background:
                'linear-gradient(90deg, rgba(193,107,91,0.22) 0%, rgba(193,107,91,0.12) 70%, rgba(193,107,91,0) 100%)',
              transitionTimingFunction: EASE,
            }}
          />
        )}

        {ticks.map((d) => (
          <span
            key={d}
            aria-hidden="true"
            className="absolute bottom-0 h-2 w-px bg-kanal-handle"
            style={{ left: `${(d / domainDays) * 100}%` }}
          />
        ))}

        {/* now */}
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-kanal-fg4" />

        {/* depletion anchor */}
        {finite && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-kanal-teal transition-[left] duration-300"
            style={{ left: `${markerPct}%`, transitionTimingFunction: EASE }}
          />
        )}
      </div>

      {/* baseline labels: today + interim dates */}
      <div className="relative mt-1.5 h-4 font-mono text-[10px] text-kanal-fg3">
        <span className="absolute left-0">Hari ini</span>
        {ticks.map((d) => (
          <span
            key={d}
            className="absolute -translate-x-1/2 whitespace-nowrap text-kanal-fg4"
            style={{ left: `${(d / domainDays) * 100}%` }}
          >
            {shortDate(addDays(today, d))}
          </span>
        ))}
      </div>

      <span className="sr-only">
        {finite && result.depletionDate
          ? `Kas likuid habis sekitar ${longDate(result.depletionDate)}.`
          : 'Kas likuid mencukupi jangka panjang.'}
      </span>
    </div>
  )
}
