// Tinjauan (§4.4) — weekly review. ISO week (Monday-start) nav, this-week
// income/expense/selisih, and the most-recorded categories + accounts. Default
// is always the real current week. If the reviewed week has no records, a
// factual empty state. (Refleksi section removed at user request.)

import { useMemo, useState, type ReactNode } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useTxStore } from '../../../data/txStore'
import { MONTHS_ID, dots, rupiah, signedRupiah } from '../shared/format'
import type { Transaction } from '../aliran/data/types'

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000))
}

function weekStartOf(date: Date): Date {
  const s = new Date(date)
  const dow = (s.getDay() + 6) % 7
  s.setDate(s.getDate() - dow)
  s.setHours(0, 0, 0, 0)
  return s
}

function rangeLabel(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth()
  if (sameMonth) return `${start.getDate()}–${end.getDate()} ${MONTHS_ID[end.getMonth()]}`
  return `${start.getDate()} ${MONTHS_ID[start.getMonth()]}–${end.getDate()} ${MONTHS_ID[end.getMonth()]}`
}

function topBy(txns: Transaction[], keyOf: (t: Transaction) => string | undefined, limit: number) {
  const map = new Map<string, { count: number; total: number }>()
  for (const t of txns) {
    const k = keyOf(t)
    if (!k) continue
    const e = map.get(k) ?? { count: 0, total: 0 }
    e.count += 1
    e.total += t.amount
    map.set(k, e)
  }
  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].total - a[1].total)
    .slice(0, limit)
    .map(([name, v]) => ({ name, count: v.count, total: v.total }))
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-kanal-fg3">{title}</div>
      {children}
    </>
  )
}

export function TinjauanView() {
  const transactions = useTxStore((s) => s.transactions)

  // Default is always the real current week (device clock).
  const [start, setStart] = useState<Date>(() => weekStartOf(new Date()))
  const end = useMemo(() => {
    const e = new Date(start)
    e.setDate(e.getDate() + 6)
    e.setHours(23, 59, 59, 999)
    return e
  }, [start])

  const step = (delta: number) => {
    const s = new Date(start)
    s.setDate(s.getDate() + delta * 7)
    setStart(s)
  }

  const data = useMemo(() => {
    const startMs = start.getTime()
    const endMs = end.getTime()
    const wk = transactions.filter((t) => {
      const ms = t.timestamp.getTime()
      return ms >= startMs && ms <= endMs
    })
    let income = 0
    let expense = 0
    for (const t of wk) {
      if (t.type === 'masuk') income += t.amount
      else if (t.type === 'keluar') expense += t.amount
    }
    const topCats = topBy(wk.filter((t) => t.type === 'keluar'), (t) => t.category, 3)
    const topAccts = topBy(wk, (t) => t.account, 2)
    return { wk, income, expense, selisih: income - expense, topCats, topAccts }
  }, [transactions, start, end])

  const week = isoWeek(start)
  const empty = data.wk.length === 0

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-kanal-line bg-kanal-bg">
      {/* top row */}
      <div className="flex items-center justify-between border-b border-kanal-line px-[22px] py-3.5">
        <span className="text-lg font-medium tracking-[-0.01em] text-kanal-fg">Tinjauan Pekan Ini</span>
        <div className="flex items-center gap-1.5 font-mono">
          <button type="button" onClick={() => step(-1)} aria-label="Pekan sebelumnya" className="flex p-1 text-kanal-fg3 transition-transform active:scale-90">
            <CaretLeft size={14} />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Pekan berikutnya" className="flex p-1 text-kanal-fg3 transition-transform active:scale-90">
            <CaretRight size={14} />
          </button>
        </div>
      </div>
      <div className="px-[22px] pt-2.5 font-mono text-[11px] text-kanal-fg3">
        Minggu {week} · {rangeLabel(start, end)}
      </div>

      {empty ? (
        <div className="flex flex-1 items-center justify-center px-8">
          <p className="text-center text-[0.9375rem] text-kanal-fg2">
            Belum cukup catatan untuk pekan ini.
          </p>
        </div>
      ) : (
        <div className="no-scrollbar flex-1 overflow-y-auto px-[22px] pb-7 pt-2">
          {/* minggu ini */}
          <div className="mt-3.5">
            <Section title="Minggu ini">
              <div className="mt-3.5 flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.9375rem] text-kanal-fg2">Pemasukan</span>
                  <span className="tnum font-mono text-[1.0625rem] text-kanal-teal">{rupiah(data.income)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.9375rem] text-kanal-fg2">Pengeluaran</span>
                  <span className="tnum font-mono text-[1.0625rem] text-kanal-exp">{rupiah(data.expense)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[0.9375rem] text-kanal-fg2">Selisih</span>
                  <span
                    className={`tnum font-mono text-[1.0625rem] ${data.selisih >= 0 ? 'text-kanal-teal' : 'text-kanal-exp'}`}
                  >
                    {signedRupiah(data.selisih)}
                  </span>
                </div>
              </div>
              <div className="mt-3.5 font-mono text-[11px] text-kanal-fg3">
                {data.wk.length} transaksi dalam 7 hari.
              </div>
            </Section>
          </div>

          <div className="my-6 h-px bg-kanal-line" />

          <Section title="Paling sering tercatat">
            {data.topCats.length === 0 ? (
              <p className="mt-3 text-sm text-kanal-fg3">Belum ada pengeluaran pekan ini.</p>
            ) : (
              data.topCats.map((r) => (
                <div key={r.name} className="mt-2 flex items-baseline justify-between gap-3 border-t border-kanal-line pt-3">
                  <span className="text-[0.9375rem] font-medium text-kanal-fg">{r.name}</span>
                  <span className="tnum whitespace-nowrap font-mono text-[0.8125rem] text-kanal-fg3">
                    {r.count} kejadian · Rp {dots(r.total)}
                  </span>
                </div>
              ))
            )}
          </Section>

          <div className="my-6 h-px bg-kanal-line" />

          <Section title="Akun yang paling sering dipakai">
            {data.topAccts.map((r) => (
              <div key={r.name} className="mt-2 flex items-baseline justify-between gap-3 border-t border-kanal-line pt-3">
                <span className="text-[0.9375rem] font-medium text-kanal-fg">{r.name}</span>
                <span className="tnum whitespace-nowrap font-mono text-[0.8125rem] text-kanal-fg3">
                  {r.count} kejadian · Rp {dots(r.total)}
                </span>
              </div>
            ))}
          </Section>

        </div>
      )}
    </div>
  )
}
