import { describe, it, expect } from 'vitest'
import { deriveDeltas } from './useLiveAccounts'
import type { Account } from './catalog'
import type { Transaction } from '../features/statistik/aliran/data/types'

describe('deriveDeltas', () => {
  it('counts historical transactions for an account anchored at epoch (the import fix)', () => {
    const accounts: Account[] = [
      { id: 'acc-1', name: 'Tunai Baru', group: 'ewallet', balance: 0, anchorAt: 0 },
    ]
    const transactions: Transaction[] = [
      {
        id: 'imp0000',
        type: 'masuk',
        amount: 100000,
        account: 'Tunai Baru',
        label: 'Gaji',
        timestamp: new Date('2025-01-15T09:00:00'),
      },
      {
        id: 'imp0001',
        type: 'keluar',
        amount: 30000,
        account: 'Tunai Baru',
        label: 'Jajan',
        timestamp: new Date('2025-01-16T09:00:00'),
      },
    ]

    const deltas = deriveDeltas(accounts, transactions)
    expect(deltas.get('acc-1')).toBe(70000)
  })

  it('ignores transactions at or before the anchor (regression guard: this is what broke when import anchored at "now")', () => {
    const accounts: Account[] = [
      { id: 'acc-1', name: 'Tunai Baru', group: 'ewallet', balance: 0, anchorAt: Date.now() },
    ]
    const transactions: Transaction[] = [
      {
        id: 'imp0000',
        type: 'masuk',
        amount: 100000,
        account: 'Tunai Baru',
        label: 'Gaji',
        timestamp: new Date('2025-01-15T09:00:00'),
      },
    ]

    const deltas = deriveDeltas(accounts, transactions)
    expect(deltas.get('acc-1')).toBeUndefined()
  })
})
