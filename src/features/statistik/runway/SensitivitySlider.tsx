// Scenario explorer (§6.2). "What if I cut Rp X/month?" — an exploratory tool,
// not a goal. The value resets when the view unmounts (no persistence), so Kanal
// never implies a target the user should hit.

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { longDate, rupiah } from '../shared/format'
import type { RunwayResult } from './hooks/useRunwayCalculation'

const MAX = 1_000_000
const STEP = 50_000

function formatMonths(m: number): string {
  const decimals = m < 10 ? 2 : 1
  return m.toFixed(decimals).replace('.', ',')
}

function scenarioLine(result: RunwayResult): string {
  if (result.isInfinite) return 'Runway baru: kas likuid mencukupi jangka panjang'
  if (result.isDeficit) return 'Runway baru: 0,0 bulan · habis hari ini'
  if (result.depletionDate) {
    return `Runway baru: ${formatMonths(result.runwayMonths)} bulan · habis ${longDate(result.depletionDate)}`
  }
  return ''
}

interface SensitivitySliderProps {
  value: number
  onChange: (v: number) => void
  scenarioResult: RunwayResult
  className?: string
}

export function SensitivitySlider({
  value,
  onChange,
  scenarioResult,
  className,
}: SensitivitySliderProps) {
  const reduce = useReducedMotion()
  const [expanded, setExpanded] = useState(false)
  const [raw, setRaw] = useState(value)

  // Keep the thumb in sync if the parent resets the value (e.g. on collapse).
  useEffect(() => setRaw(value), [value])

  // Debounce the committed value (§9) so dragging doesn't thrash the recompute.
  useEffect(() => {
    const id = setTimeout(() => onChange(raw), 50)
    return () => clearTimeout(id)
  }, [raw, onChange])

  const collapse = () => {
    setExpanded(false)
    setRaw(0)
    onChange(0)
  }

  return (
    <div className={className}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">
        Skenario
      </div>

      <AnimatePresence initial={false} mode="wait">
        {!expanded ? (
          <motion.div
            key="collapsed"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-2"
          >
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-[10px] border border-kanal-line bg-kanal-surf px-3.5 py-2 text-[13px] font-medium text-kanal-fg2 transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
            >
              Coba kurangi pengeluaran
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex items-center justify-between">
              <label
                htmlFor="runway-reduction"
                className="text-[13px] text-kanal-fg2"
              >
                Kurangi{' '}
                <span className="tnum font-mono text-kanal-fg">{rupiah(raw)}</span>{' '}
                / bulan
              </label>
              <button
                type="button"
                onClick={collapse}
                className="font-mono text-[11px] text-kanal-fg3 transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
              >
                Tutup
              </button>
            </div>

            <input
              id="runway-reduction"
              type="range"
              min={0}
              max={MAX}
              step={STEP}
              value={raw}
              onChange={(e) => setRaw(Number(e.target.value))}
              className="runway-slider mt-3"
              style={{ ['--fill' as string]: `${(raw / MAX) * 100}%` }}
              aria-label="Kurangi pengeluaran per bulan"
              aria-valuetext={`Kurangi ${rupiah(raw)} per bulan`}
            />

            <div className="mt-3 font-mono text-[12px] text-kanal-fg2">
              {scenarioLine(scenarioResult)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
