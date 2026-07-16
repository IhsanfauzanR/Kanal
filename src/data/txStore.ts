// In-memory transaction store bridged to Dexie. Views read the synchronous
// `transactions` array (no async churn); persistence + import write through to
// IndexedDB and refresh the array. `ready` is false until the first load.
//
// No bundled data is seeded here — a fresh Dexie DB starts empty, for every
// visitor (a stranger opening the deployed URL should never see the author's
// real transactions). The user populates it themselves: Catat Transaksi, or
// the in-app Realbyte importer (Statistik → Runway → Kelola → Impor).

import { create } from 'zustand'
import { db, type RawTx } from './db'
import type { Transaction } from '../features/statistik/aliran/data/types'

const toTx = (r: RawTx): Transaction => ({
  id: r.id,
  type: r.type,
  amount: r.amount,
  account: r.account,
  category: r.category,
  toAccount: r.toAccount,
  label: r.label,
  note: r.note,
  timestamp: new Date(r.timestamp),
})

// Transaction → RawTx (Date → local ISO string, drop empty optionals) for Dexie.
export const toRaw = (t: Transaction): RawTx => {
  const d = t.timestamp
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const raw: RawTx = {
    id: t.id,
    type: t.type,
    amount: t.amount,
    account: t.account,
    label: t.label,
    timestamp: iso,
  }
  if (t.category) raw.category = t.category
  if (t.toAccount) raw.toAccount = t.toAccount
  if (t.note) raw.note = t.note
  return raw
}

const newId = () =>
  `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export type NewTransaction = Omit<Transaction, 'id'> & { id?: string }

interface TxStore {
  transactions: Transaction[]
  ready: boolean
  init: () => Promise<void>
  replaceAll: (rows: RawTx[]) => Promise<void>
  addTx: (tx: NewTransaction) => Promise<Transaction>
  updateTx: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => Promise<void>
  deleteTx: (id: string) => Promise<void>
}

let initPromise: Promise<void> | null = null

export const useTxStore = create<TxStore>((set) => ({
  transactions: [],
  ready: false,

  // Idempotent: loads whatever's already in Dexie into memory (empty on a
  // fresh install). Safe to call from multiple mounts.
  init: () => {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const rows = await db.transactions.toArray()
      set({
        transactions: rows
          .map(toTx)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
        ready: true,
      })
    })()
    return initPromise
  },

  // Replace the entire dataset (used by the in-app importer).
  replaceAll: async (rows) => {
    await db.transactions.clear()
    await db.transactions.bulkAdd(rows)
    set({ transactions: rows.map(toTx), ready: true })
  },

  // Single-transaction CRUD (Catat Transaksi + Catatan edit). Each writes
  // through to Dexie and refreshes the in-memory array; the array stays sorted
  // newest-first so list views don't have to re-sort.
  addTx: async (input) => {
    const tx: Transaction = { ...input, id: input.id ?? newId() }
    await db.transactions.put(toRaw(tx))
    set((s) => ({
      transactions: [tx, ...s.transactions].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      ),
    }))
    return tx
  },

  updateTx: async (id, patch) => {
    const current = useTxStore.getState().transactions.find((t) => t.id === id)
    if (!current) return
    const next: Transaction = { ...current, ...patch, id }
    await db.transactions.put(toRaw(next))
    set((s) => ({
      transactions: s.transactions
        .map((t) => (t.id === id ? next : t))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    }))
  },

  deleteTx: async (id) => {
    await db.transactions.delete(id)
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
  },
}))
