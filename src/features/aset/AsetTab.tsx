// Aset — grouped account view (Stage Final §4.2) + category manager. Total-
// likuid hero, accounts grouped by kind with subtotals, a sticky "+ Tambah
// akun", and the account editor / archive sheets on the Akun segment; a
// relocated category CRUD (moved from Runway's old Kelola sheet) on the
// Kategori segment. Accounts are word-first rows (no monogram — that's
// reserved for transactions). Renders in the phone frame on every breakpoint,
// so this is the single-column form.

import { useMemo, useState } from 'react'
import { ChartLine, DotsThreeVertical, Plus } from '@phosphor-icons/react'
import {
  ACCOUNT_GROUP_HEADER,
  ACCOUNT_GROUPS,
  GROUP_SUBTITLE,
  type Account,
  type AccountGroup,
} from '../../data/catalog'
import { useLiveAccounts } from '../../data/useLiveAccounts'
import { dots } from '../statistik/shared/format'
import { AccountEditSheet, type EditTarget } from './AccountEditSheet'
import { ArchiveSheet } from './ArchiveSheet'
import { CategoryManager } from './CategoryManager'

const LIQUID_GROUPS: AccountGroup[] = ['tunai', 'bank', 'ewallet', 'tabungan']
const ASSET_GROUPS: AccountGroup[] = ['tunai', 'bank', 'ewallet', 'tabungan', 'kartu-prabayar']

type Segment = 'akun' | 'kategori'

// "Rp 157.000" / "−Rp 12.000" — balances can go negative once they track
// transactions, so the sign is explicit.
const money = (n: number) => `${n < 0 ? '−' : ''}Rp ${dots(n)}`

