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
