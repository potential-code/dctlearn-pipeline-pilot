import { type DbOrTx, db, type Tx } from '@server/db/connection'
import { courses } from '@server/db/schema/catalog'
import { users } from '@server/db/schema/identity'
import {
  growLogs,
  mentorBookings,
  mentorMatches,
  mentorMicrosites,
  mentorProfiles,
} from '@server/db/schema/mentoring'
import { microsites } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { notFound, validationFailed } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import { createInvitations, type Invitation } from '@server/services/identity/invitation.service'
import {
  type AdminMentorMentees,
  type AdminMentorRow,
  type AdminMentorsQuery,
  type AdminMentorUpdate,
  MENTOR_CATEGORIES,
  type MentorInviteInput,
} from '@shared/schemas/mentoring'
import { and, count, countDistinct, desc, eq, inArray, max, ne } from 'drizzle-orm'
import type { z } from 'zod'
import { type MentorRow, mentorRowById, mentorRowsByIds, toMentorCards } from './cards.service'

/** P48 mentor pool (role admin). Invite and edit are audited. */

async function micrositeIdsBySlug(slugs: string[], field: string, tx: DbOrTx = db) {
  const unique = [...new Set(slugs)]
  if (unique.length === 0) return []
  const rows = await tx
    .select({ id: microsites.id, slug: microsites.slug })
    .from(microsites)
    .where(inArray(microsites.slug, unique))
  const found = new Set(rows.map((r) => r.slug))
  const missing = unique.filter((s) => !found.has(s))
  if (missing.length)
    throw validationFailed({ [field]: `Unknown microsite: ${missing.join(', ')}` })
  return rows.map((r) => r.id)
}

async function adminRows(rows: MentorRow[], viewerId: string, tx: DbOrTx = db) {
  const ids = rows.map((r) => r.profile.id)
  const cards = await toMentorCards(rows, { viewerId, tx })
  const mentees = new Map<string, number>()
  const sessions = new Map<string, number>()
  if (ids.length) {
    for (const r of await tx
      .select({ id: mentorMatches.mentorId, n: countDistinct(mentorMatches.menteeId) })
      .from(mentorMatches)
      .where(and(inArray(mentorMatches.mentorId, ids), eq(mentorMatches.status, 'active')))
      .groupBy(mentorMatches.mentorId))
      mentees.set(r.id, Number(r.n))
    for (const r of await tx
      .select({ id: mentorBookings.mentorId, n: count() })
      .from(mentorBookings)
      .where(and(inArray(mentorBookings.mentorId, ids), ne(mentorBookings.status, 'cancelled')))
      .groupBy(mentorBookings.mentorId))
      sessions.set(r.id, Number(r.n))
  }
  return cards.map(
    (c, i): z.infer<typeof AdminMentorRow> => ({
      ...c,
      email: rows[i]!.email,
      status: rows[i]!.profile.status as 'active',
      kind: rows[i]!.profile.kind as 'mentor',
      courseIds: rows[i]!.profile.courseIds,
      mentees: mentees.get(c.mentorId) ?? 0,
      sessions: sessions.get(c.mentorId) ?? 0,
    }),
  )
}

export async function listMentors(viewer: Viewer, query: z.infer<typeof AdminMentorsQuery>) {
  const all = await db.select({ id: mentorProfiles.id }).from(mentorProfiles)
  let rows = await mentorRowsByIds(all.map((r) => r.id))
  if (query.microsite) {
    const [m] = await db.select().from(microsites).where(eq(microsites.slug, query.microsite))
    const linked = m
      ? new Set(
          (
            await db
              .select({ id: mentorMicrosites.mentorId })
              .from(mentorMicrosites)
              .where(eq(mentorMicrosites.micrositeId, m.id))
          ).map((r) => r.id),
        )
      : new Set<string>()
    rows = rows.filter((r) => linked.has(r.profile.id))
  }
  const q = query.q?.toLowerCase()
  rows = rows
    .filter(
      (r) =>
        (!q || r.name.toLowerCase().includes(q) || r.email.includes(q)) &&
        (!query.status || r.profile.status === query.status),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
  const { limit, offset } = pageWindow(query)
  return paged(await adminRows(rows.slice(offset, offset + limit), viewer.id), rows.length, query)
}

export async function inviteMentors(viewer: Viewer, input: z.infer<typeof MentorInviteInput>) {
  return db.transaction(async (tx) => {
    await micrositeIdsBySlug(input.microsites, 'microsites', tx)
    const { created, skipped } = await createInvitations(
      {
        emails: input.emails,
        role: 'mentor',
        micrositeId: null,
        inviter: { id: viewer.id, name: viewer.name, ip: viewer.ip },
        meta: { microsites: [...new Set(input.microsites)], categories: input.categories ?? [] },
      },
      tx,
    )
    return { created: created.length, skipped }
  })
}

export async function updateMentor(
  viewer: Viewer,
  id: string,
  input: z.infer<typeof AdminMentorUpdate>,
) {
  return db.transaction(async (tx) => {
    const row = await mentorRowById(id, tx)
    if (!row) throw notFound()
    const micrositeIds = await micrositeIdsBySlug(input.microsites, 'microsites', tx)
    const courseIds = [...new Set(input.courseIds)]
    if (courseIds.length) {
      const found = await tx
        .select({ id: courses.id })
        .from(courses)
        .where(inArray(courses.id, courseIds))
      if (found.length !== courseIds.length) throw validationFailed({ courseIds: 'Unknown course' })
    }
    await tx
      .update(mentorProfiles)
      .set({
        categories: [...new Set(input.categories)],
        courseIds,
        bookingEnabled: input.bookingEnabled,
        kind: input.kind,
        status: input.status,
      })
      .where(eq(mentorProfiles.id, id))
    await tx.delete(mentorMicrosites).where(eq(mentorMicrosites.mentorId, id))
    if (micrositeIds.length)
      await tx
        .insert(mentorMicrosites)
        .values(micrositeIds.map((micrositeId) => ({ mentorId: id, micrositeId })))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'mentor.update',
      target: { type: 'mentor', id, label: row.name },
      ip: viewer.ip,
      meta: { ...input },
    })
    const [out] = await adminRows([(await mentorRowById(id, tx))!], viewer.id, tx)
    return out!
  })
}

