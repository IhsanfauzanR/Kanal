// Runway asset buckets (§6.2), now computed from the editable catalog accounts.
// Balances and the account list itself are user-managed (see catalogStore).

import { accountInRunway, type Account, type AccountGroup } from '../../../data/catalog'

export type AssetBucket = 'tunai' | 'tunai-bank' | 'semua'

export const ASSET_BUCKETS: Array<{ key: AssetBucket; label: string }> = [
  { key: 'tunai', label: 'Tunai' },
  { key: 'tunai-bank', label: 'Tunai + Bank' },
  { key: 'semua', label: 'Semua likuid' },
]

const GROUPS_FOR: Record<'tunai' | 'tunai-bank', AccountGroup[]> = {
  tunai: ['tunai'],
  'tunai-bank': ['tunai', 'bank'],
}

// Archived accounts never count. The two presets sum by group; "Semua likuid"
// honours each account's "Sertakan dalam runway" toggle (Aset §4.2).
export function assetTotal(bucket: AssetBucket, accounts: Account[]): number {
  const live = (accounts ?? []).filter((a) => !a.archived)
  if (bucket === 'semua') {
    return live.reduce((sum, a) => (accountInRunway(a) ? sum + (a.balance || 0) : sum), 0)
  }
  const groups = GROUPS_FOR[bucket]
  return live.reduce(
    (sum, a) => (groups.includes(a.group) ? sum + (a.balance || 0) : sum),
    0,
  )
}
