// IndexedDB (Dexie) — the persistent home for transactions. Starts empty on
// every fresh install (no bundled personal data); the user either records
// transactions directly or imports their own Realbyte export via the in-app
// importer (Statistik → Runway → Kelola → Impor).

import Dexie, { type Table } from 'dexie'

export interface RawTx {
  id: string
  type: 'masuk' | 'keluar' | 'pindah'
  amount: number
  account: string
  category?: string
  toAccount?: string
  label: string
  note?: string
  timestamp: string
}

class KanalDB extends Dexie {
  transactions!: Table<RawTx, string>

  constructor() {
    super('kanal-db')
    this.version(1).stores({
      // indexed fields for period/scene queries; payload is the full RawTx
      transactions: 'id, timestamp, type, account, category',
    })
  }
}

export const db = new KanalDB()
