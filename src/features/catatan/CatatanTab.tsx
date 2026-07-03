// Catatan — the full transaction list (Stage Final, from the Kanal App mockup).
// Search + a collapsible filter panel (category / account / type / period),
// active-filter chips, and the list grouped by day with sticky headers and a
// per-day income/expense summary. Tapping a row opens the Catat sheet in edit
// mode. Quiet, factual empty states for "no match" and "nothing yet".

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Funnel, MagnifyingGlass, X } from '@phosphor-icons/react'
import { useTxStore } from '../../data/txStore'
import { useCatalogStore } from '../../data/catalogStore'
import { useUiStore } from '../../app/uiStore'
import { TransactionRow } from '../../components/TransactionRow'
import type { Transaction } from '../statistik/aliran/data/types'
import { DAYS_ID_LONG, dots, shortDate } from '../statistik/shared/format'

type TipeFilter = 'semua' | 'masuk' | 'keluar'
type PeriodeFilter = 'semua' | 'bulan'

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const chipClass = (active: boolean) =>
  `flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active
      ? 'border-kanal-teal-bd bg-kanal-teal-tint text-kanal-fg'
      : 'border-kanal-line bg-kanal-surf text-kanal-fg2'
  }`

function dayLabel(d: Date): string {
  const today = new Date()
  const yest = new Date()
  yest.setDate(today.getDate() - 1)
  if (dateKey(d) === dateKey(today)) return 'Hari ini'
  if (dateKey(d) === dateKey(yest)) return 'Kemarin'
  return `${DAYS_ID_LONG[d.getDay()]}, ${shortDate(d)}`
}

