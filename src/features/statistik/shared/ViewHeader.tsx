// Shared period-aware header for the Stage 4 views (§4.3).
// Renders the factual stats line in Geist Mono xs. The period selector itself
// lives once in the tab top bar (store-backed, shared by every view), so it is
// not duplicated here — see PeriodSelector.
//
// Tone is the only signal on Selisih-style values: accent (teal) when positive,
// expense (red) when negative. No arrows, no ▲/▼ — the '+'/'−' prefix and color
// carry it (§4.3, anti-slop: no celebratory glyphs).

export type StatTone = 'default' | 'accent' | 'expense'

export interface ViewStat {
  label: string
  value: string
  tone?: StatTone
}

interface ViewHeaderProps {
  title: string // intentionally not rendered — the segment already names the view
  stats: ViewStat[]
}

const toneClass: Record<StatTone, string> = {
  default: 'text-kanal-fg',
  accent: 'text-kanal-teal',
  expense: 'text-kanal-exp',
}

export function ViewHeader({ stats }: ViewHeaderProps) {
  return (
    <div className="tnum flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-[22px] font-mono text-[11px] text-kanal-fg3">
      {stats.map((s, i) => (
        <span key={s.label} className="inline-flex items-baseline gap-1.5">
          {i > 0 && (
            <span className="text-kanal-fg4" aria-hidden="true">
              ·
            </span>
          )}
          <span>{s.label}</span>
          <span className={toneClass[s.tone ?? 'default']}>{s.value}</span>
        </span>
      ))}
    </div>
  )
}
