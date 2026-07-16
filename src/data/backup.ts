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
