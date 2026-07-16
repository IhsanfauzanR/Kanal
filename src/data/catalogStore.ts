// Persisted CRUD store for the account/category catalog (localStorage). The
// user adds/edits/removes their own accounts (banks, e-wallets, savings) and
// categories here; Runway balances and the Aliran scene read from it.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  GROUP_RUNWAY_DEFAULT,
  seedAccounts,
  seedCategories,
  type Account,
  type AccountGroup,
  type Category,
  type CategoryKind,
} from './catalog'
import type { RawTx } from './db'

const uid = (p: string) =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

// Pure: computes the accounts to add for names seen in imported rows but
// missing from the catalog. Anchored at epoch (not "now") — imported
// transactions are historical, and useLiveAccounts only counts deltas after
// an account's anchor. Anchoring at "now" made every imported transaction
// predate the anchor, so the derived balance never moved off the starting 0.
export function computeNewAccountsFromImport(
  existingAccounts: Account[],
  rows: RawTx[],
): Account[] {
  const haveAcc = new Set(existingAccounts.map((a) => a.name))
  const newAccounts: Account[] = []
  for (const r of rows) {
    for (const name of [r.account, r.toAccount]) {
      if (name && !haveAcc.has(name)) {
        haveAcc.add(name)
        newAccounts.push({
          id: uid('acc'),
          name,
          group: 'ewallet', // unknown source — user reclassifies in Aset
          balance: 0,
          anchorAt: 0,
          includeInRunway: GROUP_RUNWAY_DEFAULT.ewallet,
          archived: false,
        })
      }
    }
  }
  return newAccounts
}

interface CatalogStore {
  accounts: Account[]
  categories: Category[]

  addAccount: (
    name: string,
    group: AccountGroup,
    balance: number,
    opts?: { subtitle?: string; includeInRunway?: boolean },
  ) => string
  updateAccount: (id: string, patch: Partial<Omit<Account, 'id'>>) => void
  removeAccount: (id: string) => void
  archiveAccount: (id: string) => void
  restoreAccount: (id: string) => void

  addCategory: (name: string, kind: CategoryKind) => void
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  removeCategory: (id: string) => void

  // After an import: add any account/category names present in the imported
  // rows but missing from the catalog (never removes user entries).
  syncFromTransactions: (rows: RawTx[]) => void

  // Full-state restore (from a Kanal backup file) — replaces both slices
  // outright rather than merging, unlike syncFromTransactions.
  restoreFromBackup: (accounts: Account[], categories: Category[]) => void

  resetCatalog: () => void
}

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set) => ({
      accounts: seedAccounts(),
      categories: seedCategories(),

      addAccount: (name, group, balance, opts) => {
        const id = uid('acc')
        set((s) => ({
          accounts: [
            ...s.accounts,
            {
              id,
              name,
              group,
              balance,
              anchorAt: Date.now(),
              subtitle: opts?.subtitle,
              includeInRunway: opts?.includeInRunway,
              archived: false,
            },
          ],
        }))
        return id
      },
      updateAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== id) return a
            // Writing a balance means "this is the balance NOW" — re-anchor so
            // only transactions after this moment adjust it.
            const next = { ...a, ...patch }
            if ('balance' in patch) next.anchorAt = Date.now()
            return next
          }),
        })),
      removeAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),
      archiveAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, archived: true } : a,
          ),
        })),
      restoreAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, archived: false } : a,
          ),
        })),

      addCategory: (name, kind) =>
        set((s) => ({
          categories: [...s.categories, { id: uid('cat'), name, kind }],
        })),
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      syncFromTransactions: (rows) =>
        set((s) => {
          const newAccounts = computeNewAccountsFromImport(s.accounts, rows)

          const haveCat = new Set(s.categories.map((c) => c.name))
          const catTally = new Map<string, { keluar: number; masuk: number }>()
          for (const r of rows) {
            if (r.category && (r.type === 'keluar' || r.type === 'masuk')) {
              const t = catTally.get(r.category) ?? { keluar: 0, masuk: 0 }
              t[r.type] += 1
              catTally.set(r.category, t)
            }
          }

          const newCategories: Category[] = []
          for (const [name, t] of catTally) {
            if (haveCat.has(name)) continue
            newCategories.push({
              id: uid('cat'),
              name,
              kind: t.masuk > t.keluar ? 'masuk' : 'keluar',
            })
          }

          if (newAccounts.length === 0 && newCategories.length === 0) return {}
          return {
            accounts: [...s.accounts, ...newAccounts],
            categories: [...s.categories, ...newCategories],
          }
        }),

      restoreFromBackup: (accounts, categories) => set({ accounts, categories }),

      resetCatalog: () =>
        set({ accounts: seedAccounts(), categories: seedCategories() }),
    }),
    {
      name: 'kanal-catalog',
      version: 1,
      // v0 accounts have no anchorAt (balances were static). Anchor them at the
      // start of today so transactions recorded today onward move the balance,
      // while imported history stays baked into the stored number.
      migrate: (persisted, version) => {
        const state = persisted as { accounts?: Account[] } | undefined
        if (version < 1 && state?.accounts) {
          const startOfToday = new Date()
          startOfToday.setHours(0, 0, 0, 0)
          state.accounts = state.accounts.map((a) => ({
            ...a,
            anchorAt: a.anchorAt ?? startOfToday.getTime(),
          }))
        }
        return persisted
      },
    },
  ),
)
