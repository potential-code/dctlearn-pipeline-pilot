import { features } from '@server/config/env'

/**
 * Mentor matching (P17–P22). AI ranking is parked (decision 2026-10-07); the rule-based scorer
 * is the default: category overlap 60 %, language 30 %, availability 10 %. Same output either way.
 */
export type MatchCandidate = {
  mentorId: string
  categories: string[]
  languages: string[]
  hasAvailability: boolean
}
export type MatchInput = {
  preferredAreas: string[]
  language: 'en' | 'ar' | 'both'
  candidates: MatchCandidate[]
}
export type MatchResult = { mentorId: string; score: number; reasons: { en: string; ar: string }[] }

export interface MatchProvider {
  readonly source: 'ai' | 'rules'
  rank(input: MatchInput): Promise<MatchResult[]>
}

export function ruleScore(input: Omit<MatchInput, 'candidates'>, c: MatchCandidate): MatchResult {
  const wanted = new Set(input.preferredAreas.map((a) => a.toLowerCase()))
  const overlap = c.categories.filter((cat) => wanted.has(cat.toLowerCase()))
  const categoryScore =
    wanted.size === 0 ? 0 : overlap.length / Math.min(wanted.size, Math.max(c.categories.length, 1))
  const langs = input.language === 'both' ? ['en', 'ar'] : [input.language]
  const languageScore = langs.every((l) => c.languages.includes(l))
    ? 1
    : langs.some((l) => c.languages.includes(l))
      ? 0.5
      : 0
  const availabilityScore = c.hasAvailability ? 1 : 0
  const score =
    Math.round(
      (0.6 * Math.min(categoryScore, 1) + 0.3 * languageScore + 0.1 * availabilityScore) * 100,
    ) / 100
  const reasons: MatchResult['reasons'] = []
  for (const cat of overlap) reasons.push({ en: `${cat} overlap`, ar: `تطابق: ${cat}` })
  if (languageScore === 1)
    reasons.push({
      en: langs.length > 1 ? 'Arabic + English' : langs[0] === 'ar' ? 'Arabic' : 'English',
      ar: langs.length > 1 ? 'العربية + الإنجليزية' : langs[0] === 'ar' ? 'العربية' : 'الإنجليزية',
    })
  if (availabilityScore) reasons.push({ en: 'Has free slots', ar: 'لديه مواعيد متاحة' })
  return { mentorId: c.mentorId, score, reasons }
}

export const rulesMatchProvider: MatchProvider = {
  source: 'rules',
  async rank(input) {
    return input.candidates.map((c) => ruleScore(input, c)).sort((a, b) => b.score - a.score)
  },
}

let provider: MatchProvider = rulesMatchProvider
export function matchProvider(): MatchProvider {
  // AI provider plugs in here when AI_PROVIDER_* is configured; until then rules.
  return features.ai ? provider : rulesMatchProvider
}
export function setMatchProvider(next: MatchProvider) {
  provider = next
}
