/**
 * Scoring arithmetic, pure (ported and simplified from the potential-template competition
 * module). Scores are 1–10 per criterion; weights per round total 100 (P43), so one judge's
 * weighted total is Σ(score / 10 × weightPct) on a 0–100 scale. Several judges' totals combine
 * by mean or median; ranks are competition ranks (1, 2, 2, 4) by final score, highest first.
 */

export type Aggregation = 'mean' | 'median'

export const round2 = (n: number) => Math.round(n * 100) / 100

export function weightedTotal(
  criteria: readonly { id: string; weightPct: number }[],
  scores: ReadonlyMap<string, number>,
) {
  let total = 0
  for (const c of criteria) {
    const s = scores.get(c.id)
    if (s !== undefined) total += (s / 10) * c.weightPct
  }
  return round2(total)
}

/** A judge has graded a submission when every criterion of the rubric has a score. */
export function isComplete(
  criteria: readonly { id: string }[],
  scores: ReadonlyMap<string, number>,
) {
  return criteria.length > 0 && criteria.every((c) => scores.has(c.id))
}

export function aggregate(totals: readonly number[], method: Aggregation): number | null {
  if (totals.length === 0) return null
  if (method === 'median') {
    const sorted = [...totals].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 1
      ? round2(sorted[mid] ?? 0)
      : round2(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
  }
  return round2(totals.reduce((s, t) => s + t, 0) / totals.length)
}

/** Competition ranking by score (desc): equal scores share a rank; null scores get no rank. */
export function rankBy<T>(items: readonly T[], score: (item: T) => number | null) {
  const scored = items
    .map((item) => ({ item, s: score(item) }))
    .filter((x): x is { item: T; s: number } => x.s !== null)
    .sort((a, b) => b.s - a.s)
  const ranks = new Map<T, number>()
  scored.forEach((x, i) => {
    const prev = scored[i - 1]
    ranks.set(x.item, prev && prev.s === x.s ? (ranks.get(prev.item) ?? i + 1) : i + 1)
  })
  return ranks
}

export function rubricTotal(criteria: readonly { weightPct: number }[]) {
  return criteria.reduce((s, c) => s + c.weightPct, 0)
}
