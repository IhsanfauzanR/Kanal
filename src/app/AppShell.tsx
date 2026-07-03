// App shell (Stage Final). Owns the phone frame (moved up from StatistikTab so
// every tab shares it) and the bottom nav, and mounts the two global overlays
// (Catat + Pengaturan). Each tab renders its own header + scroll region inside
// the content slot; sheets are absolute to this frame.

import { lazy, Suspense } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useUiStore } from './uiStore'
import { BottomNav } from './BottomNav'
import { BerandaTab } from '../features/beranda/BerandaTab'
import { CatatanTab } from '../features/catatan/CatatanTab'
import { CatatSheet } from '../features/catat/CatatSheet'
import { PengaturanSheet } from '../features/settings/PengaturanSheet'
import { ViewLoading } from '../features/statistik/shared/ViewLoading'

// Statistik pulls the heaviest deps (three.js via its Aliran chunk); load the
// whole tab lazily so Beranda paints without it.
const StatistikTab = lazy(() =>
  import('../features/statistik/StatistikTab').then((m) => ({ default: m.StatistikTab })),
)
const AsetTab = lazy(() =>
  import('../features/aset/AsetTab').then((m) => ({ default: m.AsetTab })),
)

function ActiveTab() {
  const tab = useUiStore((s) => s.tab)
  switch (tab) {
    case 'beranda':
      return <BerandaTab />
    case 'catatan':
      return <CatatanTab />
    case 'statistik':
      return (
        <Suspense fallback={<div className="flex flex-1 p-4"><ViewLoading /></div>}>
          <StatistikTab />
        </Suspense>
      )
    case 'aset':
      return (
        <Suspense fallback={<div className="flex flex-1 p-4"><ViewLoading /></div>}>
          <AsetTab />
        </Suspense>
      )
    default:
      return null
  }
}

export function AppShell() {
  const tab = useUiStore((s) => s.tab)
  const reduce = useReducedMotion()

  return (
    <div className="app-height flex w-full items-stretch justify-center bg-[color:var(--frame-bg)] md:items-center md:p-6">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-kanal-bg pt-[env(safe-area-inset-top)] md:h-[844px] md:max-h-full md:w-[390px] md:rounded-phone md:border md:border-kanal-line">
        {/* content slot */}
        <div className="flex min-h-0 flex-1 flex-col">
          <motion.div
            key={tab}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <ActiveTab />
          </motion.div>
        </div>

        <BottomNav />

        {/* global overlays, anchored to the frame */}
        <CatatSheet />
        <PengaturanSheet />
      </div>
    </div>
  )
}
