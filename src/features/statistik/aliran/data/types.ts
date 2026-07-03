// Stage 3C data model — see KANAL_STAGE_3C_BRIEF.md §4.
// Schema is shaped so the Stage 5 Dexie swap-in is trivial: replace the
// mock source, keep transformToScene() and the SceneBuckets shape unchanged.

export type AccountId =
  | 'tunai'
  | 'bjb'
  | 'blue'
  | 'beloved'
  | 'gopay'
  | 'rdn-permata'

export type CategoryId =
  | 'makan'
  | 'lainnya'
  | 'pendidikan'
  | 'rokok'
  | 'jajan-sendiri'
  | 'jajan-neng'
  | 'kebutuhan-mingguan'
  | 'kebutuhan-bulanan'
  | 'kecantikan'

export type TxType = 'masuk' | 'keluar' | 'pindah'

// account/category are free strings: real imported data (Realbyte) carries
// accounts and categories beyond the fixed Aliran sets below. AccountId /
// CategoryId remain the known subset the Aliran 3D scene is built around.
export interface Transaction {
  id: string
  type: TxType
  amount: number // IDR, always positive integer
  category?: string // required for masuk/keluar
  account: string // source account (or "from" for pindah)
  toAccount?: string // for pindah only
  label: string // "Warung Tegal", "Gaji", "Alfamart"
  note?: string
  timestamp: Date
}

export interface SourceBucket {
  accountId: AccountId
  total: number
  transactionCount: number
}

export interface DestinationBucket {
  categoryId: CategoryId
  total: number
  transactionCount: number
}

export interface SceneBuckets {
  sources: SourceBucket[]
  destinations: DestinationBucket[]
  transactions: Transaction[] // chronologically sorted, for particle spawning
  periodStart: Date
  periodEnd: Date
  totalIncome: number
  totalExpense: number
}

// Display labels — UI never invents category text (3A rule 7: no metaphor copy).
export const ACCOUNT_LABELS: Record<AccountId, string> = {
  tunai: 'Tunai',
  bjb: 'BJB',
  blue: 'Blue',
  beloved: 'Beloved',
  gopay: 'GoPay',
  'rdn-permata': 'RDN Permata',
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  makan: 'Makan',
  lainnya: 'Lainnya',
  pendidikan: 'Pendidikan',
  rokok: 'rokok',
  'jajan-sendiri': 'jajan sendiri',
  'jajan-neng': 'jajan neng',
  'kebutuhan-mingguan': 'kebutuhan mingguan',
  'kebutuhan-bulanan': 'kebutuhan bulanan',
  kecantikan: 'kecantikan',
}

// Look up a display label, falling back to the raw value for accounts/categories
// outside the known Aliran sets (real imported data is already human-readable).
export function accountLabel(id: string): string {
  return (ACCOUNT_LABELS as Record<string, string>)[id] ?? id
}

export function categoryLabel(id: string): string {
  return (CATEGORY_LABELS as Record<string, string>)[id] ?? id
}
