// Catat Transaksi — the quick-entry sheet (Stage Final, from the Kanal App
// mockup). Type segment (Keluar / Masuk / Pindah), a native numeric amount
// field (the device number pad opens only when the field is tapped — no
// always-on custom keypad), category + account chips (or from/to for a
// transfer), an optional note, and date + jam. Both default to the moment of
// writing; the user only touches them to backdate a forgotten entry. Add +
// edit share this one sheet; edit adds a quiet delete link. Persists through
// txStore → Dexie.

import { useEffect, useMemo, useState } from 'react'
import { CalendarBlank, Clock, Plus } from '@phosphor-icons/react'
import { BottomSheet } from '../../components/BottomSheet'
import { useUiStore } from '../../app/uiStore'
import { useCatalogStore } from '../../data/catalogStore'
import { useTxStore } from '../../data/txStore'
import type { TxType } from '../statistik/aliran/data/types'
import { dots, shortDate } from '../statistik/shared/format'

const TYPES: Array<{ key: TxType; label: string }> = [
  { key: 'keluar', label: 'Keluar' },
  { key: 'masuk', label: 'Masuk' },
  { key: 'pindah', label: 'Pindah' },
]

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dateInputValue(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function timeInputValue(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

const chipClass = (active: boolean) =>
  `flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active
      ? 'border-kanal-teal-bd bg-kanal-teal-tint text-kanal-fg'
      : 'border-kanal-line bg-kanal-surf text-kanal-fg2'
  }`

export function CatatSheet() {
  const open = useUiStore((s) => s.catatOpen)
  const intent = useUiStore((s) => s.catatIntent)
  const close = useUiStore((s) => s.closeCatat)

  const accounts = useCatalogStore((s) => s.accounts)
  const categories = useCatalogStore((s) => s.categories)
  const addTx = useTxStore((s) => s.addTx)
  const updateTx = useTxStore((s) => s.updateTx)
  const deleteTx = useTxStore((s) => s.deleteTx)
  const transactions = useTxStore((s) => s.transactions)

  const liveAccounts = useMemo(
    () => accounts.filter((a) => !a.archived).map((a) => a.name),
    [accounts],
  )
  const editing = intent.editId ? transactions.find((t) => t.id === intent.editId) : undefined

  const [type, setType] = useState<TxType>('keluar')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [account, setAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [note, setNote] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [showAllCats, setShowAllCats] = useState(false)
  const [error, setError] = useState(false)

  const catsForType = useMemo(
    () => categories.filter((c) => (type === 'masuk' ? c.kind === 'masuk' : c.kind === 'keluar')),
    [categories, type],
  )

  const firstCatFor = (ty: TxType) =>
    categories.filter((c) => (ty === 'masuk' ? c.kind === 'masuk' : c.kind === 'keluar'))[0]?.name ??
    ''

  // Seed fields whenever the sheet opens (add vs edit).
  useEffect(() => {
    if (!open) return
    setError(false)
    setShowAllCats(false)
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setCategory(editing.category ?? firstCatFor(editing.type))
      setAccount(editing.account)
      setToAccount(editing.toAccount ?? '')
      setNote(editing.note ?? '')
      setNoteOpen(!!editing.note)
      setDate(new Date(editing.timestamp))
    } else {
      setType('keluar')
      setAmount('')
      setCategory(firstCatFor('keluar'))
      setAccount(liveAccounts[0] ?? '')
      setToAccount(liveAccounts[1] ?? liveAccounts[0] ?? '')
      setNote('')
      setNoteOpen(false)
      setDate(intent.date ? new Date(intent.date) : new Date())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, intent.editId])

  // Keep the selected category valid for the current type.
  useEffect(() => {
    if (type === 'pindah') return
    if (!catsForType.some((c) => c.name === category)) {
      setCategory(catsForType[0]?.name ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, catsForType])

  const amountNum = parseInt(amount || '0', 10)
  const shownCats = showAllCats ? catsForType : catsForType.slice(0, 6)

  const valid =
    amountNum > 0 &&
    (type === 'pindah'
      ? !!account && !!toAccount && account !== toAccount
      : !!account && !!category)

  const submit = async () => {
    if (!valid) {
      setError(true)
      return
    }
    const base = {
      type,
      amount: amountNum,
      timestamp: date,
      note: note.trim() || undefined,
    }
    if (type === 'pindah') {
      const payload = {
        ...base,
        account,
        toAccount,
        category: undefined,
        label: `${account} → ${toAccount}`,
      }
      if (editing) await updateTx(editing.id, payload)
      else await addTx(payload)
    } else {
      const payload = {
        ...base,
        account,
        category,
        label: note.trim() || category,
      }
      if (editing) await updateTx(editing.id, payload)
      else await addTx(payload)
    }
    close()
  }

  const remove = async () => {
    if (editing) await deleteTx(editing.id)
    close()
  }

  const isToday = sameDay(date, new Date())

  const footer = (
    <div className="border-t border-kanal-line bg-kanal-bg px-[18px] pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        onClick={submit}
        disabled={!valid}
        className={`h-[50px] w-full rounded-[13px] text-[15px] font-medium transition-transform active:scale-[0.98] ${
          valid
            ? 'bg-kanal-teal text-kanal-teal-on'
            : 'cursor-default bg-kanal-surf text-kanal-fg3'
        }`}
      >
        {editing ? 'Simpan perubahan' : 'Simpan'}
      </button>
    </div>
  )

  return (
    <BottomSheet
      open={open}
      onClose={close}
      ariaLabel={editing ? 'Ubah transaksi' : 'Catat transaksi'}
      maxHeight="90%"
      showClose={false}
      footer={footer}
    >
      <div className="flex items-center justify-between px-[22px] pb-3 pt-1">
        <span className="text-[17px] font-medium text-kanal-fg">
          {editing ? 'Ubah transaksi' : 'Catat transaksi'}
        </span>
        {editing && (
          <button
            type="button"
            onClick={remove}
            className="p-1 text-[13px] text-kanal-fg3 transition-transform active:scale-95 hover:text-kanal-exp"
          >
            Hapus
          </button>
        )}
      </div>

      {/* type segment */}
      <div className="px-[22px]">
        <div className="flex gap-1.5 rounded-xl border border-kanal-line bg-kanal-bg p-1">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              aria-pressed={type === t.key}
              className={`flex-1 rounded-[9px] py-2 text-center text-sm font-medium transition-colors ${
                type === t.key ? 'bg-kanal-surf2 text-kanal-fg' : 'text-kanal-fg3'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* amount — native numeric keypad opens only when the field is tapped */}
      <div className="px-[22px] pt-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">
          Jumlah
        </div>
        <div className="tnum mt-2 flex items-baseline gap-2">
          <span className="font-mono text-[1.1rem] text-kanal-fg3">Rp</span>
          <input
            value={amount ? dots(Number(amount)) : ''}
            onChange={(e) => {
              setError(false)
              setAmount(
                e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 12),
              )
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="0"
            aria-label="Jumlah transaksi"
            className={`min-w-0 flex-1 bg-transparent font-mono text-[2.5rem] font-normal leading-none tracking-[-0.03em] caret-kanal-teal outline-none placeholder:text-kanal-fg4 ${
              error ? 'text-kanal-exp' : 'text-kanal-fg'
            }`}
            style={error ? { animation: 'kanalShake .22s' } : undefined}
          />
        </div>
        {error && (
          <div className="mt-1.5 text-[13px] text-kanal-exp">
            Lengkapi jumlah dan pilihan dulu.
          </div>
        )}
      </div>

      {/* category / transfer */}
      {type !== 'pindah' ? (
        <div className="pt-3.5">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-[22px]">
            {shownCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.name)}
                className={chipClass(category === c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>
          {catsForType.length > 6 && (
            <div className="px-[22px] pt-3">
              <button
                type="button"
                onClick={() => setShowAllCats((v) => !v)}
                className="p-0.5 text-[13px] text-kanal-fg2"
              >
                {showAllCats ? 'Ringkas kategori' : 'Lihat semua kategori'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 px-[22px] pt-3.5">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">
              Dari akun
            </div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {liveAccounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccount(a)}
                  className={chipClass(account === a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">
              Ke akun
            </div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {liveAccounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setToAccount(a)}
                  className={chipClass(toAccount === a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* account (non-transfer) */}
      {type !== 'pindah' && (
        <div className="pt-4">
          <div className="mb-2 px-[22px] font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">
            Akun
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-[22px]">
            {liveAccounts.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAccount(a)}
                className={chipClass(account === a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* note */}
      <div className="px-[22px] pt-4">
        {noteOpen ? (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan…"
            className="w-full rounded-[10px] border border-kanal-line bg-kanal-bg px-3 py-2.5 text-[15px] text-kanal-fg outline-none focus:border-kanal-teal"
          />
        ) : (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="flex items-center gap-1.5 p-0.5 text-sm text-kanal-fg2"
          >
            <Plus size={14} />
            Tambah catatan
          </button>
        )}
      </div>

      {/* date + jam — default is the moment of writing; tap to backdate */}
      <div className="flex items-center gap-5 px-[22px] pb-6 pt-3.5">
        <div className="relative">
          <button
            type="button"
            tabIndex={-1}
            className="flex items-center gap-1.5 p-0.5 text-sm text-kanal-fg3"
          >
            <CalendarBlank size={15} />
            {isToday ? `Hari ini · ${shortDate(date)}` : shortDate(date)}
          </button>
          <input
            type="date"
            value={dateInputValue(date)}
            max={dateInputValue(new Date())}
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              const [y, m, d] = v.split('-').map(Number)
              const next = new Date(date)
              next.setFullYear(y, m - 1, d)
              setDate(next)
            }}
            aria-label="Tanggal transaksi"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            tabIndex={-1}
            className="flex items-center gap-1.5 p-0.5 text-sm text-kanal-fg3"
          >
            <Clock size={15} />
            {timeInputValue(date).replace(':', '.')}
          </button>
          <input
            type="time"
            value={timeInputValue(date)}
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              const [h, m] = v.split(':').map(Number)
              const next = new Date(date)
              next.setHours(h, m)
              setDate(next)
            }}
            aria-label="Jam transaksi"
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </div>
    </BottomSheet>
  )
}
