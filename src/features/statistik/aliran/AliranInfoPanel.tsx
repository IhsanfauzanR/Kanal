// Info panel — bottom sheet shown when a prism/ridge is tapped (§5 interaction).
// Slides up over the canvas; tap the backdrop or close to dismiss. Content is
// retained during the slide-down so the exit animates cleanly. Matches the
// Stage 3B panel: kicker · title · amount · sub · breakdown · transactions.

import { useCallback, useEffect, useRef } from 'react'
import { ArrowRight, X } from '@phosphor-icons/react'
import { useSheetHistory } from '../../../components/useSheetHistory'
import { useSceneStore } from './hooks/useSceneStore'
import { useSceneData } from './hooks/useSceneData'
import { useCameraDolly } from './hooks/useCameraDolly'
import { buildPanelData, type AmountTone, type PanelData } from './panelData'

const toneClass = (t: AmountTone) =>
  t === 'income' ? 'text-kanal-teal' : 'text-kanal-exp'

export function AliranInfoPanel() {
  const selected = useSceneStore((s) => s.selectedElement)
  const clearSelection = useSceneStore((s) => s.clearSelection)
  const requestReset = useCameraDolly((s) => s.requestReset)

  // Dismiss the sheet AND return the camera to its default framing.
  const close = useCallback(() => {
    clearSelection()
    requestReset()
  }, [clearSelection, requestReset])

  const scene = useSceneData()
  const live = buildPanelData(selected, scene)
  const open = !!live

  // Retain the last content so the slide-down animates with data still present.
  const lastRef = useRef<PanelData | null>(null)
  if (live) lastRef.current = live
  const data = live ?? lastRef.current

  // Android back gesture/button closes the panel instead of exiting the app.
  useSheetHistory(open, close)

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      <div
        onClick={close}
        aria-hidden={!open}
        className="absolute inset-0 z-20 bg-black/50 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 z-30 flex h-[62%] flex-col rounded-t-[26px] border-t border-kanal-line bg-kanal-bg shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.6)] transition-transform duration-[320ms] ease-kanal"
        style={{ transform: open ? 'translateY(0)' : 'translateY(102%)' }}
      >
        {data && (
          <>
            <div className="flex flex-none items-center justify-between px-[22px] pt-2.5">
              <span className="h-1 w-7 rounded-full bg-kanal-handle" />
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="-mr-1 flex p-1 text-kanal-fg3 transition-transform active:scale-90"
              >
                <X size={19} />
              </button>
            </div>

            <div className="overflow-y-auto px-[22px] pb-6 pt-2">
              <div className="font-mono text-[10px] tracking-[0.14em] text-kanal-fg3">
                {data.kicker}
              </div>
              <div className="mt-1.5 text-xl font-medium text-kanal-fg">
                {data.title}
              </div>
              <div
                className={`tnum mt-2.5 font-mono text-[1.75rem] font-normal tracking-[-0.02em] ${toneClass(
                  data.tone,
                )}`}
              >
                {data.amount}
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-kanal-fg3">
                {data.sub}
              </div>

              {data.breakdown && data.breakdown.length > 0 && (
                <div className="mt-[18px] border-t border-kanal-line pt-3.5">
                  <div className="font-mono text-[10px] tracking-[0.14em] text-kanal-fg3">
                    BREAKDOWN AKUN
                  </div>
                  {data.breakdown.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-t border-kanal-line py-[11px]"
                    >
                      <span className="text-sm text-kanal-fg2">{r.acct}</span>
                      <span className="tnum font-mono text-sm text-kanal-exp">
                        {r.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {data.rows && data.rows.length > 0 && (
                <div className="mt-[18px] border-t border-kanal-line pt-3.5">
                  <div className="font-mono text-[10px] tracking-[0.14em] text-kanal-fg3">
                    {data.rowsHeader}
                  </div>
                  {data.rows.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border-t border-kanal-line py-3"
                    >
                      <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-kanal-surf font-mono text-[13px] text-kanal-fg">
                        {r.initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[0.9375rem] text-kanal-fg">
                          {r.title}
                        </div>
                        <div className="text-[0.8125rem] text-kanal-fg3">
                          {r.note}
                        </div>
                      </div>
                      <span
                        className={`tnum flex-none font-mono text-[0.9375rem] ${toneClass(
                          r.tone,
                        )}`}
                      >
                        {r.amount}
                      </span>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-4 flex items-center gap-1.5 p-0.5 text-sm font-medium text-kanal-teal"
                  >
                    {data.linkText}
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
