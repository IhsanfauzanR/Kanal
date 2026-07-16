# Data Durability: Backup & Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user recover their data after it's wiped (e.g. clearing Chrome's site data) via a full-state JSON backup/restore, plus request persistent storage to reduce automatic eviction.

**Architecture:** A new pure `src/data/backup.ts` module (serialize/validate, unit tested) backing two small UI additions in Pengaturan: a "Cadangkan data" button + status line, and a "Pulihkan dari cadangan" panel separate from the existing Realbyte `.xlsx` importer (the two flows do genuinely different things — restore replaces everything, import replaces transactions only).

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind, Vitest.

**Spec:** [docs/superpowers/specs/2026-07-16-data-durability-backup-design.md](../specs/2026-07-16-data-durability-backup-design.md)

**Prerequisite:** This plan assumes Vitest is already configured (added in Task 1 of the companion [Import/Aset/Aliran cleanup plan](2026-07-16-aset-import-aliran-cleanup.md)). If running this plan standalone and `npm run test` doesn't exist yet, run `npm install -D vitest` and add `"test": "vitest run"` to `package.json`'s `scripts`, and a `test: { environment: 'node' }` block to `vite.config.ts`'s `defineConfig` call, before starting Task 2.

This plan also depends on `restoreFromBackup` existing on `useCatalogStore` (added in the companion plan's Task 2). If running standalone, add this to `src/data/catalogStore.ts`'s `CatalogStore` interface and store body before Task 4 below:
```ts
// interface CatalogStore additions:
restoreFromBackup: (accounts: Account[], categories: Category[]) => void
// store body addition:
restoreFromBackup: (accounts, categories) => set({ accounts, categories }),
```

---

## Task 1: Request persistent storage on app init

Best-effort — asks the browser not to auto-evict this origin's storage under device storage pressure. Does **not** protect against the user manually clearing site data; that's a distinct action this API cannot intercept. Cheap and strictly additive.

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Add the persist() call**

Replace the entire contents of `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Best-effort: reduces automatic eviction under storage pressure. Does not
// protect against the user manually clearing site data in the browser UI —
// see docs/superpowers/specs/2026-07-16-data-durability-backup-design.md.
navigator.storage?.persist?.().catch(() => {
  /* ignore — this is a nice-to-have, not load-bearing */
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors. (`navigator.storage.persist` is part of the standard DOM lib TypeScript already ships, so no new types are needed.)

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "Request persistent storage on app init"
```

---

## Task 2: Export toRaw from txStore

Small prerequisite for Task 3 — the backup feature needs to convert live `Transaction[]` (in-memory shape, `timestamp: Date`) to `RawTx[]` (persisted shape, `timestamp: string`), and `txStore.ts` already has exactly that conversion, just not exported.

**Files:**
- Modify: `src/data/txStore.ts:14`

- [ ] **Step 1: Export the existing toRaw function**

In `src/data/txStore.ts`, change:

```ts
const toRaw = (t: Transaction): RawTx => {
```

to:

```ts
export const toRaw = (t: Transaction): RawTx => {
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/txStore.ts
git commit -m "Export toRaw from txStore for reuse by the backup feature"
```

---

## Task 3: Backup file format, serialize, and validate

The core logic, kept pure and framework-free so it's trivially testable: build a backup object from in-memory state, and validate/parse an arbitrary unknown value back into one.

**Files:**
- Create: `src/data/backup.ts`
- Test: `src/data/backup.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/data/backup.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createBackup, parseBackup, BACKUP_VERSION } from './backup'
import type { RawTx } from './db'
import type { Account, Category } from './catalog'

const sampleState = {
  transactions: [
    {
      id: 'tx-1',
      type: 'keluar' as const,
      amount: 10000,
      account: 'Tunai',
      category: 'Makanan',
      label: 'Nasi goreng',
      timestamp: '2026-07-01T12:00:00',
    },
  ] satisfies RawTx[],
  accounts: [
    { id: 'acc-1', name: 'Tunai', group: 'tunai' as const, balance: 50000, anchorAt: 0 },
  ] satisfies Account[],
  categories: [
    { id: 'cat-1', name: 'Makanan', kind: 'keluar' as const },
  ] satisfies Category[],
  theme: 'dark' as const,
}

describe('createBackup', () => {
  it('captures all four data slices plus a version and timestamp', () => {
    const backup = createBackup(sampleState)
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(backup.transactions).toEqual(sampleState.transactions)
    expect(backup.accounts).toEqual(sampleState.accounts)
    expect(backup.categories).toEqual(sampleState.categories)
    expect(backup.theme).toBe('dark')
    expect(() => new Date(backup.exportedAt).toISOString()).not.toThrow()
  })
})

describe('parseBackup', () => {
  it('round-trips a backup created by createBackup', () => {
    const backup = createBackup(sampleState)
    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)))
    expect(parsed).toEqual(backup)
  })

  it('rejects a plain object missing the expected shape', () => {
    expect(parseBackup({ foo: 'bar' })).toBeNull()
  })

  it('rejects null, arrays, and primitives', () => {
    expect(parseBackup(null)).toBeNull()
    expect(parseBackup([])).toBeNull()
    expect(parseBackup('not a backup')).toBeNull()
    expect(parseBackup(42)).toBeNull()
  })

  it('rejects a mismatched version', () => {
    const backup = createBackup(sampleState)
    expect(parseBackup({ ...backup, version: 99 })).toBeNull()
  })

  it('rejects an invalid theme value', () => {
    const backup = createBackup(sampleState)
    expect(parseBackup({ ...backup, theme: 'purple' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `./backup` doesn't exist yet (import error).

- [ ] **Step 3: Implement backup.ts**

Create `src/data/backup.ts`:

```ts
// Full-state backup/restore — independent of the .xlsx transaction export,
// which only covers transactions. A backup captures everything needed to
// restore the app exactly: transactions, the account/category catalog, and
// theme. See docs/superpowers/specs/2026-07-16-data-durability-backup-design.md.

import type { RawTx } from './db'
import type { Account, Category } from './catalog'
import type { ThemeChoice } from './themeStore'

export const BACKUP_VERSION = 1

export interface BackupFile {
  version: number
  exportedAt: string
  transactions: RawTx[]
  accounts: Account[]
  categories: Category[]
  theme: ThemeChoice
}

export function createBackup(state: {
  transactions: RawTx[]
  accounts: Account[]
  categories: Category[]
  theme: ThemeChoice
}): BackupFile {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions: state.transactions,
    accounts: state.accounts,
    categories: state.categories,
    theme: state.theme,
  }
}

