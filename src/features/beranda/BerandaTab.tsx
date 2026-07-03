// Beranda — the today view (Stage Final, from the Kanal App mockup). Month nav
// + settings gear, a day-level hero (net of the focused day), a factual month
// context strip, and the day's transactions. Because the seeded dataset ends in
// the past, the focus day defaults to the most recent activity rather than a
// literal (empty) "today" — so the app never opens blank.

import { useMemo, useState } from 'react'
import { CaretLeft, CaretRight, GearSix, Plus } from '@phosphor-icons/react'
import { useTxStore } from '../../data/txStore'
import { useUiStore } from '../../app/uiStore'
import { TransactionRow } from '../../components/TransactionRow'
import { PwaInstallBanner } from '../pwa/PwaInstallBanner'
import type { Transaction } from '../statistik/aliran/data/types'
import { DAYS_ID_LONG, dots, monthLabel, shortDate } from '../statistik/shared/format'

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export function BerandaTab() {
  const transactions = useTxStore((s) => s.transactions)
  const openCatat = useUiStore((s) => s.openCatat)
  const openSettings = useUiStore((s) => s.openSettings)

  // The app always opens on the real today — the device clock is the default
  // everywhere; history is reached by navigating back.
  const [viewDate, setViewDate] = useState<Date>(() => new Date())

  const stepMonth = (delta: number) => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    const target = new Date(y, m + delta, 1)
    const today = new Date()
    if (sameMonth(target, today)) {
      // Stepping back into the current month always lands on today.
      setViewDate(today)
      return
    }
    // Land on the latest day in the target month that has activity, else day 1.
    const inMonth = transactions.filter((t) => sameMonth(t.timestamp, target))
    setViewDate(inMonth.length ? new Date(inMonth[0].timestamp) : target)
  }

  const dayTx = useMemo(
    () => transactions.filter((t) => sameDay(t.timestamp, viewDate)),
    [transactions, viewDate],
  )

  const { masukDay, keluarDay, monthExpense, avgDaily } = useMemo(() => {
    let masuk = 0
    let keluar = 0
    for (const t of dayTx) {
      if (t.type === 'masuk') masuk += t.amount
      else if (t.type === 'keluar') keluar += t.amount
    }
    const monthTx = transactions.filter((t) => sameMonth(t.timestamp, viewDate))
    const expenseByDay = new Map<number, number>()
    for (const t of monthTx) {
      if (t.type !== 'keluar') continue
      const d = t.timestamp.getDate()
      expenseByDay.set(d, (expenseByDay.get(d) ?? 0) + t.amount)
    }
    const monthExp = [...expenseByDay.values()].reduce((a, b) => a + b, 0)
    const avg = expenseByDay.size ? Math.round(monthExp / expenseByDay.size) : 0
    return { masukDay: masuk, keluarDay: keluar, monthExpense: monthExp, avgDaily: avg }
  }, [dayTx, transactions, viewDate])

  const net = masukDay - keluarDay
  const isToday = sameDay(viewDate, new Date())
  const isCurrentMonth = sameMonth(viewDate, new Date())
  const netSign = net < 0 ? '−' : net > 0 ? '+' : ''
  const onRowClick = (tx: Transaction) => openCatat({ editId: tx.id })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* top bar: month nav + settings */}
      <div className="flex items-center justify-between border-b border-kanal-line px-[22px] pb-3.5 pt-2">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => stepMonth(-1)}
            aria-label="Bulan sebelumnya"
            className="flex p-1 text-kanal-fg3 transition-transform active:scale-90"
          >
            <CaretLeft size={16} />
          </button>
          <span className="text-sm text-kanal-fg">
            {monthLabel(viewDate.getFullYear(), viewDate.getMonth())}
          </span>
          <button
            type="button"
            onClick={() => stepMonth(1)}
            aria-label="Bulan berikutnya"
            className="flex p-1 text-kanal-fg3 transition-transform active:scale-90"
          >
            <CaretRight size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={openSettings}
          aria-label="Pengaturan"
          className="flex p-1 text-kanal-fg2 transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
        >
          <GearSix size={21} />
        </button>
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* hero */}
        <div className="px-[22px] pt-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-kanal-fg3">
            {isToday ? 'Saldo hari ini' : `Arus · ${shortDate(viewDate)}`}
          </div>
          <div className="tnum mt-3.5 flex items-baseline gap-2.5">
            <span className="font-mono text-[1.05rem] text-kanal-fg2">{netSign}Rp</span>
            <span className="font-mono text-[3rem] font-normal leading-none tracking-[-0.03em] text-kanal-fg">
              {dots(Math.abs(net))}
            </span>
          </div>
          <div className="mt-[18px] flex gap-7">
            <div className="flex flex-col gap-[3px]">
              <span className="text-xs text-kanal-fg3">Masuk</span>
              <span className="tnum font-mono text-sm font-medium text-kanal-teal">
                +Rp {dots(masukDay)}
              </span>
            </div>
            <div className="flex flex-col gap-[3px]">
              <span className="text-xs text-kanal-fg3">Keluar</span>
              <span className="tnum font-mono text-sm font-medium text-kanal-exp">
                −Rp {dots(keluarDay)}
              </span>
            </div>
          </div>
        </div>

        {/* context strip */}
        <div className="mx-[22px] mt-[26px] border-y border-kanal-line py-[11px] font-mono text-[11px] text-kanal-fg3">
          {isCurrentMonth ? 'Bulan ini' : monthLabel(viewDate.getFullYear(), viewDate.getMonth())}{' '}
          · Rp {dots(monthExpense)} · rata-rata harian Rp {dots(avgDaily)}
        </div>

        {/* section header */}
        <div className="px-[22px] pb-2 pt-[22px]">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-kanal-fg3">
            {isToday ? 'Hari ini' : `${DAYS_ID_LONG[viewDate.getDay()]}, ${shortDate(viewDate)}`} ·{' '}
            {dayTx.length} catatan
          </span>
        </div>

        {/* list */}
        <div className="px-[22px]">
          {dayTx.length > 0 ? (
            dayTx.map((t) => <TransactionRow key={t.id} tx={t} onClick={onRowClick} />)
          ) : (
            <p className="py-6 text-sm text-kanal-fg3">Tidak ada catatan di hari ini.</p>
          )}
        </div>

        {/* quick add */}
        <div className="px-[22px] pb-4 pt-[22px]">
          <button
            type="button"
            onClick={() => openCatat(isToday ? {} : { date: viewDate })}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-kanal-teal text-[15px] font-medium text-kanal-teal-on transition-transform active:scale-[0.98]"
          >
            <Plus size={17} />
            Catat transaksi
          </button>
        </div>

        <PwaInstallBanner />
      </div>
    </div>
  )
}
