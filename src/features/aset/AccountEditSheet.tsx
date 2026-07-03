// Account editor (Stage Final §4.2) — add + edit share this sheet. Inline-edit
// name, a native numeric balance field (the device number pad opens on tap),
// the six-group selector, the "include in runway" toggle, and (edit only)
// archive / delete with a neutral confirm. Persists live through
// useCatalogStore.

import { useEffect, useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { ConfirmModal } from '../../components/ConfirmModal'
import {
  ACCOUNT_GROUPS,
  GROUP_RUNWAY_DEFAULT,
  accountInRunway,
  type Account,
  type AccountGroup,
} from '../../data/catalog'
import { useCatalogStore } from '../../data/catalogStore'
import { dots } from '../statistik/shared/format'

export type EditTarget = { mode: 'add' } | { mode: 'edit'; account: Account }

interface AccountEditSheetProps {
  target: EditTarget | null
  onClose: () => void
}

export function AccountEditSheet({ target, onClose }: AccountEditSheetProps) {
  const addAccount = useCatalogStore((s) => s.addAccount)
  const updateAccount = useCatalogStore((s) => s.updateAccount)
  const removeAccount = useCatalogStore((s) => s.removeAccount)
  const archiveAccount = useCatalogStore((s) => s.archiveAccount)

  const isEdit = target?.mode === 'edit'
  const open = target !== null

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [group, setGroup] = useState<AccountGroup>('tunai')
  const [runway, setRunway] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!target) return
    if (target.mode === 'edit') {
      const a = target.account
      setName(a.name)
      setAmount(String(a.balance || ''))
      setGroup(a.group)
      setRunway(accountInRunway(a))
    } else {
      setName('')
      setAmount('')
      setGroup('tunai')
      setRunway(GROUP_RUNWAY_DEFAULT.tunai)
    }
    setConfirmDelete(false)
  }, [target])

  // When the group changes on a fresh account, follow that group's runway default.
  const pickGroup = (g: AccountGroup) => {
    setGroup(g)
    if (!isEdit) setRunway(GROUP_RUNWAY_DEFAULT[g])
  }

  const valid = name.trim() !== ''
  const balance = parseInt(amount || '0', 10)

  const save = () => {
    if (!valid) return
    if (target?.mode === 'edit') {
      updateAccount(target.account.id, {
        name: name.trim(),
        balance,
        group,
        includeInRunway: runway,
      })
    } else {
      addAccount(name.trim(), group, balance, { includeInRunway: runway })
    }
    onClose()
  }

  const doArchive = () => {
    if (target?.mode === 'edit') archiveAccount(target.account.id)
    onClose()
  }

  const doDelete = () => {
    if (target?.mode === 'edit') removeAccount(target.account.id)
    setConfirmDelete(false)
    onClose()
  }

  const footer = (
    <div className="border-t border-kanal-line bg-kanal-bg px-[18px] pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        onClick={save}
        disabled={!valid}
        className={`h-[50px] w-full rounded-[13px] text-[15px] font-medium transition-transform active:scale-[0.98] ${
          valid ? 'bg-kanal-teal text-kanal-teal-on' : 'cursor-default bg-kanal-surf text-kanal-fg3'
        }`}
      >
        {isEdit ? 'Simpan' : 'Simpan akun'}
      </button>
    </div>
  )

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        ariaLabel={isEdit ? 'Ubah akun' : 'Tambah akun'}
        maxHeight="90%"
        showClose
        footer={footer}
      >
        <div className="px-[22px] pb-4 pt-1">
          {/* name */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama akun"
            aria-label="Nama akun"
            className="w-full border-b border-transparent bg-transparent pb-1 text-lg font-medium text-kanal-fg outline-none transition-colors placeholder:text-kanal-fg4 focus:border-kanal-line"
          />

          {/* balance — native numeric keypad opens on tap */}
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">Saldo</div>
          <div className="tnum mt-2.5 flex items-baseline gap-2">
            <span className="font-mono text-[1.1rem] text-kanal-fg3">Rp</span>
            <input
              value={amount ? dots(balance) : ''}
              onChange={(e) =>
                setAmount(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 12))
              }
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="0"
              aria-label="Saldo akun"
              className="min-w-0 flex-1 bg-transparent font-mono text-4xl font-normal tracking-[-0.02em] text-kanal-fg caret-kanal-teal outline-none placeholder:text-kanal-fg4"
            />
          </div>

          {/* group */}
          <div className="mb-2.5 mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-kanal-fg3">Kelompok</div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {ACCOUNT_GROUPS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => pickGroup(g.key)}
                className={`flex-none whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  group === g.key
                    ? 'border-kanal-teal-bd bg-kanal-teal-tint text-kanal-fg'
                    : 'border-kanal-line bg-kanal-surf text-kanal-fg2'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* runway toggle */}
          <div className="mt-5 flex items-center justify-between border-y border-kanal-line py-3">
            <span className="text-[15px] text-kanal-fg2">Sertakan dalam runway</span>
            <button
              type="button"
              role="switch"
              aria-checked={runway}
              aria-label="Sertakan dalam runway"
              onClick={() => setRunway((v) => !v)}
              className={`relative h-6 w-[42px] flex-none rounded-full transition-colors ${
                runway ? 'bg-kanal-teal' : 'bg-kanal-handle'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] ${
                  runway ? 'left-[20px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* edit-only actions */}
          {isEdit && (
            <div className="mt-[18px] flex gap-2">
              <button
                type="button"
                onClick={doArchive}
                className="flex-1 rounded-[11px] border border-kanal-line py-2.5 text-sm font-medium text-kanal-fg2 transition-transform active:scale-[0.98]"
              >
                Arsipkan akun
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex-1 rounded-[11px] border border-kanal-line py-2.5 text-sm font-medium text-kanal-exp transition-transform active:scale-[0.98]"
              >
                Hapus akun
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      <ConfirmModal
        open={confirmDelete}
        title={
          target?.mode === 'edit' ? `Hapus akun "${target.account.name}"?` : 'Hapus akun?'
        }
        body="Riwayat transaksi tetap tersimpan."
        confirmLabel="Hapus"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