export async function mentorMentees(id: string): Promise<z.infer<typeof AdminMentorMentees>> {
  const row = await mentorRowById(id)
  if (!row) throw notFound()
  const matches = await db
    .select({ match: mentorMatches, user: users, slug: microsites.slug })
    .from(mentorMatches)
    .innerJoin(users, eq(users.id, mentorMatches.menteeId))
    .innerJoin(microsites, eq(microsites.id, mentorMatches.micrositeId))
    .where(and(eq(mentorMatches.mentorId, id), eq(mentorMatches.status, 'active')))
    .orderBy(desc(mentorMatches.matchedAt))
  return Promise.all(
    matches.map(async ({ match, user, slug }) => {
      const [s] = await db
        .select({ n: count() })
        .from(mentorBookings)
        .where(
          and(
            eq(mentorBookings.mentorId, id),
            eq(mentorBookings.menteeId, user.id),
            eq(mentorBookings.status, 'completed'),
          ),
        )
      const [l] = await db
        .select({ at: max(growLogs.createdAt) })
        .from(growLogs)
        .where(and(eq(growLogs.mentorId, id), eq(growLogs.menteeId, user.id)))
      return {
        user: { id: user.id, name: user.name, email: user.email },
        microsite: slug,
        matchedAt: match.matchedAt.toISOString(),
        sessions: Number(s?.n ?? 0),
        ...(l?.at ? { lastLogAt: new Date(l.at).toISOString() } : {}),
      }
    }),
  )
}

/* ------------------------------------------------------------------ hooks */

/** Invitation accepted with role mentor → profile (if missing) + microsite links from meta. */
export async function onMentorInvitationAccepted(
  tx: Tx,
  input: { invitation: Invitation; userId: string },
) {
  if (input.invitation.role !== 'mentor') return
  const meta = input.invitation.meta ?? {}
  const allowed = new Set<string>(MENTOR_CATEGORIES)
  const categories = Array.isArray(meta.categories)
    ? meta.categories.filter((c): c is string => typeof c === 'string' && allowed.has(c))
    : []
  const slugs = Array.isArray(meta.microsites)
    ? meta.microsites.filter((s): s is string => typeof s === 'string')
    : []
  await tx.insert(mentorProfiles).values({ userId: input.userId, categories }).onConflictDoNothing()
  const [profile] = await tx
    .select({ id: mentorProfiles.id })
    .from(mentorProfiles)
    .where(eq(mentorProfiles.userId, input.userId))
  if (!profile || slugs.length === 0) return
  const ms = await tx
    .select({ id: microsites.id })
    .from(microsites)
    .where(inArray(microsites.slug, slugs))
  if (ms.length)
    await tx
      .insert(mentorMicrosites)
      .values(ms.map((m) => ({ mentorId: profile.id, micrositeId: m.id })))
      .onConflictDoNothing()
}

/** P47 `growLogsSummary` — counts only (admins never see GROW text). */
export async function growLogsSummary(userId: string) {
  const [profile] = await db
    .select({ id: mentorProfiles.id })
    .from(mentorProfiles)
    .where(eq(mentorProfiles.userId, userId))
  if (profile) {
    const [l] = await db
      .select({ n: count() })
      .from(growLogs)
      .where(eq(growLogs.mentorId, profile.id))
    const [m] = await db
      .select({ n: countDistinct(mentorMatches.menteeId) })
      .from(mentorMatches)
      .where(and(eq(mentorMatches.mentorId, profile.id), eq(mentorMatches.status, 'active')))
    return { growLogsSummary: { logs: Number(l?.n ?? 0), mentees: Number(m?.n ?? 0) } }
  }
  const [l] = await db.select({ n: count() }).from(growLogs).where(eq(growLogs.menteeId, userId))
  const logs = Number(l?.n ?? 0)
  return logs > 0 ? { growLogsSummary: { logs, mentees: 0 } } : {}
}
