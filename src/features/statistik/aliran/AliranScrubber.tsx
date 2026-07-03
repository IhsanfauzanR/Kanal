// Time scrubber + playback controls — DOM, not 3D (§9).
// Draggable track wired to the store (live fill + pill), play/pause and speed
// toggles. Stage Final: the pill + endpoints follow the ACTIVE period and real
// data (they were hardcoded to the Stage 3B mock span before), so scrubbing
// July shows July dates and the true cumulative spend.

import { useMemo, useRef } from 'react'
import { Play, Pause } from '@phosphor-icons/react'
import { useSceneStore, type PlaybackSpeed } from './hooks/useSceneStore'
import { useSceneData } from './hooks/useSceneData'
import { useStatistikStore } from '../shared/store/useStatistikStore'
import { shortDate } from '../shared/format'
import { dots } from './format'

const SPEEDS: PlaybackSpeed[] = [1, 2, 4]

export function AliranScrubber({ className = '' }: { className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const progress = useSceneStore((s) => s.scrubberProgress)
  const isPlaying = useSceneStore((s) => s.isPlaying)
  const speed = useSceneStore((s) => s.playbackSpeed)
  const setProgress = useSceneStore((s) => s.setScrubberProgress)
  const togglePlay = useSceneStore((s) => s.togglePlay)
  const setPlaying = useSceneStore((s) => s.setPlaying)
  const setSpeed = useSceneStore((s) => s.setSpeed)

  const period = useStatistikStore((s) => s.period)
  const { transactions } = useSceneData()

  // Expenses sorted by time, for the running cumulative in the pill.
  const expenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'keluar')
        .map((t) => ({ ms: t.timestamp.getTime(), amount: t.amount }))
        .sort((a, b) => a.ms - b.ms),
    [transactions],
  )

  const startMs = period.start.getTime()
  const endMs = period.end.getTime()
  const atMs = startMs + progress * (endMs - startMs)
  let cumulative = 0
  for (const e of expenses) {
    if (e.ms > atMs) break
    cumulative += e.amount
  }
  const pill = `${shortDate(new Date(atMs))} · Rp ${dots(cumulative)}`

  const pct = `${(progress * 100).toFixed(2)}%`

  const scrubTo = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setProgress((clientX - r.left) / r.width)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    setPlaying(false)
    e.currentTarget.setPointerCapture(e.pointerId)
    scrubTo(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) scrubTo(e.clientX)
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  const glass = 'backdrop-blur-md bg-kanal-glass border border-kanal-line'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Jeda' : 'Putar'}
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-kanal-teal transition-transform active:scale-95 ${glass}`}
      >
        {isPlaying ? (
          <Pause size={16} weight="fill" />
        ) : (
          <Play size={16} weight="fill" />
        )}
      </button>

      <div className="relative flex-1 pt-3.5">
        <div
          className="tnum absolute -top-3 -translate-x-1/2 whitespace-nowrap rounded-md border border-kanal-line bg-kanal-surf px-2 py-[3px] font-mono text-[9px] text-kanal-fg"
          style={{ left: pct }}
        >
          {pill}
        </div>

        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative flex h-4 cursor-pointer items-center"
        >
          <div className="absolute left-0 right-0 h-1 rounded-full bg-[color:var(--line)]" />
          <div
            className="absolute left-0 h-1 rounded-full"
            style={{
              width: pct,
              background: 'color-mix(in oklch, var(--teal) 70%, transparent)',
            }}
          />
          <div
            className="absolute h-4 w-4 -translate-x-1/2 rounded-full border-t border-white/50 bg-kanal-teal"
            style={{ left: pct }}
          />
        </div>

        <div className="mt-[3px] flex justify-between font-mono text-[9px] text-kanal-fg3">
          <span>{shortDate(period.start)}</span>
          <span>{shortDate(period.end)}</span>
        </div>
      </div>

      <div
        className={`flex flex-none gap-px rounded-lg p-0.5 ${glass}`}
        role="group"
        aria-label="Kecepatan"
      >
        {SPEEDS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSpeed(n)}
            className={`rounded-md px-[7px] py-1 font-mono text-[10px] transition-colors ${
              speed === n ? 'text-kanal-teal' : 'text-kanal-fg3'
            }`}
          >
            {n}×
          </button>
        ))}
      </div>
    </div>
  )
}
