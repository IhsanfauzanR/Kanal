// Shared formatting for the Aliran shell. Indonesian Rupiah uses '.' as the
// thousands separator (anti-slop: organic amounts, never fake round numbers).
// (The old mock-span scrubber pill helpers are gone — the scrubber now derives
// its labels from the active period + real data.)

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
