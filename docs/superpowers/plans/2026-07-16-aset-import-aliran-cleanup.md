# Import Balance Fix, Aset/Kategori Consolidation, Aliran Icon Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix imported account balances showing Rp 0, give Aset a Kategori segment (retiring Runway's duplicate Kelola sheet), and remove two dead icons from the Aliran 3D view.

**Architecture:** Three independent fixes to the existing React/TypeScript/Zustand app — no new architecture. Introduces Vitest for the one piece of genuinely bug-prone pure logic (account balance derivation); everything else is verified manually in the running app.

**Tech Stack:** React 18, TypeScript, Zustand (+ persist middleware), Tailwind, Vite, Vitest (new).

**Spec:** [docs/superpowers/specs/2026-07-16-aset-import-aliran-cleanup-design.md](../specs/2026-07-16-aset-import-aliran-cleanup-design.md)

---

## Task 1: Set up Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: adds `vitest` to `devDependencies` in `package.json` and updates `package-lock.json`.

- [ ] **Step 2: Add the test script**

In `package.json`, add a `test` script alongside the existing ones:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Point Vitest at the existing Vite config**

Modify `vite.config.ts` — add a `test` block to the same `defineConfig` call so Vitest picks up the project's existing Vite setup without a separate config file:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/favicon-32.png', 'icons/icon-180.png'],
      manifest: {
        name: 'Kanal',
        short_name: 'Kanal',
        description: 'Pencatat keuangan pribadi yang tenang.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'id-ID',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // The lazy Aliran chunk pulls three.js and exceeds the 2 MiB default;
        // raise the cap so the app is fully precached for offline use.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
```

(Only the `test: { environment: 'node' }` block at the end is new — everything above it is unchanged. `node` is enough because every test in this plan targets pure data functions, not components.)

- [ ] **Step 4: Verify the runner works with zero tests**

Run: `npm run test`
Expected: Vitest starts and reports no test files found (exit code may be non-zero for "no tests" — that's fine, it confirms the runner itself works). If it fails with a config or import error instead, fix that before continuing.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "Add Vitest for testing pure data logic"
```

---

## Task 2: Fix imported account balances stuck at Rp 0

**Root cause:** `syncFromTransactions` creates new accounts anchored at `Date.now()` (import time). `useLiveAccounts`'s `deriveDeltas` only counts transaction deltas that occur *after* an account's anchor. Every imported transaction is historical (dated before import time), so none of them ever count — the balance stays at the hardcoded starting value of 0 forever, even though the transactions themselves imported correctly.

**Files:**
- Modify: `src/data/catalogStore.ts`
- Test: `src/data/catalogStore.test.ts` (new)
- Test: `src/data/useLiveAccounts.test.ts` (new)

- [ ] **Step 1: Write the failing tests**

Create `src/data/catalogStore.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeNewAccountsFromImport } from './catalogStore'
import type { Account } from './catalog'
import type { RawTx } from './db'

describe('computeNewAccountsFromImport', () => {
  it('anchors newly-created accounts at epoch, not "now"', () => {
    const existing: Account[] = []
    const rows: RawTx[] = [
      {
        id: 'imp0000',
        type: 'masuk',
        amount: 100000,
        account: 'Tunai Baru',
        label: 'Gaji',
        timestamp: '2025-01-15T09:00:00',
      },
    ]

    const created = computeNewAccountsFromImport(existing, rows)

    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({
      name: 'Tunai Baru',
      group: 'ewallet',
      balance: 0,
      anchorAt: 0,
      archived: false,
    })
  })

  it('does not duplicate an account name already in the catalog', () => {
    const existing: Account[] = [
      { id: 'acc-1', name: 'Tunai', group: 'tunai', balance: 50000, anchorAt: 0 },
    ]
    const rows: RawTx[] = [
      {
        id: 'imp0000',
        type: 'keluar',
        amount: 10000,
        account: 'Tunai',
        label: 'Jajan',
        timestamp: '2025-01-15T09:00:00',
      },
    ]

    expect(computeNewAccountsFromImport(existing, rows)).toHaveLength(0)
  })

  it('also creates the counterpart account from a transfer row', () => {
    const existing: Account[] = []
    const rows: RawTx[] = [
      {
        id: 'imp0000',
        type: 'pindah',
        amount: 50000,
        account: 'Blue',
        toAccount: 'Dana',
        label: 'Transfer',
        timestamp: '2025-01-15T09:00:00',
      },
    ]

    const created = computeNewAccountsFromImport(existing, rows)
    expect(created.map((a) => a.name).sort()).toEqual(['Blue', 'Dana'])
  })
})
```

Create `src/data/useLiveAccounts.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { deriveDeltas } from './useLiveAccounts'
import type { Account } from './catalog'
import type { Transaction } from '../features/statistik/aliran/data/types'

describe('deriveDeltas', () => {
  it('counts historical transactions for an account anchored at epoch (the import fix)', () => {
    const accounts: Account[] = [
      { id: 'acc-1', name: 'Tunai Baru', group: 'ewallet', balance: 0, anchorAt: 0 },
    ]
    const transactions: Transaction[] = [
      {
        id: 'imp0000',
        type: 'masuk',
        amount: 100000,
        account: 'Tunai Baru',
        label: 'Gaji',
        timestamp: new Date('2025-01-15T09:00:00'),
      },
      {
        id: 'imp0001',
        type: 'keluar',
        amount: 30000,
        account: 'Tunai Baru',
        label: 'Jajan',
        timestamp: new Date('2025-01-16T09:00:00'),
      },
    ]

    const deltas = deriveDeltas(accounts, transactions)
    expect(deltas.get('acc-1')).toBe(70000)
  })

  it('ignores transactions at or before the anchor (regression guard: this is what broke when import anchored at "now")', () => {
    const accounts: Account[] = [
      { id: 'acc-1', name: 'Tunai Baru', group: 'ewallet', balance: 0, anchorAt: Date.now() },
    ]
    const transactions: Transaction[] = [
      {
        id: 'imp0000',
        type: 'masuk',
        amount: 100000,
        account: 'Tunai Baru',
        label: 'Gaji',
        timestamp: new Date('2025-01-15T09:00:00'),
      },
    ]

    const deltas = deriveDeltas(accounts, transactions)
    expect(deltas.get('acc-1')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `computeNewAccountsFromImport` is not exported from `catalogStore.ts` yet (import error). The `useLiveAccounts.test.ts` file may pass already since `deriveDeltas` already exists and is already correct; the point of that file is to lock in current-and-fixed behavior as a regression guard, not to prove a failure.

- [ ] **Step 3: Extract the pure account-creation logic and fix the anchor**

Modify `src/data/catalogStore.ts` — replace the entire file with:

```ts
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
```

(`restoreFromBackup` is included here now because it's a one-line addition to the same interface/store, and the companion Data Durability plan's Task 4 depends on it existing — see that plan's Task 4 for where it's used. If you are executing only this plan and not the Data Durability one, `restoreFromBackup` is simply unused for now, which is fine.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS — both new test files green.

- [ ] **Step 5: Commit**

```bash
git add src/data/catalogStore.ts src/data/catalogStore.test.ts src/data/useLiveAccounts.test.ts
git commit -m "Fix imported accounts showing Rp 0: anchor at epoch, not import time"
```

---

## Task 3: Stop advertising unsupported .csv import

CSV cells have no type information, so date cells arrive as plain text the parser's fallback path doesn't reliably handle (this was the actual cause of an earlier, now-resolved confusion — see the spec's "Explicitly out of scope" note). The file picker should stop offering an extension it doesn't actually support well.

**Files:**
- Modify: `src/features/statistik/runway/ImportPanel.tsx:85`

- [ ] **Step 1: Narrow the accepted file types**

In `src/features/statistik/runway/ImportPanel.tsx`, change:

```tsx
          accept=".xlsx,.xls,.csv"
```

to:

```tsx
          accept=".xlsx,.xls"
```

- [ ] **Step 2: Commit**

```bash
git add src/features/statistik/runway/ImportPanel.tsx
git commit -m "Stop advertising .csv import (unsupported date format)"
```

---

## Task 4: Give Aset a Kategori segment

Moves category management (currently only reachable via Runway's Kelola sheet) into Aset, as a second segment next to Akun. The component itself is relocated as-is — no redesign.

**Files:**
- Create: `src/features/aset/CategoryManager.tsx`
- Modify: `src/features/aset/AsetTab.tsx`

- [ ] **Step 1: Create the relocated CategoryManager**

Create `src/features/aset/CategoryManager.tsx`:

```tsx
// Category manager — relocated from Runway's old Kelola sheet (see
// docs/superpowers/specs/2026-07-16-aset-import-aliran-cleanup-design.md).
// Add/edit/remove categories inline; kind (masuk/keluar) toggle per row.
// Persists live via useCatalogStore.

import { useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import type { CategoryKind } from '../../data/catalog'
import { useCatalogStore } from '../../data/catalogStore'

const inputBase =
  'rounded-md border border-kanal-line bg-kanal-surf px-2 py-1.5 text-[14px] text-kanal-fg focus:border-kanal-teal focus:outline-none'

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

export function CategoryManager() {
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
```

- [ ] **Step 2: Add the segment control to AsetTab**

Replace the entire contents of `src/features/aset/AsetTab.tsx` with:

```tsx
// Aset — grouped account view (Stage Final §4.2) + category manager. Total-
// likuid hero, accounts grouped by kind with subtotals, a sticky "+ Tambah
// akun", and the account editor / archive sheets on the Akun segment; a
// relocated category CRUD (moved from Runway's old Kelola sheet) on the
// Kategori segment. Accounts are word-first rows (no monogram — that's
// reserved for transactions). Renders in the phone frame on every breakpoint,
// so this is the single-column form.

import { useMemo, useState } from 'react'
import { ChartLine, DotsThreeVertical, Plus } from '@phosphor-icons/react'
import {
  ACCOUNT_GROUP_HEADER,
  ACCOUNT_GROUPS,
  GROUP_SUBTITLE,
  type Account,
  type AccountGroup,
} from '../../data/catalog'
import { useLiveAccounts } from '../../data/useLiveAccounts'
import { dots } from '../statistik/shared/format'
import { AccountEditSheet, type EditTarget } from './AccountEditSheet'
import { ArchiveSheet } from './ArchiveSheet'
import { CategoryManager } from './CategoryManager'

const LIQUID_GROUPS: AccountGroup[] = ['tunai', 'bank', 'ewallet', 'tabungan']
const ASSET_GROUPS: AccountGroup[] = ['tunai', 'bank', 'ewallet', 'tabungan', 'kartu-prabayar']

type Segment = 'akun' | 'kategori'

// "Rp 157.000" / "−Rp 12.000" — balances can go negative once they track
// transactions, so the sign is explicit.
const money = (n: number) => `${n < 0 ? '−' : ''}Rp ${dots(n)}`

export function AsetTab() {
  // Balances shown here are live: anchor + transaction deltas.
  const accounts = useLiveAccounts()
  const [segment, setSegment] = useState<Segment>('akun')
  const [target, setTarget] = useState<EditTarget | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [tip, setTip] = useState(false)

  const live = useMemo(() => accounts.filter((a) => !a.archived), [accounts])

  const { totalLikuid, asetGross, liabilitas, grouped } = useMemo(() => {
    let likuid = 0
    let gross = 0
    let liab = 0
    for (const a of live) {
      const bal = a.balance || 0
      if (LIQUID_GROUPS.includes(a.group)) likuid += bal
      if (ASSET_GROUPS.includes(a.group)) gross += bal
      if (a.group === 'kartu') liab += bal
    }
    const byGroup = ACCOUNT_GROUPS.map((g) => ({
      group: g.key,
      accts: live.filter((a) => a.group === g.key),
    })).filter((g) => g.accts.length > 0)
    return { totalLikuid: likuid, asetGross: gross, liabilitas: liab, grouped: byGroup }
  }, [live])

  const isEmpty = accounts.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* top bar */}
      <div className="relative flex items-center justify-between px-[22px] pb-1 pt-2">
        <span className="text-xl font-medium tracking-[-0.01em] text-kanal-fg">Aset</span>
        {segment === 'akun' && (
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => {
                setTip(true)
                window.setTimeout(() => setTip(false), 2200)
              }}
              aria-label="Riwayat aset"
              className="flex p-1.5 text-kanal-fg2 transition-transform active:scale-90"
            >
              <ChartLine size={20} />
            </button>
            <button
              type="button"
              onClick={() => setArchiveOpen(true)}
              aria-label="Akun terarsip"
              className="flex p-1.5 text-kanal-fg2 transition-transform active:scale-90"
            >
              <DotsThreeVertical size={20} weight="bold" />
            </button>
          </div>
        )}
        {tip && (
          <div
            role="status"
            className="absolute right-[22px] top-[42px] z-10 rounded-lg border border-kanal-line bg-kanal-surf2 px-3 py-1.5 text-xs text-kanal-fg2"
          >
            Riwayat aset akan datang setelah v1.0
          </div>
        )}
      </div>

      {/* segment tabs */}
      <div className="flex items-center gap-2 px-[22px] pb-2 pt-1">
        {(['akun', 'kategori'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSegment(s)}
            aria-pressed={segment === s}
            className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
              segment === s ? 'bg-kanal-surf2 text-kanal-fg' : 'text-kanal-fg3'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {segment === 'kategori' ? (
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-[22px] pb-6 pt-1">
          <CategoryManager />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10">
          <p className="text-center text-[0.9375rem] text-kanal-fg2">Belum ada akun tercatat.</p>
          <button
            type="button"
            onClick={() => setTarget({ mode: 'add' })}
            className="rounded-xl bg-kanal-teal px-5 py-2.5 text-sm font-medium text-kanal-teal-on transition-transform active:scale-[0.98]"
          >
            Tambah akun pertama
          </button>
        </div>
      ) : (
        <>
          <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
            {/* hero */}
            <div className="px-[22px] pt-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-kanal-fg3">
                Total likuid
              </div>
              <div className="tnum mt-3 flex items-baseline gap-2.5">
                <span className="font-mono text-[1.05rem] text-kanal-fg2">
                  {totalLikuid < 0 ? '−Rp' : 'Rp'}
                </span>
                <span className="font-mono text-[2.75rem] font-normal leading-none tracking-[-0.03em] text-kanal-fg">
                  {dots(totalLikuid)}
                </span>
              </div>
              <div className="mt-3 font-mono text-[11px] text-kanal-fg3">
                Aset {money(asetGross)} · Liabilitas {money(liabilitas)}
                {liabilitas > 0 && (
                  <span className="text-kanal-fg3"> · bersih {money(asetGross - liabilitas)}</span>
                )}
              </div>
            </div>

            <div className="mx-[22px] mt-[22px] h-px bg-kanal-line" />

            {/* groups */}
            <div className="px-[22px] pb-4">
              {grouped.map((g) => (
                <AccountGroupSection
                  key={g.group}
                  group={g.group}
                  accts={g.accts}
                  onEdit={(account) => setTarget({ mode: 'edit', account })}
                />
              ))}
            </div>
          </div>

          {/* sticky add */}
          <div className="flex-none border-t border-kanal-line bg-kanal-bg px-[22px] pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={() => setTarget({ mode: 'add' })}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-kanal-teal text-[15px] font-medium text-kanal-teal-on transition-transform active:scale-[0.98]"
            >
              <Plus size={17} />
              Tambah akun
            </button>
          </div>
        </>
      )}

      <AccountEditSheet target={target} onClose={() => setTarget(null)} />
      <ArchiveSheet open={archiveOpen} onClose={() => setArchiveOpen(false)} />
    </div>
  )
}

function AccountGroupSection({
  group,
  accts,
  onEdit,
}: {
  group: AccountGroup
  accts: Account[]
  onEdit: (a: Account) => void
}) {
  const subtotal = accts.reduce((s, a) => s + (a.balance || 0), 0)
  return (
    <div className="mt-[18px]">
      <div className="flex items-center justify-between border-b border-kanal-line pb-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-kanal-fg3">
          {ACCOUNT_GROUP_HEADER[group]}
        </span>
        <span className="tnum font-mono text-[0.8125rem] text-kanal-fg2">{money(subtotal)}</span>
      </div>
      {accts.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onEdit(a)}
          className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-[9px] border-t border-kanal-line px-2 py-3.5 text-left transition-[background,transform] duration-150 first:border-t-0 active:scale-[0.99] hover:bg-kanal-fg/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[0.9375rem] font-medium text-kanal-fg">{a.name}</span>
            {(a.subtitle || GROUP_SUBTITLE[group]) && (
              <span className="truncate font-mono text-[10px] text-kanal-fg3">
                {a.subtitle || GROUP_SUBTITLE[group]}
              </span>
            )}
          </span>
          <span
            className={`tnum flex-none font-mono text-[0.9375rem] ${
              (a.balance || 0) < 0 ? 'text-kanal-exp' : 'text-kanal-teal'
            }`}
          >
            {money(a.balance || 0)}
          </span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc -b --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/aset/CategoryManager.tsx src/features/aset/AsetTab.tsx
git commit -m "Add Kategori segment to Aset"
```

---

## Task 5: Retire Runway's duplicate Kelola sheet

All three of `KelolaSheet.tsx`'s tabs are now superseded: Akun by `AccountEditSheet` (already more capable — has archive, delete-with-confirm, and the runway toggle that the old inline editor lacked), Kategori by the segment added in Task 4, and Impor by Pengaturan's existing import flow. Delete it and its trigger.

**Files:**
- Delete: `src/features/statistik/runway/KelolaSheet.tsx`
- Modify: `src/features/statistik/runway/RunwayView.tsx`

- [ ] **Step 1: Delete KelolaSheet**

Run: `git rm src/features/statistik/runway/KelolaSheet.tsx`

- [ ] **Step 2: Remove its trigger from RunwayView**

Replace the entire contents of `src/features/statistik/runway/RunwayView.tsx` with:

```tsx
// Runway view (§6). Liquid assets ÷ average spend = months of runway, presented
// as plain math. The hero shows the current reality; the timeline + scenario
// slider explore "what if I cut Rp X/month" without ever framing it as a goal.

import { useMemo, useState } from 'react'
import { useStatistikStore } from '../shared/store/useStatistikStore'
import { rupiah, rupiahCents } from '../shared/format'
import { ViewHeader, type ViewStat } from '../shared/ViewHeader'
import { SectionDivider } from '../shared/SectionDivider'
import { EmptyState } from '../shared/EmptyState'
import { assetTotal, type AssetBucket } from './assets'
import { AssetSelector } from './AssetSelector'
import { RunwayHero } from './RunwayHero'
import { RunwayTimeline } from './RunwayTimeline'
import { SensitivitySlider } from './SensitivitySlider'
import { useLiveAccounts } from '../../../data/useLiveAccounts'
import { useRunwayCalculation } from './hooks/useRunwayCalculation'

export function RunwayView() {
  const period = useStatistikStore((s) => s.period)
  // Live balances (anchor + transaction deltas) so runway follows reality.
  const accounts = useLiveAccounts()
  const [bucket, setBucket] = useState<AssetBucket>('tunai-bank')
  // Exploratory only — local state, so leaving the view resets it (§6.2).
  const [reduction, setReduction] = useState(0)

  const liquid = useMemo(() => assetTotal(bucket, accounts), [bucket, accounts])
  const baseResult = useRunwayCalculation(liquid, 0, period)
  const scenarioResult = useRunwayCalculation(liquid, reduction, period)

  const headerStats: ViewStat[] = [
    {
      label: 'Rata-rata pengeluaran/bulan',
      value: rupiah(Math.round(baseResult.avgMonthlySpend)),
    },
    { label: 'Kas likuid total', value: rupiahCents(liquid) },
  ]

  if (!baseResult.hasHistory) {
    return (
      <div className="relative flex flex-1 items-center justify-center rounded-2xl border border-kanal-line bg-kanal-bg">
        <EmptyState
          message="Belum cukup data untuk menghitung runway. Catatan minimal 1 bulan diperlukan."
          actionLabel="Catat transaksi"
        />
      </div>
    )
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-kanal-line bg-kanal-bg">
      <div className="no-scrollbar flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto py-4">
        <ViewHeader title="Runway" stats={headerStats} />
        <div className="min-w-0 px-[22px]">
          <AssetSelector value={bucket} onChange={setBucket} />
        </div>
        <SectionDivider className="mx-[22px]" />
        <RunwayHero result={baseResult} />
        <SectionDivider className="mx-[22px]" />
        <RunwayTimeline
          result={scenarioResult}
          baseRunwayDays={baseResult.runwayDays}
          className="px-[22px] pt-1"
        />
        <SensitivitySlider
          value={reduction}
          onChange={setReduction}
          scenarioResult={scenarioResult}
          className="px-[22px] pb-2 pt-2"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc -b --noEmit && npm run lint`
Expected: no errors, no unused-import warnings.

- [ ] **Step 4: Commit**

```bash
git add -A src/features/statistik/runway
git commit -m "Retire Runway's duplicate Kelola sheet (Akun/Kategori/Impor superseded)"
```

---

## Task 6: Remove dead icons from Aliran

`AliranView.tsx` shows three icon buttons over the 3D scene today: reset-camera, the 2D/3D toggle, and a "Bantuan" (help) button whose `onClick` is a literal no-op. Keep only the 2D/3D toggle. The reset-camera capability is not orphaned — `AliranInfoPanel.tsx` also calls `requestReset` when the user clears a selection, and that call is untouched by this change.

**Files:**
- Modify: `src/features/statistik/aliran/AliranView.tsx`

- [ ] **Step 1: Remove the two icons and their now-unused imports/hook call**

Replace the entire contents of `src/features/statistik/aliran/AliranView.tsx` with:

```tsx
// Aliran view — mounts the canvas (or 2D Sankey fallback) + overlay UI (§9).
// Canvas, MENAMPILKAN chip, 2D/3D toggle, scrubber, info panel. Reduced-motion
// users land on the static 2D fallback automatically (§10 / a11y).

import { useEffect } from 'react'
import { ChartBar, type Icon } from '@phosphor-icons/react'
import { AliranCanvas } from './AliranCanvas'
import { SankeyFallback } from './SankeyFallback'
import { AliranScrubber } from './AliranScrubber'
import { AliranInfoPanel } from './AliranInfoPanel'
import { useSceneStore } from './hooks/useSceneStore'
import { useSceneData } from './hooks/useSceneData'
import { usePlayback } from './hooks/usePlayback'
import { useStatistikStore } from '../shared/store/useStatistikStore'

interface IconButtonProps {
  icon: Icon
  label: string
  onClick: () => void
  active?: boolean
}

function IconButton({ icon: Icon, label, onClick, active }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-kanal-line bg-kanal-glass backdrop-blur-md transition-transform active:scale-[0.94] ${
        active ? 'text-kanal-fg' : 'text-kanal-fg2'
      }`}
    >
      <Icon size={18} weight="regular" />
    </button>
  )
}

export function AliranView() {
  const use2DFallback = useSceneStore((s) => s.use2DFallback)
  const toggle2DFallback = useSceneStore((s) => s.toggle2DFallback)
  const set2DFallback = useSceneStore((s) => s.set2DFallback)
  const { txCount } = useSceneData()
  const periodLabel = useStatistikStore((s) => s.period.label)

  usePlayback()

  // Reduced-motion users get the static 2D Sankey instead of the animated scene.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      set2DFallback(true)
    }
  }, [set2DFallback])

  return (
    <div
      className="relative flex-1 overflow-hidden rounded-2xl border border-kanal-line"
      style={{
        background:
          'linear-gradient(180deg,var(--scene-edge) 0%,var(--scene-mid) 28%,var(--scene-mid) 72%,var(--scene-edge) 100%)',
      }}
      role="group"
      aria-label="Aliran — visualisasi arus kas: pemasukan mengalir ke pengeluaran"
    >
      {!use2DFallback ? <AliranCanvas /> : <SankeyFallback />}

      {/* WebGL tag (3D only) */}
      {!use2DFallback && (
        <span className="pointer-events-none absolute right-3.5 top-3 font-mono text-[9px] tracking-[0.06em] text-kanal-fg4">
          3D scene · WebGL
        </span>
      )}

      {/* MENAMPILKAN context chip */}
      <div className="rounded-[11px] absolute left-3 top-3 border border-kanal-line bg-kanal-glass px-3 py-[9px] backdrop-blur-md">
        <div className="font-mono text-[9px] tracking-[0.14em] text-kanal-fg3">
          MENAMPILKAN
        </div>
        <div className="mt-1 text-[13px] font-medium text-kanal-fg">
          {txCount} transaksi · {periodLabel}
        </div>
      </div>

      {/* Icon cluster (§9) — only the 2D/3D toggle remains */}
      <div className="absolute right-3 top-12 flex flex-col gap-1.5">
        <IconButton
          icon={ChartBar}
          label={use2DFallback ? 'Tampilan 3D' : 'Tampilan 2D'}
          onClick={toggle2DFallback}
          active={use2DFallback}
        />
      </div>

      {/* Scrubber (3D only) */}
      {!use2DFallback && (
        <AliranScrubber className="absolute bottom-3 left-3 right-3" />
      )}

      {/* Info panel (tap a prism/ridge) */}
      <AliranInfoPanel />
    </div>
  )
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc -b --noEmit && npm run lint`
Expected: no errors, no unused-import warnings.

- [ ] **Step 3: Commit**

```bash
git add src/features/statistik/aliran/AliranView.tsx
git commit -m "Remove dead reset-camera and Bantuan icons from Aliran"
```

---

## Task 7: Full-suite check and manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

Run: `npm run test && npx tsc -b --noEmit && npm run lint`
Expected: all green.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Manual verification in the running app**

Run: `npm run dev`, open the printed local URL, and check:
1. Import a real `.xlsx` Realbyte export (Pengaturan → Impor dari file). New accounts appear in Aset with their correct derived balances (not Rp 0).
2. In Aset, switch between "Akun" and "Kategori" segments. Add, edit, and delete an entry in each; confirm both behave as they did before relocation (category add/edit/delete was previously only reachable via Statistik → Runway → the pencil icon).
3. Open Statistik → Runway. Confirm there is no pencil/"Kelola" icon anymore.
4. Open Statistik → Aliran. Confirm exactly one icon (2D/3D toggle) appears over the 3D scene, and tapping it still switches to the 2D Sankey view and back.

- [ ] **Step 4: Final commit if any fixes were needed during manual verification**

```bash
git add -A
git commit -m "Fix issues found during manual verification"
```

(Skip this step if manual verification found nothing to fix.)
