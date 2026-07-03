// Account + category manager (CRUD). Bottom sheet with two tabs:
//   Akun     — add/edit/remove accounts (name, group, balance)
//   Kategori — add/edit/remove categories (name, income/expense)
// All edits persist live via useCatalogStore. Runway balances + the Aliran
// scene read from the same catalog, so changes flow through immediately.

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowCounterClockwise, Plus, Trash, X } from '@phosphor-icons/react'
import { useSheetHistory } from '../../../components/useSheetHistory'
import { dots } from '../shared/format'
import {
  ACCOUNT_GROUPS,
  type AccountGroup,
  type CategoryKind,
} from '../../../data/catalog'
import { useCatalogStore } from '../../../data/catalogStore'
import { useLiveAccounts } from '../../../data/useLiveAccounts'
import { ImportPanel } from './ImportPanel'

const inputBase =
  'rounded-md border border-kanal-line bg-kanal-surf px-2 py-1.5 text-[14px] text-kanal-fg focus:border-kanal-teal focus:outline-none'

function RupiahField({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (n: number) => void
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[13px] text-kanal-fg3">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={dots(value)}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        className={`${inputBase} w-28 text-right font-mono tabular-nums`}
        aria-label={label}
      />
    </div>
  )
}

function AccountManager() {
  // Live balances for display; editing the balance re-anchors it to "now"
  // (handled centrally in catalogStore.updateAccount).
  const accounts = useLiveAccounts()
  const updateAccount = useCatalogStore((s) => s.updateAccount)
  const removeAccount = useCatalogStore((s) => s.removeAccount)
  const addAccount = useCatalogStore((s) => s.addAccount)

  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<AccountGroup>('bank')

  const add = () => {
    const name = newName.trim()
    if (!name) return
    addAccount(name, newGroup, 0)
    setNewName('')
  }

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((a) => (
        <div
          key={a.id}
          className="flex flex-col gap-2 border-t border-kanal-line pt-3 first:border-t-0 first:pt-0"
        >
          <div className="flex items-center gap-2">
            <input
              value={a.name}
              onChange={(e) => updateAccount(a.id, { name: e.target.value })}
              className={`${inputBase} min-w-0 flex-1`}
              aria-label="Nama akun"
            />
            <button
              type="button"
              onClick={() => removeAccount(a.id)}
              aria-label={`Hapus ${a.name}`}
              className="flex-none p-1.5 text-kanal-fg3 transition-transform active:scale-90 hover:text-kanal-exp focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
            >
              <Trash size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <select
              value={a.group}
              onChange={(e) =>
                updateAccount(a.id, { group: e.target.value as AccountGroup })
              }
              className={`${inputBase} flex-none`}
              aria-label="Jenis akun"
            >
              {ACCOUNT_GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
            <RupiahField
              value={a.balance}
              onChange={(n) => updateAccount(a.id, { balance: n })}
              label={`Saldo ${a.name}`}
            />
          </div>
        </div>
      ))}

      <div className="mt-2 flex items-center gap-2 border-t border-kanal-line pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Akun baru"
          className={`${inputBase} min-w-0 flex-1 placeholder:text-kanal-fg4`}
          aria-label="Nama akun baru"
        />
        <select
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value as AccountGroup)}
          className={`${inputBase} flex-none`}
          aria-label="Jenis akun baru"
        >
          {ACCOUNT_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          aria-label="Tambah akun"
          className="flex-none rounded-md border border-kanal-teal-bd bg-kanal-teal-tint p-1.5 text-kanal-teal transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

function KindToggle({
  kind,
  onChange,
}: {
  kind: CategoryKind
  onChange: (k: CategoryKind) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(kind === 'keluar' ? 'masuk' : 'keluar')}
      className={`flex-none rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
        kind === 'masuk'
          ? 'border-kanal-teal-bd bg-kanal-teal-tint text-kanal-teal'
          : 'border-kanal-exp-bd bg-kanal-exp-tint text-kanal-exp'
      }`}
      aria-label={`Jenis: ${kind === 'masuk' ? 'pemasukan' : 'pengeluaran'}`}
    >
      {kind === 'masuk' ? 'masuk' : 'keluar'}
    </button>
  )
}

