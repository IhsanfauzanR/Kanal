// 2D Sankey fallback (§10) — the reduced-motion / chart-bar alternative to the
// 3D scene. Real d3-sankey layout of accounts (left) → expense categories
// (right), summed from the active period's transactions. To stay legible it
// shows the top categories and folds the rest into "Kategori lain" (this is a
// summary — "tampilan ringkas"). Frost ribbons, mono labels, accessible static.

import { useMemo } from 'react'
import { sankey, sankeyLinkHorizontal, type SankeyGraph } from 'd3-sankey'
import { useTransactions } from '../../../data/useTransactions'
import { useStatistikStore } from '../shared/store/useStatistikStore'
import { accountLabel, categoryLabel, type Transaction } from './data/types'
import { dots } from './format'

interface N {
  id: string
  name: string
  side: 'src' | 'dst'
}
interface L {
  source: string
  target: string
  value: number
}

const VB_W = 360
const VB_H = 300
const M = { left: 64, right: 96, top: 12, bottom: 12 }
const TOP_CATEGORIES = 8
const OTHER = '__other__'

function buildGraph(transactions: Transaction[]): { nodes: N[]; links: L[] } {
  // sum expense per (account, category) and per category
  const pairTotal = new Map<string, number>()
  const catTotal = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'keluar' || !t.category) continue
    pairTotal.set(
      `${t.account}::${t.category}`,
      (pairTotal.get(`${t.account}::${t.category}`) ?? 0) + t.amount,
    )
    catTotal.set(t.category, (catTotal.get(t.category) ?? 0) + t.amount)
  }

  // keep the largest categories; fold the rest into one "Kategori lain" node
  const top = new Set(
    [...catTotal.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_CATEGORIES)
      .map(([c]) => c),
  )

  const srcIds = new Set<string>()
  const dstIds = new Set<string>()
  const linkAgg = new Map<string, number>()
  for (const [key, value] of pairTotal) {
    const [account, category] = key.split('::')
    const dst = top.has(category) ? category : OTHER
    srcIds.add(account)
    dstIds.add(dst)
    const lk = `${account}::${dst}`
    linkAgg.set(lk, (linkAgg.get(lk) ?? 0) + value)
  }

  const links: L[] = [...linkAgg.entries()].map(([key, value]) => {
    const [account, dst] = key.split('::')
    return { source: `s:${account}`, target: `d:${dst}`, value }
  })

  const nodes: N[] = [
    ...[...srcIds].map((id) => ({
      id: `s:${id}`,
      name: accountLabel(id),
      side: 'src' as const,
    })),
    ...[...dstIds].map((id) => ({
      id: `d:${id}`,
      name: id === OTHER ? 'Kategori lain' : categoryLabel(id),
      side: 'dst' as const,
    })),
  ]
  return { nodes, links }
}

export function SankeyFallback() {
  const period = useStatistikStore((s) => s.period)
  const { transactions } = useTransactions(period)

  const { layout, totalExpense } = useMemo(() => {
    const { nodes, links } = buildGraph(transactions)
    const totalExpense = transactions.reduce(
      (a, t) => (t.type === 'keluar' ? a + t.amount : a),
      0,
    )
    if (nodes.length === 0 || links.length === 0) {
      return { layout: null, totalExpense }
    }
    const generator = sankey<N, L>()
      .nodeId((d) => d.id)
      .nodeWidth(5)
      .nodePadding(9)
      .extent([
        [M.left, M.top],
        [VB_W - M.right, VB_H - M.bottom],
      ])
    const graph: SankeyGraph<N, L> = generator({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    })
    return { layout: graph, totalExpense }
  }, [transactions])

  const linkPath = sankeyLinkHorizontal<N, L>()

  return (
    <div className="absolute inset-0 flex flex-col">
      <span className="pointer-events-none absolute left-3.5 top-3 font-mono text-[9px] tracking-[0.06em] text-kanal-fg3">
        SANKEY · {period.label.toUpperCase()}
      </span>
      {layout ? (
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          className="mt-6 flex-1"
          role="img"
          aria-label="Diagram aliran: pengeluaran per akun mengalir ke kategori"
        >
          {layout.links.map((l, i) => (
            <path
              key={i}
              d={linkPath(l) ?? undefined}
              fill="none"
              stroke="var(--exp)"
              strokeOpacity={0.2}
              strokeWidth={Math.max(1, l.width ?? 1)}
            />
          ))}
          {layout.nodes.map((n, i) => {
            const x0 = n.x0 ?? 0
            const y0 = n.y0 ?? 0
            const x1 = n.x1 ?? 0
            const y1 = n.y1 ?? 0
            const isSrc = (n as N).side === 'src'
            return (
              <g key={i}>
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={Math.max(1, y1 - y0)}
                  fill="var(--fg4)"
                  rx={1.5}
                />
                <text
                  x={isSrc ? x0 - 6 : x1 + 6}
                  y={(y0 + y1) / 2}
                  dy="0.32em"
                  textAnchor={isSrc ? 'end' : 'start'}
                  fontSize={9}
                  fontFamily="'Geist Mono', monospace"
                  fill="var(--fg2)"
                >
                  {(n as N).name}
                </text>
              </g>
            )
          })}
        </svg>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-kanal-fg2">
            Tidak ada pengeluaran di periode ini.
          </p>
        </div>
      )}
      <span className="pointer-events-none absolute bottom-3 left-3.5 right-3.5 font-mono text-[9px] text-kanal-fg3">
        Tampilan ringkas. Total pengeluaran Rp {dots(totalExpense)}.
      </span>
    </div>
  )
}
