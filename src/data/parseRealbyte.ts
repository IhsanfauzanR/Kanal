// Browser-side parser for a Realbyte "Pengelola Keuangan" export — the TS port
// of scripts/convert-realbyte.py, used by the in-app importer. Takes the raw
// rows from SheetJS (header:1, raw:true) and SheetJS's SSF (for Excel serial
// dates) and produces normalized RawTx records.

import type { RawTx } from './db'

export type Cell = string | number | boolean | Date | null | undefined

const TYPE_MAP: Record<string, RawTx['type']> = {
  Pengeluaran: 'keluar',
  Pendapatan: 'masuk',
  'Transfer keluar': 'pindah',
  'Transfer masuk': 'pindah',
}

// Strip emoji (Realbyte prefixes category names with them) — pictographs plus
// the variation selector and zero-width joiner used in compound emoji.
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu

const clean = (v: Cell) => String(v ?? '').replace(EMOJI, '').trim()
const pad = (n: number) => String(n).padStart(2, '0')

interface SSF {
  parse_date_code: (
    v: number,
  ) => { y: number; m: number; d: number; H: number; M: number; S: number } | null
}

function parseDate(v: Cell, ssf: SSF): string {
  if (v == null) return ''
  if (typeof v === 'number') {
    const d = ssf.parse_date_code(v)
    if (d) return `${d.y}-${pad(d.m)}-${pad(d.d)}T${pad(d.H)}:${pad(d.M)}:${pad(d.S)}`
  }
  if (v instanceof Date) {
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}T${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`
  }
  return String(v).trim().replace(' ', 'T')
}

export interface ParseResult {
  rows: RawTx[]
  skipped: number
  range: { from: string; to: string } | null
}

export function parseRealbyte(rows: Cell[][], ssf: SSF): ParseResult {
  if (!rows || rows.length < 2) return { rows: [], skipped: 0, range: null }

  // "Aset" appears twice (account name + numeric repeat) — keep first.
  const header = rows[0].map((c) => clean(c))
  const idx: Record<string, number> = {}
  header.forEach((h, i) => {
    if (!(h in idx)) idx[h] = i
  })
  const col = (row: Cell[], name: string): Cell =>
    idx[name] != null ? row[idx[name]] : null

  const out: RawTx[] = []
  let skipped = 0

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.every((c) => c == null || c === '')) continue

    const kind = TYPE_MAP[String(col(row, 'Pendapatan/Pengeluaran') ?? '').trim()]
    if (!kind) {
      skipped++
      continue
    }
    const amountRaw = col(row, 'IDR') ?? col(row, 'Total')
    const amount = Math.round(Number(amountRaw))
    if (!Number.isFinite(amount)) {
      skipped++
      continue
    }

    const account = String(col(row, 'Aset') ?? '').trim()
    const kategori = clean(col(row, 'Kategori'))
    const catatan = String(col(row, 'Catatan') ?? '').trim()
    const deskripsi = String(col(row, 'Deskripsi') ?? '').trim()
    const timestamp = parseDate(col(row, 'Tanggal'), ssf)
    const isTransfer = kind === 'pindah'
    const label = catatan || deskripsi || (isTransfer ? 'Transfer' : kategori || 'Transaksi')

    out.push({
      id: '', // assigned after sort
      type: kind,
      amount,
      account,
      timestamp,
      label,
      ...(isTransfer ? { toAccount: kategori } : { category: kategori }),
      ...(deskripsi && deskripsi !== label ? { note: deskripsi } : {}),
    })
  }

  out.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  out.forEach((t, i) => {
    t.id = `imp${String(i).padStart(4, '0')}`
  })

  return {
    rows: out,
    skipped,
    range: out.length
      ? { from: out[0].timestamp.slice(0, 10), to: out[out.length - 1].timestamp.slice(0, 10) }
      : null,
  }
}