export function AsetTab() {
  // Balances shown here are live: anchor + transaction deltas.
  const accounts = useLiveAccounts()
  const [segment, setSegment] = useState<Segment>('akun')
  const [target, setTarget] = useState<EditTarget | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [tip, setTip] = useState(false)

  const live = useMemo(() => accounts.filter((a) => !a.archived), [accounts])

  const { totalLikuid, asetGross, liabilitas, grouped } = useMemo(() => {
    let likuid = 0
    let gross = 0
    let liab = 0
    for (const a of live) {
      const bal = a.balance || 0
      if (LIQUID_GROUPS.includes(a.group)) likuid += bal
      if (ASSET_GROUPS.includes(a.group)) gross += bal
      if (a.group === 'kartu') liab += bal
    }
    const byGroup = ACCOUNT_GROUPS.map((g) => ({
      group: g.key,
      accts: live.filter((a) => a.group === g.key),
    })).filter((g) => g.accts.length > 0)
    return { totalLikuid: likuid, asetGross: gross, liabilitas: liab, grouped: byGroup }
  }, [live])

  const isEmpty = accounts.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* top bar */}
      <div className="relative flex items-center justify-between px-[22px] pb-1 pt-2">
        <span className="text-xl font-medium tracking-[-0.01em] text-kanal-fg">Aset</span>
        {segment === 'akun' && (
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => {
                setTip(true)
                window.setTimeout(() => setTip(false), 2200)
              }}
              aria-label="Riwayat aset"
              className="flex p-1.5 text-kanal-fg2 transition-transform active:scale-90"
            >
              <ChartLine size={20} />
            </button>
            <button
              type="button"
              onClick={() => setArchiveOpen(true)}
              aria-label="Akun terarsip"
              className="flex p-1.5 text-kanal-fg2 transition-transform active:scale-90"
            >
              <DotsThreeVertical size={20} weight="bold" />
            </button>
          </div>
        )}
        {tip && (
          <div
            role="status"
            className="absolute right-[22px] top-[42px] z-10 rounded-lg border border-kanal-line bg-kanal-surf2 px-3 py-1.5 text-xs text-kanal-fg2"
          >
            Riwayat aset akan datang setelah v1.0
          </div>
        )}
      </div>

      {/* segment tabs */}
      <div className="flex items-center gap-2 px-[22px] pb-2 pt-1">
        {(['akun', 'kategori'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSegment(s)}
            aria-pressed={segment === s}
            className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
              segment === s ? 'bg-kanal-surf2 text-kanal-fg' : 'text-kanal-fg3'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {segment === 'kategori' ? (
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-[22px] pb-6 pt-1">
          <CategoryManager />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10">
          <p className="text-center text-[0.9375rem] text-kanal-fg2">Belum ada akun tercatat.</p>
          <button
            type="button"
            onClick={() => setTarget({ mode: 'add' })}
            className="rounded-xl bg-kanal-teal px-5 py-2.5 text-sm font-medium text-kanal-teal-on transition-transform active:scale-[0.98]"
          >
            Tambah akun pertama
          </button>
        </div>
      ) : (
        <>
          <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
            {/* hero */}
            <div className="px-[22px] pt-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-kanal-fg3">
                Total likuid
              </div>
              <div className="tnum mt-3 flex items-baseline gap-2.5">
                <span className="font-mono text-[1.05rem] text-kanal-fg2">
                  {totalLikuid < 0 ? '−Rp' : 'Rp'}
                </span>
                <span className="font-mono text-[2.75rem] font-normal leading-none tracking-[-0.03em] text-kanal-fg">
                  {dots(totalLikuid)}
                </span>
              </div>
              <div className="mt-3 font-mono text-[11px] text-kanal-fg3">
                Aset {money(asetGross)} · Liabilitas {money(liabilitas)}
                {liabilitas > 0 && (
                  <span className="text-kanal-fg3"> · bersih {money(asetGross - liabilitas)}</span>
                )}
              </div>
            </div>

            <div className="mx-[22px] mt-[22px] h-px bg-kanal-line" />

            {/* groups */}
            <div className="px-[22px] pb-4">
              {grouped.map((g) => (
                <AccountGroupSection
                  key={g.group}
                  group={g.group}
                  accts={g.accts}
                  onEdit={(account) => setTarget({ mode: 'edit', account })}
                />
              ))}
            </div>
          </div>

          {/* sticky add */}
          <div className="flex-none border-t border-kanal-line bg-kanal-bg px-[22px] pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={() => setTarget({ mode: 'add' })}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-kanal-teal text-[15px] font-medium text-kanal-teal-on transition-transform active:scale-[0.98]"
            >
              <Plus size={17} />
              Tambah akun
            </button>
          </div>
        </>
      )}

      <AccountEditSheet target={target} onClose={() => setTarget(null)} />
      <ArchiveSheet open={archiveOpen} onClose={() => setArchiveOpen(false)} />
    </div>
  )
}

function AccountGroupSection({
  group,
  accts,
  onEdit,
}: {
  group: AccountGroup
  accts: Account[]
  onEdit: (a: Account) => void
}) {
  const subtotal = accts.reduce((s, a) => s + (a.balance || 0), 0)
  return (
    <div className="mt-[18px]">
      <div className="flex items-center justify-between border-b border-kanal-line pb-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-kanal-fg3">
          {ACCOUNT_GROUP_HEADER[group]}
        </span>
        <span className="tnum font-mono text-[0.8125rem] text-kanal-fg2">{money(subtotal)}</span>
      </div>
      {accts.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onEdit(a)}
          className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-[9px] border-t border-kanal-line px-2 py-3.5 text-left transition-[background,transform] duration-150 first:border-t-0 active:scale-[0.99] hover:bg-kanal-fg/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kanal-teal"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[0.9375rem] font-medium text-kanal-fg">{a.name}</span>
            {(a.subtitle || GROUP_SUBTITLE[group]) && (
              <span className="truncate font-mono text-[10px] text-kanal-fg3">
                {a.subtitle || GROUP_SUBTITLE[group]}
              </span>
            )}
          </span>
          <span
            className={`tnum flex-none font-mono text-[0.9375rem] ${
              (a.balance || 0) < 0 ? 'text-kanal-exp' : 'text-kanal-teal'
            }`}
          >
            {money(a.balance || 0)}
          </span>
        </button>
      ))}
    </div>
  )
}
