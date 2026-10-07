import { describe, expect, test } from 'bun:test'
import { aggregate, isComplete, rankBy, weightedTotal } from '@server/services/competition/scoring'

const rubric = [
  { id: 'name', weightPct: 15 },
  { id: 'desc', weightPct: 25 },
  { id: 'creativity', weightPct: 20 },
  { id: 'attention', weightPct: 40 },
]
const marks = (...s: number[]) => new Map(rubric.map((c, i) => [c.id, s[i]!]))

describe('scoring arithmetic', () => {
  test('weighted total = Σ(score/10 × weightPct)', () => {
    expect(weightedTotal(rubric, marks(7, 7, 8, 7))).toBe(72)
    expect(weightedTotal(rubric, marks(7, 8, 7, 7))).toBe(72.5)
    expect(weightedTotal(rubric, marks(10, 10, 10, 10))).toBe(100)
    expect(weightedTotal(rubric, marks(1, 1, 1, 1))).toBe(10)
  })

  test('complete only when every criterion is scored', () => {
    expect(isComplete(rubric, marks(7, 7, 8, 7))).toBe(true)
    expect(isComplete(rubric, new Map([['name', 7]]))).toBe(false)
    expect(isComplete([], new Map())).toBe(false)
  })

  test('mean and median', () => {
    expect(aggregate([], 'mean')).toBeNull()
    expect(aggregate([72, 90, 50], 'mean')).toBe(70.67)
    expect(aggregate([72, 90, 50], 'median')).toBe(72)
    expect(aggregate([72, 90], 'median')).toBe(81)
  })

  test('competition ranks: ties share, nulls unranked', () => {
    const rows = [{ s: 70 }, { s: 90 }, { s: 70 }, { s: null }, { s: 50 }]
    const ranks = rankBy(rows, (r) => r.s)
    expect(rows.map((r) => ranks.get(r) ?? null)).toEqual([2, 1, 2, null, 4])
  })
})
