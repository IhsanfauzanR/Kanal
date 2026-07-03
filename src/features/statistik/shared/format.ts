// Shared formatting for Stage 4 Statistik views.
// Indonesian Rupiah uses '.' as the thousands separator; decimals use ','.
// Numerics are always rendered in Geist Mono with tabular alignment (Stage 1).
// Anti-slop: organic amounts, never fake round numbers; copy stays factual.

export const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const

export const MONTHS_ID_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const

// Indexed by Date.getDay(): 0 = Minggu (Sunday) … 6 = Sabtu (Saturday).
export const DAYS_ID_LONG = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
] as const

// Monday-first column headers for the calendar grid.
export const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const

// Indexed by Date.getDay() — short weekday for chart tooltips.
export const DAYS_ID_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const

// 1.234.567 grouping for the integer part of an absolute amount.
export function dots(n: number): string {
  return String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// "Rp 3.184.073" — optional explicit sign prefix ('+' or '−', the real minus).
export function rupiah(n: number, sign?: '+' | '−'): string {
  return `${sign ?? ''}Rp ${dots(n)}`
}

// Signed by value: positive gets '+', negative gets '−' (U+2212, not a hyphen).
export function signedRupiah(n: number): string {
  return rupiah(n, n < 0 ? '−' : '+')
}

// Compact amount: "Rp 47k", "Rp 245k", "Rp 1,2jt", "Rp 2jt". Pass
// withPrefix=false for the bare form ("47k") where space is tight and the
// rupiah context is already implied (e.g. heatmap cells).
export function abbreviateRupiah(n: number, withPrefix = true): string {
  const a = Math.abs(Math.round(n))
  const prefix = withPrefix ? 'Rp ' : ''
  if (a >= 1_000_000) {
    const jt = Math.round((a / 1_000_000) * 10) / 10
    return `${prefix}${String(jt).replace('.', ',')}jt`
  }
  if (a >= 1_000) return `${prefix}${Math.round(a / 1_000)}k`
  return `${prefix}${a}`
}

// "Rp 1.052.913,71" — shows 2-decimal cents only when present (asset balances
// from bank screenshots carry cents; whole amounts stay clean).
export function rupiahCents(n: number): string {
  const abs = Math.abs(n)
  const intPart = Math.floor(abs)
  const cents = Math.round((abs - intPart) * 100)
  const base = 'Rp ' + dots(intPart)
  return cents > 0 ? `${base},${String(cents).padStart(2, '0')}` : base
}

// "14 Jun"
export function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`
}

// "6 Juli 2026" — full date for the runway depletion line.
export function longDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_ID_LONG[d.getMonth()]} ${d.getFullYear()}`
}

// "26 JUN 2026 · JUMAT" — sheet header line.
export function dayHeaderLabel(d: Date): string {
  const date = `${d.getDate()} ${MONTHS_ID[d.getMonth()].toUpperCase()} ${d.getFullYear()}`
  return `${date} · ${DAYS_ID_LONG[d.getDay()].toUpperCase()}`
}

// "Jun 2026"
export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTHS_ID[monthIndex]} ${year}`
}

// "14 JUN · Sab" — chart tooltip header.
export function tooltipDateLabel(d: Date): string {
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()].toUpperCase()} · ${DAYS_ID_SHORT[d.getDay()]}`
}
