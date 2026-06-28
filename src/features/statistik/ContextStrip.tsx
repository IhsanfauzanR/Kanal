// Period summary strip (Stage 3B): income · expense · net difference.
// Factual copy only (3A rule 7 — no metaphor). Net is teal when positive.

import {
  CANONICAL_TOTAL_EXPENSE,
  CANONICAL_TOTAL_INCOME,
} from './aliran/data/mockTransactions'
import { dots } from './aliran/format'

export function ContextStrip() {
  const net = CANONICAL_TOTAL_INCOME - CANONICAL_TOTAL_EXPENSE
  const netSign = net >= 0 ? '+' : '−'

  return (
    <div className="tnum mt-3 px-[22px] font-mono text-[11px] text-kanal-fg3">
      Pemasukan Rp {dots(CANONICAL_TOTAL_INCOME)} · Pengeluaran Rp{' '}
      {dots(CANONICAL_TOTAL_EXPENSE)} · Selisih{' '}
      <span className="text-kanal-teal">
        {netSign}Rp {dots(net)}
      </span>
    </div>
  )
}
