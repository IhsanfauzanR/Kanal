// Pengaturan (Stage Final §4.5) — opened from the Beranda gear. Theme choice
// (Gelap / Terang / Ikuti sistem) and a small iOS "add to home screen" helper.
// Deliberately sparse: Kanal has no accounts, no sync, nothing to configure but
// the surface it shows on.

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, Check, Export, Plus } from '@phosphor-icons/react'
import { BottomSheet } from '../../components/BottomSheet'
import { useUiStore } from '../../app/uiStore'
import { useThemeStore, type ThemeChoice } from '../../data/themeStore'

const THEME_OPTIONS: Array<{ key: ThemeChoice; label: string }> = [
  { key: 'dark', label: 'Gelap' },
  { key: 'light', label: 'Terang' },
  { key: 'system', label: 'Ikuti sistem' },
]

export function PengaturanSheet() {
  const open = useUiStore((s) => s.settingsOpen)
  const close = useUiStore((s) => s.closeSettings)
  const choice = useThemeStore((s) => s.choice)
  const setChoice = useThemeStore((s) => s.setChoice)
  const [helpOpen, setHelpOpen] = useState(false)

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
