// Category manager — relocated from Runway's old Kelola sheet (see
// docs/superpowers/specs/2026-07-16-aset-import-aliran-cleanup-design.md).
// Add/edit/remove categories inline; kind (masuk/keluar) toggle per row.
// Persists live via useCatalogStore.

import { useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import type { CategoryKind } from '../../data/catalog'
import { useCatalogStore } from '../../data/catalogStore'

const inputBase =
  'rounded-md border border-kanal-line bg-kanal-surf px-2 py-1.5 text-[14px] text-kanal-fg focus:border-kanal-teal focus:outline-none'

function KindToggle({
  kind,
  onChange,
}: {
  kind: CategoryKind
  onChange: (k: CategoryKind) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(kind === 'keluar' ? 'masuk' : 'keluar')}
      className={`flex-none rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
        kind === 'masuk'
          ? 'border-kanal-teal-bd bg-kanal-teal-tint text-kanal-teal'
          : 'border-kanal-exp-bd bg-kanal-exp-tint text-kanal-exp'
      }`}
      aria-label={`Jenis: ${kind === 'masuk' ? 'pemasukan' : 'pengeluaran'}`}
    >
      {kind === 'masuk' ? 'masuk' : 'keluar'}
    </button>
  )
}

export function CategoryManager() {
  const categories = useCatalogStore((s) => s.categories)
  const updateCategory = useCatalogStore((s) => s.updateCategory)
  const removeCategory = useCatalogStore((s) => s.removeCategory)
  const addCategory = useCatalogStore((s) => s.addCategory)

  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<CategoryKind>('keluar')

  const add = () => {
    const name = newName.trim()
    if (!name) return
    addCategory(name, newKind)
    setNewName('')
  }

  return (
    <div className="flex flex-col">
      {categories.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-2 border-t border-kanal-line py-2 first:border-t-0"
        >
          <input
            value={c.name}
            onChange={(e) => updateCategory(c.id, { name: e.target.value })}
            className={`${inputBase} min-w-0 flex-1`}
            aria-label="Nama kategori"
          />
          <KindToggle
            kind={c.kind}
            onChange={(k) => updateCategory(c.id, { kind: k })}
          />
          <button
            type="button"
            onClick={() => removeCategory(c.id)}
            aria-label={`Hapus ${c.name}`}
            className="flex-none p-1.5 text-kanal-fg3 transition-transform active:scale-90 hover:text-kanal-exp focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
          >
            <Trash size={16} />
          </button>
        </div>
      ))}

      <div className="mt-2 flex items-center gap-2 border-t border-kanal-line pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Kategori baru"
          className={`${inputBase} min-w-0 flex-1 placeholder:text-kanal-fg4`}
          aria-label="Nama kategori baru"
        />
        <KindToggle kind={newKind} onChange={setNewKind} />
        <button
          type="button"
          onClick={add}
          aria-label="Tambah kategori"
          className="flex-none rounded-md border border-kanal-teal-bd bg-kanal-teal-tint p-1.5 text-kanal-teal transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
