// Editable catalog of accounts and categories (the user's CRUD-managed master
// data). A fresh install starts with ZERO accounts (the Aset empty state
// already guides "Tambah akun pertama" — every real user has different real
// banks/wallets, so there is no sensible generic default) and a small set of
// generic, non-personal categories. Thereafter the user adds / edits / removes
// entries via the manager UI (Runway KelolaSheet) and the Aset tab. Persisted
// by catalogStore.

// Six groups (Stage Final §4.2). The first four carry balances into Runway by
// default; cards/savings are opt-in.
export type AccountGroup =
  | 'tunai'
  | 'bank'
  | 'ewallet'
  | 'tabungan'
  | 'kartu-prabayar'
  | 'kartu'

export const ACCOUNT_GROUPS: Array<{ key: AccountGroup; label: string }> = [
  { key: 'tunai', label: 'Tunai' },
  { key: 'bank', label: 'Bank' },
  { key: 'ewallet', label: 'E-wallet' },
  { key: 'tabungan', label: 'Tabungan' },
  { key: 'kartu-prabayar', label: 'Kartu prabayar' },
  { key: 'kartu', label: 'Kartu' },
]

// Uppercase section headers, in render order (Aset §4.2).
export const ACCOUNT_GROUP_HEADER: Record<AccountGroup, string> = {
  tunai: 'TUNAI',
  bank: 'BANK',
  ewallet: 'E-WALLET',
  tabungan: 'TABUNGAN',
  'kartu-prabayar': 'KARTU PRABAYAR',
  kartu: 'KARTU',
}

// Default subtitle shown under an account name when none is set.
export const GROUP_SUBTITLE: Record<AccountGroup, string> = {
  tunai: '',
  bank: 'Bank',
  ewallet: 'E-wallet',
  tabungan: 'Tabungan',
  'kartu-prabayar': 'Kartu prabayar',
  kartu: 'Kartu kredit',
}

// Whether a group's balances feed Runway by default. Kartu kredit is a
// liability, savings/prepaid are excluded until the user opts them in.
export const GROUP_RUNWAY_DEFAULT: Record<AccountGroup, boolean> = {
  tunai: true,
  bank: true,
  ewallet: true,
  tabungan: false,
  'kartu-prabayar': false,
  kartu: false,
}

export interface Account {
  id: string
  name: string
  group: AccountGroup
  // The balance the user last set, valid AS OF `anchorAt`. The balance shown in
  // the app is derived: balance + every transaction delta after anchorAt
  // (masuk +, keluar −, pindah moves between accounts). Editing the balance
  // re-anchors to "now". See data/useLiveAccounts.ts.
  balance: number
  anchorAt?: number // ms epoch; missing = static (never affected) until migrated
  subtitle?: string
  includeInRunway?: boolean
  archived?: boolean
}

// Effective include-in-runway, honouring the per-account override then the
// group default (keeps accounts persisted before this field valid).
export function accountInRunway(a: Account): boolean {
  return a.includeInRunway ?? GROUP_RUNWAY_DEFAULT[a.group] ?? false
}

export type CategoryKind = 'keluar' | 'masuk'

export interface Category {
  id: string
  name: string
  kind: CategoryKind
}

// No accounts by default — every user's real banks/wallets differ, and the
// Aset empty state ("Belum ada akun tercatat." + "Tambah akun pertama") is the
// intended first-run experience, not a placeholder to fill.
export function seedAccounts(): Account[] {
  return []
}

// A small, generic starting category list — common to any Indonesian personal
// finance app, not tied to any one person's actual spending habits. Editable /
// removable immediately via the category manager.
const DEFAULT_CATEGORIES: Array<{ id: string; name: string; kind: CategoryKind }> = [
  { id: 'cat-makanan', name: 'Makanan', kind: 'keluar' },
  { id: 'cat-transportasi', name: 'Transportasi', kind: 'keluar' },
  { id: 'cat-belanja', name: 'Belanja', kind: 'keluar' },
  { id: 'cat-tagihan', name: 'Tagihan', kind: 'keluar' },
  { id: 'cat-kesehatan', name: 'Kesehatan', kind: 'keluar' },
  { id: 'cat-hiburan', name: 'Hiburan', kind: 'keluar' },
  { id: 'cat-pendidikan', name: 'Pendidikan', kind: 'keluar' },
  { id: 'cat-lainnya-keluar', name: 'Lainnya', kind: 'keluar' },
  { id: 'cat-gaji', name: 'Gaji', kind: 'masuk' },
  { id: 'cat-bonus', name: 'Bonus', kind: 'masuk' },
  { id: 'cat-lainnya-masuk', name: 'Lainnya', kind: 'masuk' },
]

export function seedCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((c) => ({ ...c }))
}
