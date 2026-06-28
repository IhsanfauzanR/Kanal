// Shared bank layout — single source of truth for where each source prism and
// destination ridge sits, so particle flows (§5.9) land exactly on the banks.
// Mirrors the layout logic in Sources.tsx / Destinations.tsx (same canonical
// data + ordering), exposed as lookups for the particle system.

import {
  CANONICAL_DESTINATIONS,
  CANONICAL_SOURCES,
} from '../data/mockTransactions'
import type { AccountId, CategoryId } from '../data/types'
import { DESTINATIONS, SOURCES, heightForTotal } from './sceneConstants'

// §5.6 fixed order along Z: BJB, Blue, Tunai, GoPay, Beloved.
const ACCOUNT_ORDER: AccountId[] = ['bjb', 'blue', 'tunai', 'gopay', 'beloved']

// 7 evenly-spread Z anchors across the river depth (matches Destinations).
const DEST_Z = [-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7]

function centerOutPositions(n: number): number[] {
  const center = Math.floor(n / 2)
  const pos: number[] = [center]
  for (let k = 1; k < n; k++) {
    const off = Math.ceil(k / 2)
    pos[k] = center + (k % 2 === 1 ? -off : off)
  }
  return pos
}

export interface BankPoint {
  x: number
  y: number // top of the prism / ridge
  z: number
  height: number
}

const sourceMap = new Map<AccountId, BankPoint>()
ACCOUNT_ORDER.forEach((id, i) => {
  const total = CANONICAL_SOURCES.find((s) => s.accountId === id)?.total ?? 0
  const height = Math.max(0.3, heightForTotal(total))
  sourceMap.set(id, { x: SOURCES.x, y: height, z: SOURCES.zOffsets[i], height })
})

const destMap = new Map<CategoryId, BankPoint>()
{
  const sorted = [...CANONICAL_DESTINATIONS].sort((a, b) => b.total - a.total)
  const positions = centerOutPositions(sorted.length)
  sorted.forEach((b, rank) => {
    const height = Math.max(0.4, heightForTotal(b.total))
    destMap.set(b.categoryId, {
      x: DESTINATIONS.x,
      y: height,
      z: DEST_Z[positions[rank]] ?? 0,
      height,
    })
  })
}

export function sourcePoint(id: AccountId): BankPoint | undefined {
  return sourceMap.get(id)
}

export function destinationPoint(id: CategoryId): BankPoint | undefined {
  return destMap.get(id)
}
