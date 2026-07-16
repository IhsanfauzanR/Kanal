import { describe, it, expect } from 'vitest'
import { computeNewAccountsFromImport } from './catalogStore'
import type { Account } from './catalog'
import type { RawTx } from './db'

describe('computeNewAccountsFromImport', () => {
  it('anchors newly-created accounts at epoch, not "now"', () => {
    const existing: Account[] = []
    const rows: RawTx[] = [
      {
        id: 'imp0000',
        type: 'masuk',
        amount: 100000,
        account: 'Tunai Baru',
        label: 'Gaji',
        timestamp: '2025-01-15T09:00:00',
      },
    ]

    const created = computeNewAccountsFromImport(existing, rows)

    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({
      name: 'Tunai Baru',
      group: 'ewallet',
      balance: 0,
      anchorAt: 0,
      archived: false,
    })
  })

  it('does not duplicate an account name already in the catalog', () => {
    const existing: Account[] = [
      { id: 'acc-1', name: 'Tunai', group: 'tunai', balance: 50000, anchorAt: 0 },
    ]
    const rows: RawTx[] = [
      {
        id: 'imp0000',
        type: 'keluar',
        amount: 10000,
        account: 'Tunai',
        label: 'Jajan',
        timestamp: '2025-01-15T09:00:00',
      },
    ]

    expect(computeNewAccountsFromImport(existing, rows)).toHaveLength(0)
  })

  it('also creates the counterpart account from a transfer row', () => {
    const existing: Account[] = []
    const rows: RawTx[] = [
      {
        id: 'imp0000',
        type: 'pindah',
        amount: 50000,
        account: 'Blue',
        toAccount: 'Dana',
        label: 'Transfer',
        timestamp: '2025-01-15T09:00:00',
      },
    ]

    const created = computeNewAccountsFromImport(existing, rows)
    expect(created.map((a) => a.name).sort()).toEqual(['Blue', 'Dana'])
  })
})
