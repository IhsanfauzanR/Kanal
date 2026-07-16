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
