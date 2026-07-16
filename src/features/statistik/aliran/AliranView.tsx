// Aliran view — mounts the canvas (or 2D Sankey fallback) + overlay UI (§9).
// Canvas, MENAMPILKAN chip, 2D/3D toggle, scrubber, info panel. Reduced-motion
// users land on the static 2D fallback automatically (§10 / a11y).

import { useEffect } from 'react'
import { ChartBar, type Icon } from '@phosphor-icons/react'
import { AliranCanvas } from './AliranCanvas'
import { SankeyFallback } from './SankeyFallback'
import { AliranScrubber } from './AliranScrubber'
import { AliranInfoPanel } from './AliranInfoPanel'
import { useSceneStore } from './hooks/useSceneStore'
import { useSceneData } from './hooks/useSceneData'
import { usePlayback } from './hooks/usePlayback'
import { useStatistikStore } from '../shared/store/useStatistikStore'

interface IconButtonProps {
  icon: Icon
  label: string
  onClick: () => void
  active?: boolean
}

function IconButton({ icon: Icon, label, onClick, active }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-kanal-line bg-kanal-glass backdrop-blur-md transition-transform active:scale-[0.94] ${
        active ? 'text-kanal-fg' : 'text-kanal-fg2'
      }`}
    >
      <Icon size={18} weight="regular" />
    </button>
  )
}

export function AliranView() {
  const use2DFallback = useSceneStore((s) => s.use2DFallback)
  const toggle2DFallback = useSceneStore((s) => s.toggle2DFallback)
  const set2DFallback = useSceneStore((s) => s.set2DFallback)
  const { txCount } = useSceneData()
  const periodLabel = useStatistikStore((s) => s.period.label)

  usePlayback()

  // Reduced-motion users get the static 2D Sankey instead of the animated scene.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      set2DFallback(true)
    }
  }, [set2DFallback])

  return (
    <div
      className="relative flex-1 overflow-hidden rounded-2xl border border-kanal-line"
      style={{
        background:
          'linear-gradient(180deg,var(--scene-edge) 0%,var(--scene-mid) 28%,var(--scene-mid) 72%,var(--scene-edge) 100%)',
      }}
      role="group"
      aria-label="Aliran — visualisasi arus kas: pemasukan mengalir ke pengeluaran"
    >
      {!use2DFallback ? <AliranCanvas /> : <SankeyFallback />}

      {/* WebGL tag (3D only) */}
      {!use2DFallback && (
        <span className="pointer-events-none absolute right-3.5 top-3 font-mono text-[9px] tracking-[0.06em] text-kanal-fg4">
          3D scene · WebGL
        </span>
      )}

      {/* MENAMPILKAN context chip */}
      <div className="rounded-[11px] absolute left-3 top-3 border border-kanal-line bg-kanal-glass px-3 py-[9px] backdrop-blur-md">
        <div className="font-mono text-[9px] tracking-[0.14em] text-kanal-fg3">
          MENAMPILKAN
        </div>
        <div className="mt-1 text-[13px] font-medium text-kanal-fg">
          {txCount} transaksi · {periodLabel}
        </div>
      </div>

      {/* Icon cluster (§9) — only the 2D/3D toggle remains */}
      <div className="absolute right-3 top-12 flex flex-col gap-1.5">
        <IconButton
          icon={ChartBar}
          label={use2DFallback ? 'Tampilan 3D' : 'Tampilan 2D'}
          onClick={toggle2DFallback}
          active={use2DFallback}
        />
      </div>

      {/* Scrubber (3D only) */}
      {!use2DFallback && (
        <AliranScrubber className="absolute bottom-3 left-3 right-3" />
      )}

      {/* Info panel (tap a prism/ridge) */}
      <AliranInfoPanel />
    </div>
  )
}
