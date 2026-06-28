// Stage 3C development data — see KANAL_STAGE_3C_BRIEF.md §4.
// Stage 5 replaces this file with a Dexie hook; nothing else changes.
//
// Two layers, deliberately separate:
//   1. CANONICAL_* aggregates — the locked, screenshot-approved totals/counts
//      from "Kanal Statistik.dc.html". These drive static display (prism /
//      ridge heights, legends, info-panel headers) so the scene matches the
//      approved Stage 3B screens exactly.
//   2. MOCK_TRANSACTIONS — a ~26-item chronological sample that feeds the
//      animated particle layer (§5.9). Particles are a sampled visualization,
//      so this list need not re-sum to the canonical totals.

import type {
  AccountId,
  CategoryId,
  Transaction,
} from './types'

export const PERIOD_START = new Date(2026, 4, 25) // 25 Mei 2026
export const PERIOD_END = new Date(2026, 5, 26) // 26 Jun 2026

// ---- Canonical income per account (sums to Rp 3.915.000) ----------------
export const CANONICAL_SOURCES: Array<{
  accountId: AccountId
  total: number
  transactionCount: number
}> = [
  { accountId: 'bjb', total: 808266, transactionCount: 3 },
  { accountId: 'blue', total: 1350000, transactionCount: 2 },
  { accountId: 'tunai', total: 612000, transactionCount: 2 },
  { accountId: 'gopay', total: 884500, transactionCount: 2 },
  { accountId: 'beloved', total: 260234, transactionCount: 2 },
]

// ---- Canonical expense per category (sums to Rp 3.184.073) ---------------
export const CANONICAL_DESTINATIONS: Array<{
  categoryId: CategoryId
  total: number
  transactionCount: number
}> = [
  { categoryId: 'makan', total: 808266, transactionCount: 14 },
  { categoryId: 'lainnya', total: 612450, transactionCount: 9 },
  { categoryId: 'pendidikan', total: 508100, transactionCount: 6 },
  { categoryId: 'rokok', total: 423500, transactionCount: 18 },
  { categoryId: 'jajan-sendiri', total: 358200, transactionCount: 11 },
  { categoryId: 'jajan-neng', total: 287330, transactionCount: 8 },
  { categoryId: 'kebutuhan-mingguan', total: 186227, transactionCount: 4 },
]

export const CANONICAL_TOTAL_INCOME = CANONICAL_SOURCES.reduce(
  (a, s) => a + s.total,
  0,
) // 3.915.000

export const CANONICAL_TOTAL_EXPENSE = CANONICAL_DESTINATIONS.reduce(
  (a, d) => a + d.total,
  0,
) // 3.184.073

const at = (m: number, d: number, h = 12, min = 0) =>
  new Date(2026, m, d, h, min)

// ---- Chronological particle sample (26 transactions) --------------------
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't01', type: 'keluar', amount: 18500, category: 'makan', account: 'tunai', label: 'Warteg Bu Sri', timestamp: at(4, 25, 12, 15) },
  { id: 't02', type: 'keluar', amount: 23500, category: 'rokok', account: 'tunai', label: 'Indomaret', timestamp: at(4, 26, 8, 40) },
  { id: 't03', type: 'keluar', amount: 15000, category: 'jajan-neng', account: 'gopay', label: 'Transfer GoPay', timestamp: at(4, 27, 16, 5) },
  { id: 't04', type: 'keluar', amount: 184073, category: 'kebutuhan-mingguan', account: 'tunai', label: 'Alfamart', note: 'Belanja mingguan.', timestamp: at(4, 28, 10, 20) },
  { id: 't05', type: 'keluar', amount: 22000, category: 'jajan-sendiri', account: 'gopay', label: 'Kopi Janji', timestamp: at(4, 30, 15, 30) },
  { id: 't06', type: 'keluar', amount: 38000, category: 'makan', account: 'bjb', label: 'Nasi Padang', timestamp: at(5, 1, 13, 10) },
  { id: 't07', type: 'masuk', amount: 100000, account: 'beloved', label: 'Titipan', timestamp: at(5, 2, 9, 0) },
  { id: 't08', type: 'masuk', amount: 100000, category: undefined, account: 'bjb', label: 'Refund', timestamp: at(5, 3, 11, 0) },
  { id: 't09', type: 'keluar', amount: 47000, category: 'pendidikan', account: 'bjb', label: 'Fotokopi modul', timestamp: at(5, 4, 9, 40) },
  { id: 't10', type: 'keluar', amount: 22000, category: 'makan', account: 'gopay', label: 'Nasi goreng', timestamp: at(5, 5, 19, 30) },
  { id: 't11', type: 'keluar', amount: 23500, category: 'rokok', account: 'tunai', label: 'Warung rokok', timestamp: at(5, 6, 20, 0) },
  { id: 't12', type: 'keluar', amount: 27000, category: 'jajan-neng', account: 'gopay', label: 'Martabak neng', timestamp: at(5, 7, 21, 0) },
  { id: 't13', type: 'keluar', amount: 150000, category: 'pendidikan', account: 'bjb', label: 'Fotokopi & buku', note: 'Modul semester.', timestamp: at(5, 8, 9, 40) },
  { id: 't14', type: 'masuk', amount: 800000, account: 'gopay', label: 'Transfer masuk', timestamp: at(5, 9, 10, 0) },
  { id: 't15', type: 'keluar', amount: 35500, category: 'makan', account: 'tunai', label: 'Warteg', timestamp: at(5, 10, 12, 45) },
  { id: 't16', type: 'keluar', amount: 23500, category: 'rokok', account: 'tunai', label: 'Indomaret', timestamp: at(5, 11, 19, 5) },
  { id: 't17', type: 'keluar', amount: 28000, category: 'makan', account: 'tunai', label: 'Bakso Malang', timestamp: at(5, 12, 12, 30) },
  { id: 't18', type: 'masuk', amount: 450000, account: 'blue', label: 'Bonus', timestamp: at(5, 12, 14, 0) },
  { id: 't19', type: 'keluar', amount: 47247, category: 'makan', account: 'tunai', label: 'Warung Tegal', note: 'Nasi + ayam + es teh.', timestamp: at(5, 14, 12, 30) },
  { id: 't20', type: 'keluar', amount: 18000, category: 'jajan-sendiri', account: 'gopay', label: 'Es kopi susu', timestamp: at(5, 15, 16, 20) },
  { id: 't21', type: 'masuk', amount: 84500, account: 'gopay', label: 'Cashback', timestamp: at(5, 18, 11, 30) },
  { id: 't22', type: 'masuk', amount: 412000, account: 'tunai', label: 'Setor tunai', timestamp: at(5, 20, 10, 0) },
  { id: 't23', type: 'keluar', amount: 52000, category: 'lainnya', account: 'bjb', label: 'Pulsa & data', timestamp: at(5, 21, 18, 0) },
  { id: 't24', type: 'keluar', amount: 61500, category: 'kebutuhan-mingguan', account: 'tunai', label: 'Alfamart', timestamp: at(5, 22, 17, 15) },
  { id: 't25', type: 'masuk', amount: 480266, category: undefined, account: 'bjb', label: 'Gaji', note: 'Gaji bulanan.', timestamp: at(5, 24, 9, 0) },
  { id: 't26', type: 'masuk', amount: 900000, account: 'blue', label: 'Transfer masuk', timestamp: at(5, 24, 13, 30) },
]
