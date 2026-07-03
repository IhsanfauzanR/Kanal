// Transforms a period's transactions into a per-day series (§5.2/§5.3).
// Provides both the cumulative curves (for Kumulatif mode) and the daily
// deltas (for Harian mode), plus the header/RINCIAN stats.

import { useMemo } from 'react'
import type { Transaction } from '../../aliran/data/types'
import type { StatistikPeriod } from '../../shared/period'

export interface DailyPoint {
  day: number
  date: Date
  income: number // that day
  expense: number // that day
  expenseNeg: number // -expense, for the below-baseline bar in Harian mode
  net: number // income - expense (daily)
  cumIncome: number
  cumExpense: number
  // Selisih band, colored by sign: a zero-height band hides the off-color side
  // so the fill switches teal/red at the crossover without gaps (§5.2).
  tealBand: [number, number]
  redBand: [number, number]
}

export interface DailySeries {
  points: DailyPoint[]
  ticks: number[]
  totalIncome: number
  totalExpense: number
  selisih: number
  savingsRatio: number // percent
  topIncomeDay: { date: Date; amount: number } | null
  topExpenseDay: { date: Date; amount: number } | null
  hasData: boolean
}

const EMPTY: DailySeries = {
  points: [],
  ticks: [],
  totalIncome: 0,
  totalExpense: 0,
  selisih: 0,
  savingsRatio: 0,
  topIncomeDay: null,
  topExpenseDay: null,
  hasData: false,
}

export function useDailySeries(
  transactions: Transaction[],
  period: StatistikPeriod,
): DailySeries {
  const y = period.start.getFullYear()
  const m = period.start.getMonth()

  return useMemo(() => {
    if (transactions.length === 0) return EMPTY

    const incomeByDay = new Map<number, number>()
    const expenseByDay = new Map<number, number>()
    let lastDay = 0

    for (const t of transactions) {
      const day = t.timestamp.getDate()
      if (day > lastDay) lastDay = day
      if (t.type === 'masuk') {
        incomeByDay.set(day, (incomeByDay.get(day) ?? 0) + t.amount)
      } else if (t.type === 'keluar') {
        expenseByDay.set(day, (expenseByDay.get(day) ?? 0) + t.amount)
      }
    }

    const points: DailyPoint[] = []
    let cumIncome = 0
    let cumExpense = 0
    let topIncomeDay: { date: Date; amount: number } | null = null
    let topExpenseDay: { date: Date; amount: number } | null = null

    for (let day = 1; day <= lastDay; day++) {
      const income = incomeByDay.get(day) ?? 0
      const expense = expenseByDay.get(day) ?? 0
      cumIncome += income
      cumExpense += expense
      const date = new Date(y, m, day)

      if (income > 0 && (!topIncomeDay || income > topIncomeDay.amount)) {
        topIncomeDay = { date, amount: income }
      }
      if (expense > 0 && (!topExpenseDay || expense > topExpenseDay.amount)) {
        topExpenseDay = { date, amount: expense }
      }

      points.push({
        day,
        date,
        income,
        expense,
        expenseNeg: -expense,
        net: income - expense,
        cumIncome,
        cumExpense,
        tealBand:
          cumIncome >= cumExpense ? [cumExpense, cumIncome] : [cumIncome, cumIncome],
        redBand:
          cumExpense > cumIncome ? [cumIncome, cumExpense] : [cumExpense, cumExpense],
      })
    }

    const selisih = cumIncome - cumExpense
    return {
      points,
      ticks: [1, 5, 10, 15, 20, 25, 30].filter((d) => d <= lastDay),
      totalIncome: cumIncome,
      totalExpense: cumExpense,
      selisih,
      savingsRatio: cumIncome > 0 ? (selisih / cumIncome) * 100 : 0,
      topIncomeDay,
      topExpenseDay,
      hasData: points.length > 0,
    }
  }, [transactions, y, m])
}
