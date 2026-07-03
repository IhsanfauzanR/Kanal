// Heatmap intensity → background fill (§7.1). Muted-red (the expense token)
// at stepped opacities. Deliberately tops out at 0.40 so no day is ever fully
// saturated — busy days read as "more", never as alarm (anti-slop, §2).

const EXP = (alpha: number) => `oklch(62% 0.12 25 / ${alpha})`

// intensity is dayExpense / maxDayExpense in the month, clamped 0..1.
export function intensityFill(intensity: number): string {
  if (intensity <= 0) return 'transparent'
  if (intensity > 0.8) return EXP(0.4)
  if (intensity > 0.6) return EXP(0.28)
  if (intensity > 0.4) return EXP(0.18)
  if (intensity > 0.2) return EXP(0.1)
  return EXP(0.04)
}

// Legend ramp, hening → sibuk: transparent first, then ascending fills (§7.4).
export const LEGEND_FILLS: readonly string[] = [
  'transparent',
  EXP(0.1),
  EXP(0.18),
  EXP(0.28),
  EXP(0.4),
]
