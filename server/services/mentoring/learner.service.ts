import { type DbOrTx, db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import {
  bookingFeedback,
  growLogs,
  menteeApplications,
  mentorBookings,
  mentoringSettings,
  mentorMatches,
  mentorMicrosites,
  mentorProfiles,
} from '@server/db/schema/mentoring'
import type { Microsite } from '@server/db/schema/microsites'
import { now } from '@server/lib/clock'
import { conflict, notFound } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import { cardsForCourses } from '@server/services/catalog/course-card.service'
import {
  findVisibleForm,
  myLatestEntry,
  submitEntry,
} from '@server/services/forms/form-access.service'
import { matchProvider } from '@server/services/providers/match.provider'
import type { MentorCard } from '@shared/schemas/common'
import type {
  ChooseResponse,
  GrowLogsPage,
  MatchResponse,
  MentorDetail,
  MentoringDashboardSection,
  MentorsTabQuery,
  MentorsTabResponse,
  MyBookingsPage,
  MyBookingsQuery,
  RegistrationState,
  SlotsResponse,
} from '@shared/schemas/mentoring'
import { and, count, desc, eq, gt, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import { joinUrlFor, visibleMentor } from './access.service'
import { mentorRowsByIds, toMentorCard, toMentorCards } from './cards.service'
import { lockKey } from './locks'
import { notifyApplicationReceived } from './notify'
import { DEFAULT_SLOT_DAYS, freeSlots, mentorsWithRules, rulesOf } from './slots.service'

/** Learner side of mentoring (P17–P22, P52 `mentors`). Own data only. */

type TabQuery = z.infer<typeof MentorsTabQuery>

/* ------------------------------------------------------------------ P52 / P17 mentors list */

/** Active mentors linked to the microsite; with mentoring off only trainers (browse only). */
async function linkedMentorIds(m: Microsite, tx: DbOrTx = db) {
  const rows = await tx
    .select({ id: mentorProfiles.id, kind: mentorProfiles.kind })
    .from(mentorMicrosites)
    .innerJoin(mentorProfiles, eq(mentorProfiles.id, mentorMicrosites.mentorId))
    .where(and(eq(mentorMicrosites.micrositeId, m.id), eq(mentorProfiles.status, 'active')))
  return rows.filter((r) => m.mentoringEnabled || r.kind === 'trainer').map((r) => r.id)
}

export async function mentorsTab(
  viewer: Viewer,
  m: Microsite,
  query: TabQuery,
): Promise<z.infer<typeof MentorsTabResponse>> {
  const rows = await mentorRowsByIds(await linkedMentorIds(m))
  rows.sort((a, b) => a.name.localeCompare(b.name))
  const categories = [...new Set(rows.flatMap((r) => r.profile.categories))].sort()
  const q = query.q?.toLowerCase()
  const filtered = rows.filter(
    (r) =>
      (!q || r.name.toLowerCase().includes(q) || r.profile.title.toLowerCase().includes(q)) &&
      (!query.category || r.profile.categories.includes(query.category)) &&
      (!query.kind || r.profile.kind === query.kind),
  )
  const { limit, offset } = pageWindow(query)
  const page = filtered.slice(offset, offset + limit)
  const cards = await toMentorCards(page, {
    viewerId: viewer.id,
    withNextSlot: m.mentoringEnabled,
  })
  return {
    categories,
    items: paged(
      cards.map((c, i) => {
        const p = page[i]!.profile
        return p.kind === 'trainer' && p.courseIds.length ? { ...c, courseIds: p.courseIds } : c
      }),
      filtered.length,
      query,
    ),
  }
}

/* ------------------------------------------------------------------ P18 mentor profile */

export async function mentorDetail(
  viewer: Viewer,
  mentorId: string,
): Promise<z.infer<typeof MentorDetail>> {
  const { row, bookableIn } = await visibleMentor(viewer, mentorId)
  const card = await toMentorCard(row, {
    viewerId: viewer.id,
    withNextSlot: bookableIn.length > 0 || viewer.role !== 'learner',
  })
  const rules = await rulesOf(row.profile.id)
  return {
    ...card,
    bio: row.profile.bio,
    linkedinUrl: row.profile.linkedinUrl,
    courses: await cardsForCourses(row.profile.courseIds, viewer.id),
    availabilitySummary: {
      timezone: row.profile.timezone,
      rules: rules.map((r) => ({
        weekday: r.weekday,
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    },
  }
}

/* ------------------------------------------------------------------ P19 registration */

async function registrationForm(m: Microsite, viewer: Viewer, tx: DbOrTx = db) {
  const [s] = await tx
    .select()
    .from(mentoringSettings)
    .where(eq(mentoringSettings.micrositeId, m.id))
  if (!s?.registrationFormId) throw notFound('Mentee registration is not set up')
  return findVisibleForm(s.registrationFormId, viewer, tx)
}

/** The learner's registration answers in this microsite, or null when not registered. */
export async function registrationAnswers(m: Microsite, userId: string, tx: DbOrTx = db) {
  const [s] = await tx
    .select()
    .from(mentoringSettings)
    .where(eq(mentoringSettings.micrositeId, m.id))
  if (!s?.registrationFormId) return null
  const entry = await myLatestEntry(s.registrationFormId, userId, tx)
  return entry?.answers ?? null
}

export async function getRegistration(
  viewer: Viewer,
  m: Microsite,
): Promise<z.infer<typeof RegistrationState>> {
  const form = await registrationForm(m, viewer)
  const entry = await myLatestEntry(form.id, viewer.id)
  return {
    formId: form.id,
    complete: Boolean(entry),
    ...(entry ? { answers: entry.answers } : {}),
  }
}

export async function submitRegistration(
  viewer: Viewer,
  m: Microsite,
  answers: Record<string, unknown>,
) {
  return db.transaction(async (tx) => {
    const form = await registrationForm(m, viewer, tx)
    await submitEntry(form, viewer, answers, m.id, tx)
    return { complete: true as const }
  })
}

/* ------------------------------------------------------------------ P20 / P21 match */

async function requireRegistration(m: Microsite, userId: string, tx: DbOrTx = db) {
  const answers = await registrationAnswers(m, userId, tx)
  if (!answers) throw conflict('Complete the mentee registration first')
  return answers
}

function matchInput(answers: Record<string, unknown>) {
  const areas = Array.isArray(answers.preferredAreas)
    ? answers.preferredAreas.filter((a): a is string => typeof a === 'string')
    : []
  const lang = answers.language
  const language: 'en' | 'ar' | 'both' = lang === 'en' || lang === 'ar' ? lang : 'both'
  return { preferredAreas: areas, language }
}

/** Mentors a learner of `m` may be matched with: active, kind mentor, booking on. */
async function candidateRows(m: Microsite, tx: DbOrTx = db) {
  const ids = await linkedMentorIds(m, tx)
  const rows = await mentorRowsByIds(ids, tx)
  return rows.filter((r) => r.profile.kind === 'mentor' && r.profile.bookingEnabled)
}

export async function suggestMatches(
  viewer: Viewer,
  m: Microsite,
): Promise<z.infer<typeof MatchResponse>> {
  const answers = await requireRegistration(m, viewer.id)
  const rows = await candidateRows(m)
  const withRules = await mentorsWithRules(rows.map((r) => r.profile.id))
  const provider = matchProvider()
  const ranked = await provider.rank({
    ...matchInput(answers),
    candidates: rows.map((r) => ({
      mentorId: r.profile.id,
      categories: r.profile.categories,
      languages: r.profile.languages,
      hasAvailability: withRules.has(r.profile.id),
    })),
  })
  const top = ranked.slice(0, 5)
  const byId = new Map(rows.map((r) => [r.profile.id, r]))
  const topRows = top.map((t) => byId.get(t.mentorId)).filter((r) => r !== undefined)
  const cards = await toMentorCards(topRows, { viewerId: viewer.id, withNextSlot: true })
  return {
    source: provider.source,
    suggestions: cards.map((c, i) => ({
      ...c,
      matchScore: top[i]!.score,
      reasons: top[i]!.reasons,
    })),
  }
}

/** P21: the learner asks the chosen mentor; the mentor accepts (match + lock) or declines. */
export async function chooseMentor(
  viewer: Viewer,
  m: Microsite,
  mentorId: string,
): Promise<z.infer<typeof ChooseResponse>> {
  return db.transaction(async (tx) => {
    await lockKey(tx, `match:${viewer.id}:${m.id}`)
    const answers = await requireRegistration(m, viewer.id, tx)
    const rows = await candidateRows(m, tx)
    const row = rows.find((r) => r.profile.id === mentorId)
    if (!row) throw notFound()
    const [active] = await tx
      .select({ id: mentorMatches.id })
      .from(mentorMatches)
      .where(
        and(
          eq(mentorMatches.menteeId, viewer.id),
          eq(mentorMatches.micrositeId, m.id),
          eq(mentorMatches.status, 'active'),
        ),
      )
    if (active) throw conflict('You already have a mentor in this programme')
    const [pending] = await tx
      .select({ id: menteeApplications.id })
      .from(menteeApplications)
      .where(
        and(
          eq(menteeApplications.menteeId, viewer.id),
          eq(menteeApplications.micrositeId, m.id),
          eq(menteeApplications.status, 'pending'),
        ),
      )
    if (pending) throw conflict('Your application is waiting for the mentor')
    const provider = matchProvider()
    const [scored] = await provider.rank({
      ...matchInput(answers),
      candidates: [
        {
          mentorId,
          categories: row.profile.categories,
          languages: row.profile.languages,
          hasAvailability: (await mentorsWithRules([mentorId], tx)).has(mentorId),
        },
      ],
    })
    const inserted = await tx
      .insert(menteeApplications)
      .values({
        menteeId: viewer.id,
        mentorId,
        micrositeId: m.id,
        answers,
        matchScore: scored?.score ?? null,
        source: provider.source,
      })
      .onConflictDoNothing()
      .returning({ id: menteeApplications.id })
    if (inserted.length === 0) throw conflict('Your application is waiting for the mentor')
    await notifyApplicationReceived(tx, mentorId, viewer.name, m.name.en)
    return { matchedMentor: await toMentorCard(row, { viewerId: viewer.id, tx }) }
  })
}

/* ------------------------------------------------------------------ my bookings, GROW logs */

export async function myBookings(
  viewer: Viewer,
  query: z.infer<typeof MyBookingsQuery>,
): Promise<z.infer<typeof MyBookingsPage>> {
  const where = and(
    eq(mentorBookings.menteeId, viewer.id),
    query.status ? eq(mentorBookings.status, query.status) : undefined,
  )
  const [total] = await db.select({ n: count() }).from(mentorBookings).where(where)
  const { limit, offset } = pageWindow(query)
  const rows = await db
    .select()
    .from(mentorBookings)
    .where(where)
    .orderBy(desc(mentorBookings.startsAt))
    .limit(limit)
    .offset(offset)
  const mentorIds = [...new Set(rows.map((r) => r.mentorId))]
  const mentorRows = await mentorRowsByIds(mentorIds)
  const cards = await toMentorCards(mentorRows, { viewerId: viewer.id })
  const cardById = new Map(cards.map((c) => [c.mentorId, c]))
  const given = rows.length
    ? await db
        .select({ id: bookingFeedback.bookingId })
        .from(bookingFeedback)
        .where(
          and(
            inArray(
              bookingFeedback.bookingId,
              rows.map((r) => r.id),
            ),
            eq(bookingFeedback.side, 'mentee'),
          ),
        )
    : []
  const givenSet = new Set(given.map((g) => g.id))
  const t = now()
  return paged(
    rows.map((b) => ({
      id: b.id,
      mentor: cardById.get(b.mentorId) as MentorCard,
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      status: b.status as 'confirmed',
      ...(b.status === 'confirmed' && b.endsAt > t ? { joinUrl: joinUrlFor(b.id) } : {}),
      feedbackGiven: givenSet.has(b.id),
    })),
    Number(total?.n ?? 0),
    query,
  )
}

export async function growLogPage(
  where: ReturnType<typeof and>,
  query: { page: number; pageSize: number },
): Promise<z.infer<typeof GrowLogsPage>> {
  const [total] = await db.select({ n: count() }).from(growLogs).where(where)
  const { limit, offset } = pageWindow(query)
  const rows = await db
    .select({ log: growLogs, menteeName: users.name })
    .from(growLogs)
    .innerJoin(users, eq(users.id, growLogs.menteeId))
    .where(where)
    .orderBy(desc(growLogs.sessionDate), desc(growLogs.createdAt))
    .limit(limit)
    .offset(offset)
  return paged(
    rows.map(({ log, menteeName }) => ({
      id: log.id,
      bookingId: log.bookingId,
      menteeName,
      sessionNo: log.sessionNo,
      sessionDate: log.sessionDate,
      goal: log.goal,
      reality: log.reality,
      options: log.options,
      wayForward: log.wayForward,
      createdAt: log.createdAt.toISOString(),
    })),
    Number(total?.n ?? 0),
    query,
  )
}

export function myGrowLogs(viewer: Viewer, query: { page: number; pageSize: number }) {
  return growLogPage(and(eq(growLogs.menteeId, viewer.id)), query)
}

/* ------------------------------------------------------------------ P14 dashboard section */

export async function dashboardSection(
  viewer: Viewer,
  m: Microsite,
): Promise<z.infer<typeof MentoringDashboardSection>> {
  const registrationComplete = Boolean(await registrationAnswers(m, viewer.id))
  const [match] = await db
    .select({ mentorId: mentorMatches.mentorId })
    .from(mentorMatches)
    .where(
      and(
        eq(mentorMatches.menteeId, viewer.id),
        eq(mentorMatches.micrositeId, m.id),
        eq(mentorMatches.status, 'active'),
      ),
    )
  const matchedRows = match ? await mentorRowsByIds([match.mentorId]) : []
  const matchedMentor = matchedRows[0]
    ? await toMentorCard(matchedRows[0], { viewerId: viewer.id, withNextSlot: true })
    : undefined
  const [next] = await db
    .select()
    .from(mentorBookings)
    .where(
      and(
        eq(mentorBookings.menteeId, viewer.id),
        eq(mentorBookings.micrositeId, m.id),
        inArray(mentorBookings.status, ['requested', 'confirmed']),
        gt(mentorBookings.endsAt, now()),
      ),
    )
    .orderBy(mentorBookings.startsAt)
    .limit(1)
  return {
    enabled: true,
    registrationComplete,
    ...(matchedMentor ? { matchedMentor } : {}),
    ...(next
      ? {
          nextSession: {
            bookingId: next.id,
            startsAt: next.startsAt.toISOString(),
            ...(next.status === 'confirmed' ? { joinUrl: joinUrlFor(next.id) } : {}),
          },
        }
      : {}),
  }
}

/* ------------------------------------------------------------------ P21 slots */

export async function mentorSlots(
  viewer: Viewer,
  mentorId: string,
  query: { from?: string; to?: string },
): Promise<z.infer<typeof SlotsResponse>> {
  const { row, bookableIn } = await visibleMentor(viewer, mentorId)
  if (viewer.role === 'learner' && bookableIn.length === 0) return { slots: [] }
  const from = query.from ? new Date(query.from) : now()
  const requested = query.to
    ? new Date(query.to)
    : new Date(from.getTime() + DEFAULT_SLOT_DAYS * 86_400_000)
  // Always at most 31 days, whatever the query (security review M7).
  const to = new Date(Math.min(requested.getTime(), from.getTime() + 31 * 86_400_000))
  if (to <= from) return { slots: [] }
  const slots = await freeSlots(row.profile, from, to)
  return {
    slots: slots.map((s) => ({
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    })),
  }
}
