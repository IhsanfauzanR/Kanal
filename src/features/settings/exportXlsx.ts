// Export all transactions as .xlsx (Pengaturan → Data → Ekspor). Columns
// mirror the Realbyte "Pengelola Keuangan" export, which is also exactly what
// Kanal's own importer reads — so an exported file round-trips: it can be
// re-imported into Kanal (backup/restore, moving devices) and stays familiar
// to anyone coming from Realbyte. SheetJS is lazy-loaded here (same chunk the
// importer uses), so export costs nothing on normal app loads.

import type { Transaction } from '../statistik/aliran/data/types'

export type ExportCell = string | number

const pad = (n: number) => String(n).padStart(2, '0')

// "Aset" holds the account; for transfers "Kategori" holds the destination
// account and the type reads "Transfer keluar" — Realbyte's single-sided
// transfer convention, which parseRealbyte.ts expects.
export const EXPORT_HEADER: ExportCell[] = [
  'Tanggal',
  'Aset',
  'Kategori',
  'Catatan',
  'IDR',
  'Pendapatan/Pengeluaran',
  'Deskripsi',
  'Mata uang',
  'Total',
]

const TYPE_LABEL: Record<Transaction['type'], string> = {
  keluar: 'Pengeluaran',
  masuk: 'Pendapatan',
  pindah: 'Transfer keluar',
}

export function buildExportRows(transactions: Transaction[]): ExportCell[][] {
  const rows = [...transactions]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((t) => {
      const d = t.timestamp
      const tanggal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours(),
      )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      const kategori = t.type === 'pindah' ? (t.toAccount ?? '') : (t.category ?? '')
      return [
        tanggal,
        t.account,
        kategori,
        t.label,
        t.amount,
        TYPE_LABEL[t.type],
        t.note ?? '',
        'IDR',
        t.amount,
      ]
    })
  return [EXPORT_HEADER, ...rows]
}

export async function exportTransactionsXlsx(transactions: Transaction[]): Promise<void> {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet(buildExportRows(transactions))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kanal')
  const d = new Date()
  XLSX.writeFile(wb, `kanal-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`)
}
