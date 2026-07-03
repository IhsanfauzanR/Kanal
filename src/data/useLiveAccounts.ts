// Live account balances (Stage Final round 2). The stored balance is an anchor
// ("balance as of anchorAt"); the balance the app SHOWS is that anchor plus
// every transaction delta recorded after it:
//   masuk  → +amount to the account
//   keluar → −amount from the account
//   pindah → −amount from `account`, +amount to `toAccount`
// Deriving (instead of mutating a stored number per event) means edits,
// deletes, backdates and imports are always consistent — the balance is
// recomputed from truth every time. Matching is by account NAME, which is what
// transactions store.

import { useMemo } from 'react'
import type { Account } from './catalog'
import type { Transaction } from '../features/statistik/aliran/data/types'
import { useCatalogStore } from './catalogStore'
import { useTxStore } from './txStore'

// Per-account-id delta from transactions after each account's anchor.
export function deriveDeltas(
  accounts: Account[],
  transactions: Transaction[],
): Map<string, number> {
  const byName = new Map<string, { id: string; anchor: number }>()
  for (const a of accounts) {
    // No anchor (unmigrated edge) = static: nothing ever applies.
    byName.set(a.name, { id: a.id, anchor: a.anchorAt ?? Number.MAX_SAFE_INTEGER })
  }

  const deltas = new Map<string, number>()
  const apply = (name: string, ts: number, amount: number) => {
    const rec = byName.get(name)
    if (!rec || ts <= rec.anchor) return
    deltas.set(rec.id, (deltas.get(rec.id) ?? 0) + amount)
  }

  for (const t of transactions) {
    const ts = t.timestamp.getTime()
    if (t.type === 'masuk') {
      apply(t.account, ts, t.amount)
    } else if (t.type === 'keluar') {
      apply(t.account, ts, -t.amount)
    } else {
      apply(t.account, ts, -t.amount)
      if (t.toAccount) apply(t.toAccount, ts, t.amount)
    }
  }
  return deltas
}

// The catalog's accounts with `balance` replaced by the live derived value.
export function useLiveAccounts(): Account[] {
  const accounts = useCatalogStore((s) => s.accounts)
  const transactions = useTxStore((s) => s.transactions)

  return useMemo(() => {
    const deltas = deriveDeltas(accounts, transactions)
    if (deltas.size === 0) return accounts
    return accounts.map((a) => {
      const d = deltas.get(a.id)
      return d ? { ...a, balance: (a.balance || 0) + d } : a
    })
  }, [accounts, transactions])
}
