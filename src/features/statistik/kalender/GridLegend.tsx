// Intensity scale legend (§7.4). Five swatches from transparent (hening) to the
// deepest fill (sibuk). Factual labels, no numbers — the scale is relative.

import { LEGEND_FILLS } from './intensity'

export function GridLegend({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-end gap-2.5 font-mono text-[10px] text-kanal-fg3 ${className ?? ''}`}
    >
      <span>Lebih hening</span>
      <div className="flex gap-[3px]">
        {LEGEND_FILLS.map((fill, i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-[3px] border border-kanal-line"
            style={{ backgroundColor: fill }}
          />
        ))}
      </div>
      <span>Lebih sibuk</span>
    </div>
  )
}
