// Bottom tab bar (Stage Final). Four destinations — Beranda, Catatan, Statistik,
// Aset — as a frosted bar pinned to the foot of the phone frame. The active tab
// carries a small teal dot + full-strength label/icon; the rest sit quiet. Icon
// is decorative (the label names it), so color is not the sole signal.

import { House, ListBullets, ChartLineUp, Wallet, type Icon } from '@phosphor-icons/react'
import { useUiStore, type Tab } from './uiStore'

const TABS: Array<{ key: Tab; label: string; icon: Icon }> = [
  { key: 'beranda', label: 'Beranda', icon: House },
  { key: 'catatan', label: 'Catatan', icon: ListBullets },
  { key: 'statistik', label: 'Statistik', icon: ChartLineUp },
  { key: 'aset', label: 'Aset', icon: Wallet },
]

export function BottomNav() {
  const tab = useUiStore((s) => s.tab)
  const setTab = useUiStore((s) => s.setTab)

  return (
    <nav
      aria-label="Navigasi utama"
      className="flex flex-none items-start border-t border-kanal-line bg-kanal-glass pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl"
    >
      {TABS.map(({ key, label, icon: Ico }) => {
        const active = tab === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={active ? 'page' : undefined}
            className="relative flex h-[52px] flex-1 flex-col items-center gap-1 pt-2 transition-transform active:scale-95 focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className={`absolute top-0 h-1 w-1 rounded-full transition-colors ${active ? 'bg-kanal-teal' : 'bg-transparent'}`}
            />
            <Ico size={21} weight={active ? 'fill' : 'regular'} className={active ? 'text-kanal-fg' : 'text-kanal-fg3'} />
            <span className={`text-[11px] ${active ? 'text-kanal-fg' : 'text-kanal-fg3'}`}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
