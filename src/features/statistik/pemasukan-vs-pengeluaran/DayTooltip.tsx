// Custom chart tooltip (§5.4). Replaces the default Recharts tooltip entirely.
// Frosted container with an inner refraction border (liquid-glass). All numbers
// Geist Mono; labels Geist xs Zinc-500. Selisih/Net carry tone; nothing else.
// Fades in (handled via the Tooltip wrapper), no scale, no bounce.

import { signedRupiah, rupiah, tooltipDateLabel } from '../shared/format'
import type { DailyPoint } from './hooks/useDailySeries'

interface DayTooltipProps {
  active?: boolean
  payload?: Array<{ payload: DailyPoint }>
  mode: 'kumulatif' | 'harian'
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'accent' | 'expense'
}) {
  const valueClass =
    tone === 'accent'
      ? 'text-kanal-teal'
      : tone === 'expense'
        ? 'text-kanal-exp'
        : 'text-kanal-fg'
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="text-[11px] text-kanal-fg3">{label}</span>
      <span className={`tnum font-mono text-[13px] ${valueClass}`}>{value}</span>
    </div>
  )
}

export function DayTooltip({ active, payload, mode }: DayTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload

  return (
    <div
      className="min-w-[176px] rounded-md border border-kanal-line bg-kanal-glass px-3 py-2.5 backdrop-blur-md"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
    >
      <div className="mb-1.5 font-mono text-[10px] tracking-[0.12em] text-kanal-fg3">
        {tooltipDateLabel(p.date)}
      </div>
      <div className="flex flex-col gap-1">
        {mode === 'kumulatif' ? (
          <>
            <Row label="Pemasukan" value={rupiah(p.cumIncome)} />
            <Row label="Pengeluaran" value={rupiah(p.cumExpense)} />
            <Row
              label="Selisih"
              value={signedRupiah(p.cumIncome - p.cumExpense)}
              tone={p.cumIncome - p.cumExpense >= 0 ? 'accent' : 'expense'}
            />
          </>
        ) : (
          <>
            <Row label="Masuk hari ini" value={rupiah(p.income, '+')} />
            <Row label="Keluar hari ini" value={rupiah(p.expense, '−')} />
            <Row
              label="Net hari ini"
              value={signedRupiah(p.net)}
              tone={p.net >= 0 ? 'accent' : 'expense'}
            />
          </>
        )}
      </div>
    </div>
  )
}
