// Period summary strip (Stage 3B), from the real period data: income · expense
// · net. Computes totals straight from useTransactions — deliberately does NOT
// import the Aliran scene hook, which would pull three.js into the main bundle.

import { useMemo } from 'react'
import { useTransactions } from '../../data/useTransactions'
import { useStatistikStore } from './shared/store/useStatistikStore'
import { dots } from './shared/format'

export function ContextStrip() {
  const period = useStatistikStore((s) => s.period)
  const { transactions } = useTransactions(period)

  const { income, expense } = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.type === 'masuk') income += t.amount
      else if (t.type === 'keluar') expense += t.amount
    }
    return { income, expense }
  }, [transactions])

  const net = income - expense
  const netSign = net >= 0 ? '+' : '−'

  return (
    <div className="tnum mt-3 px-[22px] font-mono text-[11px] text-kanal-fg3">
      Pemasukan Rp {dots(income)} · Pengeluaran Rp {dots(expense)} · Selisih{' '}
      <span className={net >= 0 ? 'text-kanal-teal' : 'text-kanal-exp'}>
        {netSign}Rp {dots(net)}
      </span>
    </div>
  )
}
