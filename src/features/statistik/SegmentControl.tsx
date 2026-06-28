// Statistik segment control (Stage 3B). Only "Aliran" is implemented this
// stage; the rest are marked "Segera" and surface a brief tooltip on tap
// without leaving Aliran (§12: other views are out of scope for 3C).

import { useRef, useState } from 'react'

interface Segment {
  key: string
  label: string
  soon: boolean
}

const SEGMENTS: Segment[] = [
  { key: 'aliran', label: 'Aliran', soon: false },
  { key: 'ivp', label: 'Pemasukan vs Pengeluaran', soon: true },
  { key: 'runway', label: 'Runway', soon: true },
  { key: 'kalender', label: 'Kalender', soon: true },
  { key: 'suasana', label: 'Suasana', soon: true },
  { key: 'tinjauan', label: 'Tinjauan', soon: true },
]

export function SegmentControl() {
  const [tip, setTip] = useState<string | null>(null)
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onPick = (seg: Segment) => {
    if (!seg.soon) {
      setTip(null)
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
          const active = seg.key === 'aliran'
          return (
            <button
              key={seg.key}
              type="button"
              onClick={() => onPick(seg)}
              className={`-mb-px flex-none whitespace-nowrap border-b-2 px-3.5 pb-[11px] pt-3 text-[13px] font-medium transition-colors ${
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
        <div className="absolute left-[22px] top-[46px] z-10 rounded-lg border border-kanal-line bg-kanal-surf2 px-[11px] py-1.5 text-xs text-kanal-fg2">
          {tip} · hadir di tahap berikutnya
        </div>
      )}
    </div>
  )
}
