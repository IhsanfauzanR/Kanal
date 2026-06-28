// Statistik tab shell (Stage 3B) — hosts the Aliran view (Stage 3C).
// Mobile-first: full-bleed on phones, framed device on larger screens for
// review parity with the Claude Design screens.

import {
  BatteryMedium,
  CellSignalFull,
  WifiHigh,
} from '@phosphor-icons/react'
import { PeriodSelector } from './PeriodSelector'
import { ContextStrip } from './ContextStrip'
import { SegmentControl } from './SegmentControl'
import { AliranView } from './aliran/AliranView'

function StatusBar() {
  return (
    <div className="pointer-events-none flex items-end justify-between px-7 pb-2 pt-3 text-kanal-fg">
      <span className="font-mono text-[13px] font-medium">9:41</span>
      <span className="flex items-center gap-[7px]">
        <CellSignalFull size={15} weight="fill" />
        <WifiHigh size={15} weight="fill" />
        <BatteryMedium size={17} weight="fill" />
      </span>
    </div>
  )
}

export function StatistikTab() {
  return (
    <div className="flex min-h-screen w-full items-stretch justify-center bg-[#070708] md:items-center md:p-6">
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-kanal-bg md:h-[844px] md:w-[390px] md:rounded-phone md:border md:border-zinc-800">
        <StatusBar />

        <div className="flex min-h-0 flex-1 flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-[22px] pt-2">
            <h1 className="text-xl font-medium tracking-[-0.01em] text-kanal-fg">
              Statistik
            </h1>
            <PeriodSelector />
          </div>

          <ContextStrip />
          <SegmentControl />

          {/* Canvas area */}
          <div className="mx-4 mb-3.5 mt-3.5 flex min-h-0 flex-1">
            <AliranView />
          </div>
        </div>
      </div>
    </div>
  )
}
