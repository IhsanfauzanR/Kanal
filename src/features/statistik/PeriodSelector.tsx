// Period selector (Stage 3B). Static "Jun 2026" trigger for Stage 3C — the
// full period picker is shell-level and not part of the 3C 3D-scene scope.

import { CaretDown } from '@phosphor-icons/react'

export function PeriodSelector({ label = 'Jun 2026' }: { label?: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-[9px] border border-kanal-line bg-kanal-surf px-[11px] py-1.5 font-mono text-[13px] text-kanal-fg2 transition-transform active:scale-[0.97]"
    >
      {label}
      <CaretDown size={13} weight="regular" />
    </button>
  )
}
