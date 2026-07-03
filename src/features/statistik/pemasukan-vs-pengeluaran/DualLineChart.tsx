// Recharts wrapper, styled hard against the defaults (§5.2/§5.3). The work here
// is killing Recharts' look: mono axis ticks, no dots, horizontal-only dashed
// grid, transparent canvas, custom tooltip, and no mount/draw animation (the
// brief forbids celebratory motion — lines must not animate in).

import { memo } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { abbreviateRupiah } from '../shared/format'
import { DayTooltip } from './DayTooltip'
import type { DailyPoint } from './hooks/useDailySeries'

// Chart colours read the theme tokens (SVG presentation attributes accept
// var()), so the chart flips with light/dark like the rest of the chrome.
const TEAL = '#7CB1AE'
const RED = '#C16B5B'
const NET = 'var(--fg)'
const GRID = 'var(--line)'
const tickStyle = {
  fill: 'var(--fg3)',
  fontFamily: 'Geist Mono, ui-monospace, monospace',
  fontSize: 11,
}

interface DualLineChartProps {
  points: DailyPoint[]
  ticks: number[]
  mode: 'kumulatif' | 'harian'
}

// Y-axis ticks drop the "Rp" prefix — at 11px mono in a narrow axis gutter the
// prefix overflows and clips. The unit is already clear from context.
const yFormatCumulative = (v: number) => abbreviateRupiah(v, false)
const yFormatDaily = (v: number) =>
  (v < 0 ? '−' : '') + abbreviateRupiah(Math.abs(v), false)

// Widest Y label the data will produce, so the axis gutter is sized to fit it
// (no clipping like "1,9jt" → ",9jt") yet stays narrow for short labels.
function yAxisWidth(
  points: DualLineChartProps['points'],
  mode: DualLineChartProps['mode'],
): number {
  let label = '0'
  if (mode === 'kumulatif') {
    const last = points[points.length - 1]
    const max = last ? Math.max(last.cumIncome, last.cumExpense) : 0
    label = yFormatCumulative(max)
  } else {
    let max = 0
    for (const p of points) max = Math.max(max, p.income, p.expense, Math.abs(p.net))
    const pos = yFormatDaily(max)
    const neg = yFormatDaily(-max)
    label = neg.length > pos.length ? neg : pos
  }
  return Math.min(60, Math.max(30, Math.round(label.length * 7) + 12))
}

function DualLineChartImpl({ points, ticks, mode }: DualLineChartProps) {
  const yWidth = yAxisWidth(points, mode)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={points} margin={{ top: 8, right: 10, bottom: 2, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 6" />
        <XAxis
          dataKey="day"
          type="number"
          domain={['dataMin', 'dataMax']}
          ticks={ticks}
          tick={tickStyle}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tick={tickStyle}
          tickLine={false}
          axisLine={false}
          width={yWidth}
          tickFormatter={mode === 'kumulatif' ? yFormatCumulative : yFormatDaily}
        />
        <Tooltip
          content={<DayTooltip mode={mode} />}
          cursor={{ stroke: 'rgba(161,161,170,0.25)', strokeWidth: 1 }}
          wrapperStyle={{ outline: 'none' }}
          animationDuration={150}
        />

        {mode === 'kumulatif' ? (
          <>
            <Area
              dataKey="tealBand"
              stroke="none"
              fill={TEAL}
              fillOpacity={0.08}
              isAnimationActive={false}
              activeDot={false}
            />
            <Area
              dataKey="redBand"
              stroke="none"
              fill={RED}
              fillOpacity={0.08}
              isAnimationActive={false}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="cumIncome"
              stroke={TEAL}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: TEAL, stroke: 'none' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="cumExpense"
              stroke={RED}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: RED, stroke: 'none' }}
              isAnimationActive={false}
            />
          </>
        ) : (
          <>
            <ReferenceLine y={0} stroke={GRID} />
            <Bar
              dataKey="income"
              fill={TEAL}
              fillOpacity={0.6}
              radius={0}
              isAnimationActive={false}
            />
            <Bar
              dataKey="expenseNeg"
              fill={RED}
              fillOpacity={0.6}
              radius={0}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke={NET}
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 3, fill: NET, stroke: 'none' }}
              isAnimationActive={false}
            />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Memo: only re-render when the series or mode actually changes (§9).
export const DualLineChart = memo(DualLineChartImpl)
