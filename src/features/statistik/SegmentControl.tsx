// Statistik segment control. Stage Final: all six segments are active — Aliran,
// Pemasukan vs Pengeluaran, Runway, Kalender, Suasana, Tinjauan.

import { useRef, useState } from 'react'
import {
  useStatistikStore,
  type StatistikView,
} from './shared/store/useStatistikStore'

interface Segment {
  key: StatistikView
  label: string
  soon: boolean
}

const SEGMENTS: Segment[] = [
  { key: 'aliran', label: 'Aliran', soon: false },
  { key: 'pemasukan-vs-pengeluaran', label: 'Pemasukan vs Pengeluaran', soon: false },
  { key: 'runway', label: 'Runway', soon: false },
  { key: 'kalender', label: 'Kalender', soon: false },
  { key: 'suasana', label: 'Suasana', soon: false },
  { key: 'tinjauan', label: 'Tinjauan', soon: false },
]

export function SegmentControl() {
  const currentView = useStatistikStore((s) => s.currentView)
  const setView = useStatistikStore((s) => s.setView)
  const [tip, setTip] = useState<string | null>(null)
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onPick = (seg: Segment) => {
    if (!seg.soon) {
      setTip(null)
      setView(seg.key)
      return
    }
    setTip(seg.label)
    if (tipTimer.current) clearTimeout(tipTimer.current)
    tipTimer.current = setTimeout(() => setTip(null), 1900)
  }

  return (
    <div className="relative mt-3.5">
      <div className="no-scrollbar flex overflow-x-auto border-b border-kanal-line px-[22px]">
        {SEGMENTS.map((seg) => {
          const active = seg.key === currentView
          return (
            <button
              key={seg.key}
              type="button"
              onClick={() => onPick(seg)}
              aria-pressed={active}
              className={`-mb-px flex-none whitespace-nowrap border-b-2 px-3.5 pb-[11px] pt-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:text-kanal-fg ${
                active
                  ? 'border-kanal-teal text-kanal-teal'
                  : 'border-transparent text-kanal-fg3'
              }`}
            >
              {seg.label}
              {seg.soon && (
                <sub className="ml-[3px] align-baseline font-mono text-[8px] text-kanal-fg4">
                  Segera
                </sub>
              )}
            </button>
          )
        })}
      </div>

      {tip && (
        <div
          role="status"
          className="absolute left-[22px] top-[46px] z-10 rounded-lg border border-kanal-line bg-kanal-surf2 px-[11px] py-1.5 text-xs text-kanal-fg2"
        >
          {tip} · akan datang setelah v1.0
        </div>
      )}
    </div>
  )
}