function CatatanSkeleton() {
  const widths = ['54%', '44%', '60%', '48%', '56%', '42%']
  return (
    <div className="px-[22px] pt-1.5">
      {widths.map((w, i) => (
        <div key={i} className="flex items-center gap-[13px] border-t border-kanal-line py-3.5 first:border-t-0">
          <div className="h-[34px] w-[34px] flex-none rounded-full bg-kanal-skeleton motion-safe:animate-pulse" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-2.5 rounded bg-kanal-skeleton motion-safe:animate-pulse" style={{ width: w }} />
            <div className="h-2 w-1/3 rounded bg-kanal-skeleton motion-safe:animate-pulse" />
          </div>
          <div className="h-3 w-16 flex-none rounded bg-kanal-skeleton motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function CatatanTab() {
  const transactions = useTxStore((s) => s.transactions)
  const ready = useTxStore((s) => s.ready)
  const accounts = useCatalogStore((s) => s.accounts)
  const categories = useCatalogStore((s) => s.categories)
  const openCatat = useUiStore((s) => s.openCatat)

  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [tipe, setTipe] = useState<TipeFilter>('semua')
  const [cats, setCats] = useState<string[]>([])
  const [akun, setAkun] = useState<string | null>(null)
  const [periode, setPeriode] = useState<PeriodeFilter>('semua')

  // "Bulan ini" = the real current month (device clock).
  const latestMonth = useMemo(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (tipe === 'masuk' && t.type !== 'masuk') return false
      if (tipe === 'keluar' && t.type !== 'keluar') return false
      if (cats.length && !(t.category && cats.includes(t.category))) return false
      if (akun && t.account !== akun && t.toAccount !== akun) return false
      if (periode === 'bulan' && latestMonth) {
        if (
          t.timestamp.getFullYear() !== latestMonth.y ||
          t.timestamp.getMonth() !== latestMonth.m
        )
          return false
      }
      if (q) {
        const hay = `${t.label} ${t.category ?? ''} ${t.note ?? ''} ${t.account}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [transactions, tipe, cats, akun, periode, search, latestMonth])

  const groups = useMemo(() => {
    const by = new Map<string, Transaction[]>()
    for (const t of filtered) {
      const k = dateKey(t.timestamp)
      const arr = by.get(k)
      if (arr) arr.push(t)
      else by.set(k, [t])
    }
    return [...by.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([, rows]) => {
        let masuk = 0
        let keluar = 0
        for (const t of rows) {
          if (t.type === 'masuk') masuk += t.amount
          else if (t.type === 'keluar') keluar += t.amount
        }
        return { date: rows[0].timestamp, rows, masuk, keluar }
      })
  }, [filtered])

  const hasFilter = tipe !== 'semua' || cats.length > 0 || !!akun || periode !== 'semua'
  const toggleCat = (name: string) =>
    setCats((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]))
  const resetFilters = () => {
    setTipe('semua')
    setCats([])
    setAkun(null)
    setPeriode('semua')
    setSearch('')
  }

  const activeChips: Array<{ label: string; onRemove: () => void }> = []
  if (tipe !== 'semua')
    activeChips.push({ label: tipe === 'masuk' ? 'Masuk' : 'Keluar', onRemove: () => setTipe('semua') })
  cats.forEach((c) => activeChips.push({ label: c, onRemove: () => toggleCat(c) }))
  if (akun) activeChips.push({ label: akun, onRemove: () => setAkun(null) })
  if (periode === 'bulan') activeChips.push({ label: 'Bulan ini', onRemove: () => setPeriode('semua') })

  const isEmpty = groups.length === 0
  const onRowClick = (tx: Transaction) => openCatat({ editId: tx.id })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-kanal-line px-[22px] pb-3.5 pt-2">
        <span className="text-xl font-medium tracking-[-0.01em] text-kanal-fg">Catatan</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v)
              setFilterOpen(false)
            }}
            aria-label="Cari"
            aria-pressed={searchOpen}
            className={`flex rounded-[9px] p-2 text-kanal-fg2 transition-transform active:scale-90 ${searchOpen ? 'bg-kanal-surf' : ''}`}
          >
            <MagnifyingGlass size={19} />
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterOpen((v) => !v)
              setSearchOpen(false)
            }}
            aria-label="Saring"
            aria-pressed={filterOpen}
            className={`flex rounded-[9px] p-2 text-kanal-fg2 transition-transform active:scale-90 ${filterOpen || hasFilter ? 'bg-kanal-surf' : ''}`}
          >
            <Funnel size={19} weight={hasFilter ? 'fill' : 'regular'} />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* search */}
        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 border-b border-kanal-line px-[18px] py-3">
                <MagnifyingGlass size={16} className="text-kanal-fg3" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kategori atau catatan…"
                  className="flex-1 bg-transparent text-[15px] text-kanal-fg outline-none placeholder:text-kanal-fg4"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} aria-label="Bersihkan" className="text-kanal-fg3">
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* filter panel */}
        <AnimatePresence initial={false}>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-[18px] border-b border-kanal-line px-5 pb-5 pt-[18px]">
                <div>
                  <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">Kategori</div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <button key={c.id} type="button" onClick={() => toggleCat(c.name)} className={chipClass(cats.includes(c.name))}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">Akun</div>
                  <div className="flex flex-wrap gap-1.5">
                    {accounts.filter((a) => !a.archived).map((a) => (
                      <button key={a.id} type="button" onClick={() => setAkun((v) => (v === a.name ? null : a.name))} className={chipClass(akun === a.name)}>
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">Tipe</div>
                    <div className="flex gap-1.5">
                      {(['masuk', 'keluar', 'semua'] as TipeFilter[]).map((t) => (
                        <button key={t} type="button" onClick={() => setTipe(t)} className={chipClass(tipe === t)}>
                          {t === 'masuk' ? 'Masuk' : t === 'keluar' ? 'Keluar' : 'Semua'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {latestMonth && (
                    <div>
                      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">Periode</div>
                      <div className="flex gap-1.5">
                        {(['semua', 'bulan'] as PeriodeFilter[]).map((p) => (
                          <button key={p} type="button" onClick={() => setPeriode(p)} className={chipClass(periode === p)}>
                            {p === 'semua' ? 'Semua' : 'Bulan ini'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button type="button" onClick={resetFilters} className="p-1 text-[13px] text-kanal-fg3">Reset</button>
                  <button type="button" onClick={() => setFilterOpen(false)} className="rounded-[10px] border border-kanal-teal-bd bg-kanal-teal-tint px-4 py-2 text-sm font-medium text-kanal-fg transition-transform active:scale-[0.98]">
                    Terapkan
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* active chips */}
        {activeChips.length > 0 && (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-kanal-line px-5 py-2.5">
            {activeChips.map((c, i) => (
              <span key={i} className="flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full bg-kanal-surf py-1 pl-3 pr-1.5 text-[13px] text-kanal-teal">
                {c.label}
                <button type="button" onClick={c.onRemove} aria-label={`Hapus ${c.label}`} className="flex p-0.5 text-kanal-fg3">
                  <X size={13} />
                </button>
              </span>
            ))}
            <button type="button" onClick={resetFilters} className="ml-auto flex-none whitespace-nowrap p-1 text-[13px] text-kanal-fg3">
              Hapus semua
            </button>
          </div>
        )}

        {/* list / states */}
        {!ready ? (
          <CatatanSkeleton />
        ) : isEmpty ? (
          <div className="px-8 py-16">
            <p className="text-base leading-relaxed text-kanal-fg2">
              {search
                ? `Tidak ada catatan cocok dengan "${search}".`
                : hasFilter
                  ? 'Tidak ada catatan di filter ini.'
                  : 'Catatan akan muncul di sini setelah kamu mencatat transaksi pertama.'}
            </p>
            <div className="mt-3.5">
              {search ? (
                <button type="button" onClick={() => setSearch('')} className="rounded-[10px] border border-kanal-line px-4 py-2 text-sm font-medium text-kanal-fg2 transition-transform active:scale-[0.98]">
                  Bersihkan pencarian
                </button>
              ) : hasFilter ? (
                <button type="button" onClick={resetFilters} className="rounded-[10px] border border-kanal-line px-4 py-2 text-sm font-medium text-kanal-fg2 transition-transform active:scale-[0.98]">
                  Hapus semua filter
                </button>
              ) : (
                <button type="button" onClick={() => openCatat()} className="rounded-xl bg-kanal-teal px-5 py-2.5 text-sm font-medium text-kanal-teal-on transition-transform active:scale-[0.98]">
                  Catat transaksi
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="pb-6">
            {groups.map((g) => (
              <div key={dateKey(g.date)}>
                <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-kanal-line bg-kanal-glass px-[22px] py-3 backdrop-blur-md">
                  <span className="text-[0.9375rem] font-medium text-kanal-fg">{dayLabel(g.date)}</span>
                  <span className="tnum font-mono text-xs text-kanal-fg3">
                    {g.masuk > 0 && <span className="text-kanal-teal">+Rp {dots(g.masuk)}</span>}
                    {g.masuk > 0 && g.keluar > 0 && <span className="px-1.5">·</span>}
                    {g.keluar > 0 && <span className="text-kanal-exp">−Rp {dots(g.keluar)}</span>}
                  </span>
                </div>
                <div className="px-[22px]">
                  {g.rows.map((t) => (
                    <TransactionRow key={t.id} tx={t} onClick={onRowClick} withTime />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
