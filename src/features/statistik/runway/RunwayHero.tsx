// Runway hero (§6.2). The number is shown plainly — same neutral presentation
// whether it's 10 days or 10 years. No emoji, no warning icon, no urgency color.
// Discipline matters most here (§6.1): Kanal presents math; the user interprets.

import { longDate } from '../shared/format'
import type { RunwayResult } from './hooks/useRunwayCalculation'

function formatMonths(m: number): string {
  const decimals = m < 10 ? 2 : 1
  return m.toFixed(decimals).replace('.', ',')
}

export function RunwayHero({ result }: { result: RunwayResult }) {
  const { isDeficit, isInfinite, runwayMonths, runwayDays, depletionDate, monthsUsed } = result

  const bigNumber = isInfinite
    ? '>10 tahun'
    : isDeficit
      ? '0,0'
      : formatMonths(runwayMonths)

  const subLine = isInfinite
    ? 'Pada laju saat ini, kas likuid mencukupi jangka panjang.'
    : isDeficit
      ? 'Pengeluaran melebihi aset likuid. Pertimbangkan tinjau ulang.'
      : depletionDate
        ? `≈ ${Math.round(runwayDays)} hari · habis sekitar ${longDate(depletionDate)}`
        : ''

  return (
    <div className="flex flex-col items-center px-6 py-7 text-center">
      <div className="font-mono text-[10px] tracking-[0.16em] text-kanal-fg3">
        {isInfinite ? 'RUNWAY' : 'RUNWAY · KAS HABIS PADA'}
      </div>

      <div className="mt-4 flex items-baseline gap-2 font-mono font-normal tabular-nums tracking-[-0.02em] text-kanal-fg">
        <span className={isInfinite ? 'text-4xl' : 'text-7xl'}>{bigNumber}</span>
        {!isInfinite && <span className="text-2xl text-kanal-fg2">bulan</span>}
      </div>

      <div className="mt-3 max-w-[32ch] text-[15px] leading-relaxed text-kanal-fg2">
        {subLine}
      </div>

      <div className="mt-3 font-mono text-[11px] text-kanal-fg3">
        Asumsi: laju pengeluaran rata-rata {monthsUsed} bulan terakhir.
      </div>
    </div>
  )
}