function CategoryManager() {
  const categories = useCatalogStore((s) => s.categories)
  const updateCategory = useCatalogStore((s) => s.updateCategory)
  const removeCategory = useCatalogStore((s) => s.removeCategory)
  const addCategory = useCatalogStore((s) => s.addCategory)

  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<CategoryKind>('keluar')

  const add = () => {
    const name = newName.trim()
    if (!name) return
    addCategory(name, newKind)
    setNewName('')
  }

  return (
    <div className="flex flex-col">
      {categories.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2 border-t border-kanal-line py-2 first:border-t-0"
        >
          <input
            value={c.name}
            onChange={(e) => updateCategory(c.id, { name: e.target.value })}
            className={`${inputBase} min-w-0 flex-1`}
            aria-label="Nama kategori"
          />
          <KindToggle
            kind={c.kind}
            onChange={(k) => updateCategory(c.id, { kind: k })}
          />
          <button
            type="button"
            onClick={() => removeCategory(c.id)}
            aria-label={`Hapus ${c.name}`}
            className="flex-none p-1.5 text-kanal-fg3 transition-transform active:scale-90 hover:text-kanal-exp focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
          >
            <Trash size={16} />
          </button>
        </div>
      ))}

      <div className="mt-2 flex items-center gap-2 border-t border-kanal-line pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Kategori baru"
          className={`${inputBase} min-w-0 flex-1 placeholder:text-kanal-fg4`}
          aria-label="Nama kategori baru"
        />
        <KindToggle kind={newKind} onChange={setNewKind} />
        <button
          type="button"
          onClick={add}
          aria-label="Tambah kategori"
          className="flex-none rounded-md border border-kanal-teal-bd bg-kanal-teal-tint p-1.5 text-kanal-teal transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

type Tab = 'akun' | 'kategori' | 'impor'

export function KelolaSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)
  const resetCatalog = useCatalogStore((s) => s.resetCatalog)
  const [tab, setTab] = useState<Tab>('akun')

  // Android back gesture/button closes the sheet instead of exiting the app.
  useSheetHistory(open, onClose)

  useEffect(() => {
    if (!open) return
    sheetRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    // Direct keyed children only — a fragment breaks AnimatePresence's exit
    // tracking (ghost backdrop that eats taps after closing).
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="absolute inset-0 z-20 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {open && (
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Kelola akun dan kategori"
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 z-30 flex max-h-[86%] flex-col rounded-t-[26px] border-t border-kanal-line bg-kanal-bg shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.6)] focus:outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: 'spring', stiffness: 130, damping: 26, mass: 0.9 }
            }
          >
            <div className="relative flex-none pt-2.5">
              <span
                aria-hidden="true"
                className="mx-auto block h-1 w-9 rounded-full bg-kanal-handle"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="absolute right-3 top-1.5 flex p-1 text-kanal-fg3 transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex flex-none items-center gap-2 px-[22px] pb-3 pt-1">
              {(['akun', 'kategori', 'impor'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  aria-pressed={tab === t}
                  className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                    tab === t ? 'bg-kanal-surf2 text-kanal-fg' : 'text-kanal-fg3'
                  }`}
                >
                  {t}
                </button>
              ))}
              {tab !== 'impor' && (
                <button
                  type="button"
                  onClick={resetCatalog}
                  className="ml-auto flex items-center gap-1 p-1 font-mono text-[11px] text-kanal-fg3 transition-transform active:scale-95"
                  aria-label="Atur ulang ke data awal"
                >
                  <ArrowCounterClockwise size={12} />
                  Atur ulang
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-[22px] pb-7 pt-1">
              {tab === 'akun' && <AccountManager />}
              {tab === 'kategori' && <CategoryManager />}
              {tab === 'impor' && <ImportPanel />}
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  )
}
