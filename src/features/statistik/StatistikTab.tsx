// Statistik tab shell. Hosts the active view (store-driven). Aliran (Stage 3C)
// keeps its tab-level ContextStrip; the Stage 4 views render their own
// ViewHeader. Segment switching is a 150ms opacity crossfade (§8) — no slide.
//
// Stage Final: this tab now lives inside the app-wide AppShell (bottom nav), so
// it renders content only — the phone frame is owned by the shell. Suasana +
// Tinjauan are enabled here. The Aliran scene recolours itself per theme via
// scenePalette (colours only; geometry/motion locked).

import { lazy, Suspense } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PeriodSelector } from './PeriodSelector'
import { ContextStrip } from './ContextStrip'
import { SegmentControl } from './SegmentControl'
import { KalenderView } from './kalender/KalenderView'
import { RunwayView } from './runway/RunwayView'
import { SuasanaView } from './suasana/SuasanaView'
import { TinjauanView } from './tinjauan/TinjauanView'
import { ViewLoading } from './shared/ViewLoading'
import { ViewErrorBoundary } from './shared/ViewErrorBoundary'
import {
  useStatistikStore,
  type StatistikView,
} from './shared/store/useStatistikStore'

// Code-split the heavy views (§9): Aliran pulls three.js, the chart pulls
// recharts. Kalender + Runway + Suasana + Tinjauan are light (date-fns / plain
// math) and stay eager.
const AliranView = lazy(() =>
  import('./aliran/AliranView').then((m) => ({ default: m.AliranView })),
)
const PemasukanPengeluaranView = lazy(() =>
  import('./pemasukan-vs-pengeluaran/PemasukanPengeluaranView').then((m) => ({
    default: m.PemasukanPengeluaranView,
  })),
)

function renderView(view: StatistikView) {
  switch (view) {
    case 'aliran':
      return <AliranView />
    case 'kalender':
      return <KalenderView />
    case 'pemasukan-vs-pengeluaran':
      return <PemasukanPengeluaranView />
    case 'runway':
      return <RunwayView />
    case 'suasana':
      return <SuasanaView />
    case 'tinjauan':
      return <TinjauanView />
    default:
      return null
  }
}

export function StatistikTab() {
  const currentView = useStatistikStore((s) => s.currentView)
  const reduce = useReducedMotion()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-[22px] pt-2">
        <h1 className="text-xl font-medium tracking-[-0.01em] text-kanal-fg">Statistik</h1>
        <PeriodSelector />
      </div>

      {currentView === 'aliran' && <ContextStrip />}
      <SegmentControl />

      {/* View area. A keyed enter-fade (no AnimatePresence/mode="wait") so a
          view switch can never stall waiting on an exit animation; the error
          boundary keeps one failing view from blanking the others. */}
      <div className="relative mx-4 mb-3.5 mt-3.5 flex min-h-0 flex-1">
        <motion.div
          key={currentView}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="flex min-h-0 flex-1"
        >
          <ViewErrorBoundary resetKey={currentView}>
            <Suspense fallback={<ViewLoading />}>{renderView(currentView)}</Suspense>
          </ViewErrorBoundary>
        </motion.div>
      </div>
    </div>
  )
}
