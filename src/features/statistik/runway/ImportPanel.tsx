// In-app importer (Stage 5). Pick a Realbyte .xlsx export → parse it in the
// browser (SheetJS is lazy-loaded only here, so it stays out of the initial
// bundle) → preview the count → replace the dataset in IndexedDB.

import { useState } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { useTxStore } from '../../../data/txStore'
import { useCatalogStore } from '../../../data/catalogStore'
import { parseRealbyte, type Cell, type ParseResult } from '../../../data/parseRealbyte'

type Status = 'idle' | 'parsing' | 'preview' | 'done' | 'importing' | 'error'

export function ImportPanel() {
  const replaceAll = useTxStore((s) => s.replaceAll)
  const syncCatalog = useCatalogStore((s) => s.syncFromTransactions)
  const currentCount = useTxStore((s) => s.transactions.length)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)

  const onFile = async (file: File) => {
    setStatus('parsing')
    setError('')
    setResult(null)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      // SheetJS logs benign "Bad uncompressed size" warnings for some xlsx zip
      // layouts (Realbyte's). The parse still succeeds — silence just those.
      const origError = console.error
      console.error = (...args: unknown[]) => {
        if (typeof args[0] === 'string' && args[0].includes('Bad uncompressed size')) return
        origError.apply(console, args)
      }
      let wb
      try {
        wb = XLSX.read(buf, { type: 'array' })
      } finally {
        console.error = origError
      }
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Cell[]>(ws, {
        header: 1,
        raw: true,
        defval: null,
      })
      const parsed = parseRealbyte(rows, XLSX.SSF)
      if (parsed.rows.length === 0) {
        setError('Tidak ada transaksi yang terbaca dari file ini.')
        setStatus('error')
        return
      }
      setResult(parsed)
      setStatus('preview')
    } catch {
      setError('Gagal membaca file. Pastikan ini ekspor Realbyte (.xlsx).')
      setStatus('error')
    }
  }

  const confirm = async () => {
    if (!result) return
    setStatus('importing')
    await replaceAll(result.rows)
    // New account/category names from the file become selectable everywhere.
    syncCatalog(result.rows)
    setStatus('done')
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] leading-relaxed text-kanal-fg2">
        Impor ekspor Realbyte (.xlsx). Seluruh data transaksi akan diganti
        dengan isi file.
      </p>
      <div className="font-mono text-[11px] text-kanal-fg3">
        Saat ini {currentCount} transaksi tersimpan.
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-dashed border-kanal-line bg-kanal-surf px-4 py-5 text-[13px] font-medium text-kanal-fg2 transition-colors hover:border-kanal-teal-bd">
        <UploadSimple size={16} />
        Pilih file .xlsx
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
            e.target.value = ''
          }}
        />
      </label>

      {status === 'parsing' && (
        <p className="text-[13px] text-kanal-fg3">Membaca file…</p>
      )}
      {status === 'error' && <p className="text-[13px] text-kanal-exp">{error}</p>}
      {status === 'importing' && (
        <p className="text-[13px] text-kanal-fg3">Menyimpan…</p>
      )}
      {status === 'done' && (
        <p className="text-[13px] text-kanal-teal">
          Berhasil — {currentCount} transaksi sekarang aktif.
        </p>
      )}

      {status === 'preview' && result && (
        <div className="flex flex-col gap-3 rounded-[12px] border border-kanal-line bg-kanal-surf p-3.5">
          <div className="tnum font-mono text-[12px] text-kanal-fg2">
            {result.rows.length} transaksi · {result.range?.from} →{' '}
            {result.range?.to}
            {result.skipped > 0 ? ` · ${result.skipped} dilewati` : ''}
          </div>
          <button
            type="button"
            onClick={confirm}
            className="self-start rounded-[10px] border border-kanal-teal-bd bg-kanal-teal-tint px-3.5 py-2 text-[13px] font-medium text-kanal-teal transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
          >
            Ganti dengan data ini
          </button>
        </div>
      )}
    </div>
  )
}