const isThemeChoice = (v: unknown): v is ThemeChoice =>
  v === 'dark' || v === 'light' || v === 'system'

// Validates that a parsed JSON value has the shape of a Kanal backup. Returns
// null (rather than throwing) so callers can show one clear error message
// regardless of which check failed — "this file isn't a valid backup" is all
// the user needs to know.
export function parseBackup(data: unknown): BackupFile | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (d.version !== BACKUP_VERSION) return null
  if (!Array.isArray(d.transactions)) return null
  if (!Array.isArray(d.accounts)) return null
  if (!Array.isArray(d.categories)) return null
  if (!isThemeChoice(d.theme)) return null
  return {
    version: d.version,
    exportedAt: typeof d.exportedAt === 'string' ? d.exportedAt : new Date().toISOString(),
    transactions: d.transactions as RawTx[],
    accounts: d.accounts as Account[],
    categories: d.categories as Category[],
    theme: d.theme,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function downloadBackup(backup: BackupFile): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const d = new Date()
  const filename = `kanal-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const LAST_BACKUP_KEY = 'kanal:last-backup'

export function recordBackupNow(): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()))
  } catch {
    /* ignore write failures */
  }
}

export function lastBackupAt(): number | null {
  try {
    const v = localStorage.getItem(LAST_BACKUP_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS — all `backup.test.ts` cases green.

- [ ] **Step 5: Commit**

```bash
git add src/data/backup.ts src/data/backup.test.ts
git commit -m "Add backup file format with serialize/validate logic"
```

---

## Task 4: Restore panel in Pengaturan

A small, separate component from `ImportPanel` (Realbyte `.xlsx` import) — restoring a backup replaces transactions, accounts, categories, and theme in one step, which is a different operation from replacing transactions alone.

**Files:**
- Create: `src/features/settings/RestoreBackupPanel.tsx`

- [ ] **Step 1: Implement the restore panel**

Create `src/features/settings/RestoreBackupPanel.tsx`:

```tsx
// Restore a full Kanal backup (.json, produced by "Cadangkan data" in
// Pengaturan) — replaces transactions, accounts, categories, and theme in one
// step. Separate from ImportPanel (Realbyte .xlsx import) because the two
// flows do genuinely different things: this one restores everything the app
// knows, that one replaces transactions only.

import { useState } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { useTxStore } from '../../data/txStore'
import { useCatalogStore } from '../../data/catalogStore'
import { useThemeStore } from '../../data/themeStore'
import { parseBackup, type BackupFile } from '../../data/backup'

type Status = 'idle' | 'reading' | 'preview' | 'restoring' | 'done' | 'error'

export function RestoreBackupPanel() {
  const replaceAll = useTxStore((s) => s.replaceAll)
  const restoreFromBackup = useCatalogStore((s) => s.restoreFromBackup)
  const setChoice = useThemeStore((s) => s.setChoice)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [backup, setBackup] = useState<BackupFile | null>(null)

  const onFile = async (file: File) => {
    setStatus('reading')
    setError('')
    setBackup(null)
    try {
      const text = await file.text()
      const parsed = parseBackup(JSON.parse(text))
      if (!parsed) {
        setError('File cadangan tidak valid atau rusak.')
        setStatus('error')
        return
      }
      setBackup(parsed)
      setStatus('preview')
    } catch {
      setError('File cadangan tidak valid atau rusak.')
      setStatus('error')
    }
  }

  const confirm = async () => {
    if (!backup) return
    setStatus('restoring')
    await replaceAll(backup.transactions)
    restoreFromBackup(backup.accounts, backup.categories)
    setChoice(backup.theme)
    setStatus('done')
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] leading-relaxed text-kanal-fg2">
        Pulihkan dari file cadangan (.json) — mengganti seluruh transaksi, akun,
        kategori, dan tema dengan isi file.
      </p>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-dashed border-kanal-line bg-kanal-surf px-4 py-5 text-[13px] font-medium text-kanal-fg2 transition-colors hover:border-kanal-teal-bd">
        <UploadSimple size={16} />
        Pilih file .json
        <input
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
            e.target.value = ''
          }}
        />
      </label>

      {status === 'reading' && <p className="text-[13px] text-kanal-fg3">Membaca file…</p>}
      {status === 'error' && <p className="text-[13px] text-kanal-exp">{error}</p>}
      {status === 'restoring' && <p className="text-[13px] text-kanal-fg3">Memulihkan…</p>}
      {status === 'done' && (
        <p className="text-[13px] text-kanal-teal">Berhasil dipulihkan.</p>
      )}

      {status === 'preview' && backup && (
        <div className="flex flex-col gap-3 rounded-[12px] border border-kanal-line bg-kanal-surf p-3.5">
          <div className="tnum font-mono text-[12px] text-kanal-fg2">
            {backup.transactions.length} transaksi · {backup.accounts.length} akun ·{' '}
            {backup.categories.length} kategori · dicadangkan{' '}
            {new Date(backup.exportedAt).toLocaleDateString('id-ID')}
          </div>
          <button
            type="button"
            onClick={confirm}
            className="self-start rounded-[10px] border border-kanal-teal-bd bg-kanal-teal-tint px-3.5 py-2 text-[13px] font-medium text-kanal-teal transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
          >
            Pulihkan dari cadangan ini
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors. (If `restoreFromBackup` is not found on the catalog store, see this plan's Prerequisite section above.)

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/RestoreBackupPanel.tsx
git commit -m "Add restore-from-backup panel"
```

---

## Task 5: Wire backup + restore into Pengaturan

Adds a "Cadangkan data" button with a passive last-backup status line next to the existing "Ekspor transaksi", and a "Pulihkan dari cadangan" collapsible section matching the existing "Impor dari file" one.

**Files:**
- Modify: `src/features/settings/PengaturanSheet.tsx`

- [ ] **Step 1: Wire it up**

Replace the entire contents of `src/features/settings/PengaturanSheet.tsx` with:

```tsx
// Pengaturan (Stage Final §4.5) — opened from the Beranda gear. Theme choice
// (Gelap / Terang / Ikuti sistem), data in/out (ekspor .xlsx + impor,
// cadangkan & pulihkan .json — moved here from its old hiding place inside
// Runway's Kelola sheet so migration from Realbyte and full-state backup are
// both discoverable in one place), and a small iOS "add to home screen" helper.

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, Check, Export, Plus } from '@phosphor-icons/react'
import { BottomSheet } from '../../components/BottomSheet'
import { useUiStore } from '../../app/uiStore'
import { useThemeStore, type ThemeChoice } from '../../data/themeStore'
import { useTxStore, toRaw } from '../../data/txStore'
import { useCatalogStore } from '../../data/catalogStore'
import { ImportPanel } from '../statistik/runway/ImportPanel'
import { RestoreBackupPanel } from './RestoreBackupPanel'
import { exportTransactionsXlsx } from './exportXlsx'
import { createBackup, downloadBackup, lastBackupAt, recordBackupNow } from '../../data/backup'

const THEME_OPTIONS: Array<{ key: ThemeChoice; label: string }> = [
  { key: 'dark', label: 'Gelap' },
  { key: 'light', label: 'Terang' },
  { key: 'system', label: 'Ikuti sistem' },
]

function backupStatusLabel(ts: number | null): string {
  if (!ts) return 'Belum pernah dicadangkan'
  const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'Terakhir: hari ini'
  if (days === 1) return 'Terakhir: kemarin'
  return `Terakhir: ${days} hari lalu`
}

export function PengaturanSheet() {
  const open = useUiStore((s) => s.settingsOpen)
  const close = useUiStore((s) => s.closeSettings)
  const choice = useThemeStore((s) => s.choice)
  const setChoice = useThemeStore((s) => s.setChoice)
  const transactions = useTxStore((s) => s.transactions)
  const [helpOpen, setHelpOpen] = useState(false)
  const [imporOpen, setImporOpen] = useState(false)
  const [pulihOpen, setPulihOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lastBackup, setLastBackup] = useState(lastBackupAt)

  const doExport = async () => {
    if (transactions.length === 0 || exporting) return
    setExporting(true)
    try {
      await exportTransactionsXlsx(transactions)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const doBackup = () => {
    const { accounts, categories } = useCatalogStore.getState()
    const { choice: theme } = useThemeStore.getState()
    downloadBackup(
      createBackup({
        transactions: transactions.map(toRaw),
        accounts,
        categories,
        theme,
      }),
    )
    recordBackupNow()
    setLastBackup(lastBackupAt())
  }

  return (
    <BottomSheet open={open} onClose={close} ariaLabel="Pengaturan" maxHeight="76%">
      <div className="px-[22px] pb-8 pt-1">
        <div className="text-[17px] font-medium text-kanal-fg">Pengaturan</div>

        {/* theme */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-[15px] text-kanal-fg2">Mode tampilan</span>
          <div className="flex gap-1 rounded-[11px] border border-kanal-line bg-kanal-bg p-1">
            {THEME_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setChoice(o.key)}
                aria-pressed={choice === o.key}
                className={`rounded-[8px] px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  choice === o.key ? 'bg-kanal-surf2 text-kanal-fg' : 'text-kanal-fg3'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="my-5 h-px bg-kanal-line" />

        {/* data in/out */}
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">
          Data
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="flex min-w-0 flex-col">
            <span className="text-[15px] text-kanal-fg2">Ekspor transaksi</span>
            <span className="tnum mt-0.5 font-mono text-[11px] text-kanal-fg3">
              {transactions.length} transaksi · .xlsx
            </span>
          </span>
          <button
            type="button"
            onClick={doExport}
            disabled={transactions.length === 0 || exporting}
            className="flex-none rounded-[9px] border border-kanal-line px-3 py-1.5 text-[13px] font-medium text-kanal-fg2 transition-transform active:scale-[0.97] disabled:opacity-40"
          >
            {exporting ? 'Menyiapkan…' : 'Ekspor'}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="flex min-w-0 flex-col">
            <span className="text-[15px] text-kanal-fg2">Cadangkan data</span>
            <span className="mt-0.5 font-mono text-[11px] text-kanal-fg3">
              {backupStatusLabel(lastBackup)}
            </span>
          </span>
          <button
            type="button"
            onClick={doBackup}
            className="flex-none rounded-[9px] border border-kanal-line px-3 py-1.5 text-[13px] font-medium text-kanal-fg2 transition-transform active:scale-[0.97]"
          >
            Cadangkan
          </button>
        </div>

        <button
          type="button"
          onClick={() => setImporOpen((v) => !v)}
          aria-expanded={imporOpen}
          className="mt-4 flex w-full items-center justify-between py-1 text-left"
        >
          <span className="text-[15px] text-kanal-fg2">Impor dari file</span>
          <CaretDown
            size={16}
            className={`text-kanal-fg3 transition-transform ${imporOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {imporOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <ImportPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setPulihOpen((v) => !v)}
          aria-expanded={pulihOpen}
          className="mt-4 flex w-full items-center justify-between py-1 text-left"
        >
          <span className="text-[15px] text-kanal-fg2">Pulihkan dari cadangan</span>
          <CaretDown
            size={16}
            className={`text-kanal-fg3 transition-transform ${pulihOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {pulihOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <RestoreBackupPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="my-5 h-px bg-kanal-line" />

        {/* install help */}
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          aria-expanded={helpOpen}
          className="flex w-full items-center justify-between py-1 text-left"
        >
          <span className="text-[15px] text-kanal-fg2">Pasang aplikasi</span>
          <CaretDown
            size={16}
            className={`text-kanal-fg3 transition-transform ${helpOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {helpOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 text-[13px] leading-relaxed text-kanal-fg3">
                <p className="text-kanal-fg2">Di iPhone (Safari):</p>
                <ol className="mt-2.5 flex flex-col gap-2.5">
                  <li className="flex items-center gap-2.5">
                    <Export size={17} className="flex-none text-kanal-fg2" />
                    Ketuk ikon Bagikan di bilah bawah.
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Plus size={17} className="flex-none text-kanal-fg2" />
                    Pilih “Tambahkan ke Layar Utama”.
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={17} className="flex-none text-kanal-fg2" />
                    Ketuk “Tambah”. Kanal muncul di layar utama.
                  </li>
                </ol>
                <p className="mt-3">
                  Di Android (Chrome), tawaran pasang muncul otomatis di Beranda setelah beberapa
                  kali dipakai.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="my-5 h-px bg-kanal-line" />

        <div className="flex items-center justify-between font-mono text-[11px] text-kanal-fg3">
          <span>Kanal</span>
          <span>v1.0 · lokal, tanpa server</span>
        </div>
      </div>
    </BottomSheet>
  )
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc -b --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/PengaturanSheet.tsx
git commit -m "Add backup button and restore panel to Pengaturan"
```

---

## Task 6: Full-suite check and manual wipe/restore verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

Run: `npm run test && npx tsc -b --noEmit && npm run lint`
Expected: all green.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Manual wipe/restore verification (the actual scenario this feature exists for)**

Run: `npm run dev`, open the printed local URL, and:
1. Record a couple of transactions, add an account, add a category, switch the theme to Terang.
2. Open Pengaturan → tap "Cadangkan" — confirm a `kanal-backup-YYYY-MM-DD.json` file downloads and the status line updates to "Terakhir: hari ini".
3. Open browser DevTools → Application → Storage → "Clear site data" (this simulates the Chrome "clear browsing data" scenario that caused the original data loss).
4. Reload the app — confirm it's back to empty/default state (proving the wipe actually happened).
5. Open Pengaturan → "Pulihkan dari cadangan" → pick the downloaded `.json` file → confirm the preview shows the right counts → tap "Pulihkan dari cadangan ini".
6. Confirm transactions, the account, the category, and the theme (Terang) are all back exactly as they were before the wipe.

- [ ] **Step 4: Final commit if any fixes were needed during manual verification**

```bash
git add -A
git commit -m "Fix issues found during manual verification"
```

(Skip this step if manual verification found nothing to fix.)
