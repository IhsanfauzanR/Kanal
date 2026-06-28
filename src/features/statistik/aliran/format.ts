// Shared formatting for the Aliran shell. Indonesian Rupiah uses '.' as the
// thousands separator (anti-slop: organic amounts, never fake round numbers).

import { CANONICAL_TOTAL_EXPENSE } from './data/mockTransactions'

export function dots(n: number): string {
  return String(Math.abs(Math.round(n))).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.',
  )
}

export function rupiah(n: number, sign?: '+' | '-'): string {
  const s = sign ? sign + 'Rp ' : 'Rp '
  return s + dots(n)
}

// Map scrubber progress 0..1 → a date label across 25 Mei – 26 Jun 2026.
// Matches the Stage 3B reference (32-day span).
export function dateAtProgress(pos: number): string {
  const day = 25 + Math.round(pos * 32)
  return day <= 31 ? `${day} Mei` : `${day - 31} Jun`
}

// Pill label above the scrubber thumb: running date + cumulative spend.
export function scrubberPill(pos: number): string {
  return `${dateAtProgress(pos)} · Rp ${dots(pos * CANONICAL_TOTAL_EXPENSE)}`
}
