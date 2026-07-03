// Runway view (§6). Liquid assets ÷ average spend = months of runway, presented
// as plain math. The hero shows the current reality; the timeline + scenario
// slider explore "what if I cut Rp X/month" without ever framing it as a goal.

import { useMemo, useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import { useStatistikStore } from '../shared/store/useStatistikStore'
import { rupiah, rupiahCents } from '../shared/format'
import { ViewHeader, type ViewStat } from '../shared/ViewHeader'
import { SectionDivider } from '../shared/SectionDivider'
import { EmptyState } from '../shared/EmptyState'
import { assetTotal, type AssetBucket } from './assets'
import { AssetSelector } from './AssetSelector'
import { KelolaSheet } from './KelolaSheet'
import { RunwayHero } from './RunwayHero'
import { RunwayTimeline } from './RunwayTimeline'
import { SensitivitySlider } from './SensitivitySlider'
import { useLiveAccounts } from '../../../data/useLiveAccounts'
import { useRunwayCalculation } from './hooks/useRunwayCalculation'

export function RunwayView() {
  const period = useStatistikStore((s) => s.period)
  // Live balances (anchor + transaction deltas) so runway follows reality.
  const accounts = useLiveAccounts()
  const [bucket, setBucket] = useState<AssetBucket>('tunai-bank')
  const [editorOpen, setEditorOpen] = useState(false)
  // Exploratory only — local state, so leaving the view resets it (§6.2).
  const [reduction, setReduction] = useState(0)

  const liquid = useMemo(() => assetTotal(bucket, accounts), [bucket, accounts])
  const baseResult = useRunwayCalculation(liquid, 0, period)
  const scenarioResult = useRunwayCalculation(liquid, reduction, period)

  const headerStats: ViewStat[] = [
    {
      label: 'Rata-rata pengeluaran/bulan',
      value: rupiah(Math.round(baseResult.avgMonthlySpend)),
    },
    { label: 'Kas likuid total', value: rupiahCents(liquid) },
  ]

  if (!baseResult.hasHistory) {
    return (
      <div className="relative flex flex-1 items-center justify-center rounded-2xl border border-kanal-line bg-kanal-bg">
        <EmptyState
          message="Belum cukup data untuk menghitung runway. Catatan minimal 1 bulan diperlukan."
          actionLabel="Catat transaksi"
        />
      </div>
    )
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-kanal-line bg-kanal-bg">
      <div className="no-scrollbar flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto py-4">
        <ViewHeader title="Runway" stats={headerStats} />
        <div className="flex min-w-0 items-center justify-between gap-2 px-[22px]">
          <AssetSelector value={bucket} onChange={setBucket} />
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            aria-label="Kelola akun & kategori"
            className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] border border-kanal-line bg-kanal-surf text-kanal-fg2 transition-transform active:scale-[0.95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
          >
            <PencilSimple size={15} />
          </button>
        </div>
        <SectionDivider className="mx-[22px]" />
        <RunwayHero result={baseResult} />
        <SectionDivider className="mx-[22px]" />
        <RunwayTimeline
          result={scenarioResult}
          baseRunwayDays={baseResult.runwayDays}
          className="px-[22px] pt-1"
        />
        <SensitivitySlider
          value={reduction}
          onChange={setReduction}
          scenarioResult={scenarioResult}
          className="px-[22px] pb-2 pt-2"
        />
      </div>

      <KelolaSheet open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  )
}
