import { describe, it, expect } from 'vitest'
import { createBackup, parseBackup, BACKUP_VERSION } from './backup'
import type { RawTx } from './db'
import type { Account, Category } from './catalog'

const sampleState = {
  transactions: [
    {
      id: 'tx-1',
      type: 'keluar' as const,
      amount: 10000,
      account: 'Tunai',
      category: 'Makanan',
      label: 'Nasi goreng',
      timestamp: '2026-07-01T12:00:00',
    },
  ] satisfies RawTx[],
  accounts: [
    { id: 'acc-1', name: 'Tunai', group: 'tunai' as const, balance: 50000, anchorAt: 0 },
  ] satisfies Account[],
  categories: [
    { id: 'cat-1', name: 'Makanan', kind: 'keluar' as const },
  ] satisfies Category[],
  theme: 'dark' as const,
}

describe('createBackup', () => {
  it('captures all four data slices plus a version and timestamp', () => {
    const backup = createBackup(sampleState)
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(backup.transactions).toEqual(sampleState.transactions)
    expect(backup.accounts).toEqual(sampleState.accounts)
    expect(backup.categories).toEqual(sampleState.categories)
    expect(backup.theme).toBe('dark')
    expect(() => new Date(backup.exportedAt).toISOString()).not.toThrow()
  })
})

describe('parseBackup', () => {
  it('round-trips a backup created by createBackup', () => {
    const backup = createBackup(sampleState)
    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)))
    expect(parsed).toEqual(backup)
  })

  it('rejects a plain object missing the expected shape', () => {
    expect(parseBackup({ foo: 'bar' })).toBeNull()
  })

  it('rejects null, arrays, and primitives', () => {
    expect(parseBackup(null)).toBeNull()
    expect(parseBackup([])).toBeNull()
    expect(parseBackup('not a backup')).toBeNull()
    expect(parseBackup(42)).toBeNull()
  })

  it('rejects a mismatched version', () => {
    const backup = createBackup(sampleState)
    expect(parseBackup({ ...backup, version: 99 })).toBeNull()
  })

  it('rejects an invalid theme value', () => {
    const backup = createBackup(sampleState)
    expect(parseBackup({ ...backup, theme: 'purple' })).toBeNull()
  })
})
