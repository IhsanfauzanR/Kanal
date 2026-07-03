// Archived accounts (Stage Final §4.2). A dim list with a Pulihkan action per
// row; balances are hidden while archived. Opened from the Aset three-dot menu.

import { BottomSheet } from '../../components/BottomSheet'
import { GROUP_SUBTITLE } from '../../data/catalog'
import { useCatalogStore } from '../../data/catalogStore'

interface ArchiveSheetProps {
  open: boolean
  onClose: () => void
}

export function ArchiveSheet({ open, onClose }: ArchiveSheetProps) {
  const accounts = useCatalogStore((s) => s.accounts)
  const restoreAccount = useCatalogStore((s) => s.restoreAccount)
  const archived = accounts.filter((a) => a.archived)

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="Akun terarsip" maxHeight="70%">
      <div className="px-[22px] pb-8 pt-1">
        <div className="text-[17px] font-medium text-kanal-fg">Akun terarsip</div>
        {archived.length === 0 ? (
          <p className="py-10 text-center text-sm text-kanal-fg3">Tidak ada akun terarsip.</p>
        ) : (
          <div className="mt-3">
            {archived.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between border-t border-kanal-line py-3.5 first:border-t-0"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[0.9375rem] text-kanal-fg3">{a.name}</span>
                  <span className="font-mono text-[10px] text-kanal-fg3">
                    {a.subtitle || GROUP_SUBTITLE[a.group]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => restoreAccount(a.id)}
                  className="rounded-[9px] border border-kanal-line px-3 py-1.5 text-[13px] font-medium text-kanal-fg2 transition-transform active:scale-[0.97]"
                >
                  Pulihkan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
