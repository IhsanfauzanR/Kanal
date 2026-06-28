// 2D Sankey fallback (§10) — the reduced-motion / chart-bar alternative to the
// 3D scene. Real d3-sankey layout of income accounts (left) → expense
// categories (right), links summed from the actual expense transactions.
// Frost ribbons, mono labels. Accessible static view (no animation).

import { useMemo } from 'react'
import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyGraph,
} from 'd3-sankey'
import { MOCK_TRANSACTIONS } from './data/mockTransactions'
import { ACCOUNT_LABELS, CATEGORY_LABELS } from './data/types'
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
const M = { left: 58, right: 92, top: 12, bottom: 12 }

function buildGraph(): { nodes: N[]; links: L[] } {
  const linkMap = new Map<string, number>()
  for (const t of MOCK_TRANSACTIONS) {
    if (t.type !== 'keluar' || !t.category) continue
    const key = `${t.account}::${t.category}`
    linkMap.set(key, (linkMap.get(key) ?? 0) + t.amount)
  }

  const srcIds = new Set<string>()
  const dstIds = new Set<string>()
  const links: L[] = []
  for (const [key, value] of linkMap) {
    const [account, category] = key.split('::')
    srcIds.add(account)
    dstIds.add(category)
    links.push({ source: `s:${account}`, target: `d:${category}`, value })
  }

  const nodes: N[] = [
    ...[...srcIds].map((id) => ({
      id: `s:${id}`,
      name: ACCOUNT_LABELS[id as keyof typeof ACCOUNT_LABELS],
      side: 'src' as const,
    })),
    ...[...dstIds].map((id) => ({
      id: `d:${id}`,
      name: CATEGORY_LABELS[id as keyof typeof CATEGORY_LABELS],
      side: 'dst' as const,
    })),
  ]
  return { nodes, links }
}

export function SankeyFallback() {
  const layout = useMemo(() => {
    const { nodes, links } = buildGraph()
    const generator = sankey<N, L>()
      .nodeId((d) => d.id)
      .nodeWidth(5)
      .nodePadding(10)
      .extent([
        [M.left, M.top],
        [VB_W - M.right, VB_H - M.bottom],
      ])
    // d3-sankey mutates the graph; clone the arrays it owns.
    const graph: SankeyGraph<N, L> = generator({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    })
    return graph
  }, [])

  const linkPath = sankeyLinkHorizontal<N, L>()

  return (
    <div className="absolute inset-0 flex flex-col">
      <span className="pointer-events-none absolute left-3.5 top-3 font-mono text-[9px] tracking-[0.06em] text-kanal-fg3">
        SANKEY · 25 MEI – 26 JUN
      </span>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        className="mt-6 flex-1"
        role="img"
        aria-label="Diagram aliran: pemasukan per akun mengalir ke kategori pengeluaran"
      >
        {/* ribbons */}
        {layout.links.map((l, i) => (
          <path
            key={i}
            d={linkPath(l) ?? undefined}
            fill="none"
            stroke="var(--teal)"
            strokeOpacity={0.22}
            strokeWidth={Math.max(1, l.width ?? 1)}
          />
        ))}
        {/* nodes + labels */}
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
                fill="#52525b"
                rx={1.5}
              />
              <text
                x={isSrc ? x0 - 6 : x1 + 6}
                y={(y0 + y1) / 2}
                dy="0.32em"
                textAnchor={isSrc ? 'end' : 'start'}
                fontSize={9}
                fontFamily="'Geist Mono', monospace"
                fill="#a1a1aa"
              >
                {(n as N).name}
              </text>
            </g>
          )
        })}
      </svg>
      <span className="pointer-events-none absolute bottom-3 left-3.5 right-3.5 font-mono text-[9px] text-kanal-fg3">
        Tampilan ringkas. Total pengeluaran Rp {dots(3184073)}.
      </span>
    </div>
  )
}
