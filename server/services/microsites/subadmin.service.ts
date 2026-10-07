import { db } from '@server/db/connection'
import { courseCertificates, enrolments, micrositeCourses } from '@server/db/schema/catalog'
import { invitations, users } from '@server/db/schema/identity'
import { type Microsite, memberships } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { notFound, validationFailed } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import { createInvitations } from '@server/services/identity/invitation.service'
import { claimImport, createImport } from '@server/services/imports.service'
import { micrositeKpi } from '@server/services/seams/dashboard.registry'
import { parseCsvObjects } from '@server/utils/csv'
import { email as emailSchema } from '@shared/schemas/common'
import type { InvitationsQuery, MembersQuery } from '@shared/schemas/microsites'
import { and, avg, count, desc, eq, gt, gte, ilike, inArray, or } from 'drizzle-orm'
import type { z } from 'zod'
import { EMPTY_LANDING, getLandingRow, toLandingDto } from './landing.service'
import { toMicrositeRef } from './lookup.service'
import { leaveMicrosite } from './membership.service'

/* ------------------------------------------------------------------ P35 */

export async function subAdminDashboard(m: Microsite, viewer: Viewer) {
  const courseIds = (
    await db
      .select({ id: micrositeCourses.courseId })
      .from(micrositeCourses)
      .where(eq(micrositeCourses.micrositeId, m.id))
  ).map((r) => r.id)
  const memberIds = db
    .select({ id: memberships.userId })
    .from(memberships)
    .where(eq(memberships.micrositeId, m.id))
  const [members] = await db
    .select({ n: count() })
    .from(memberships)
    .where(eq(memberships.micrositeId, m.id))
  const since = new Date(now().getTime() - 30 * 86_400_000)
  const [active] = await db
    .select({ n: count() })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.micrositeId, m.id), gte(users.lastLoginAt, since)))
  const [completions] = courseIds.length
    ? await db
        .select({ n: count() })
        .from(enrolments)
        .where(
          and(
            inArray(enrolments.courseId, courseIds),
            inArray(enrolments.userId, memberIds),
            eq(enrolments.state, 'completed'),
          ),
        )
    : [{ n: 0 }]
  const [certificates] = courseIds.length
    ? await db
        .select({ n: count() })
        .from(courseCertificates)
        .where(
          and(
            inArray(courseCertificates.courseId, courseIds),
            inArray(courseCertificates.userId, memberIds),
          ),
        )
    : [{ n: 0 }]
  const [pendingInvites] = await db
    .select({ n: count() })
    .from(invitations)
    .where(
      and(
        eq(invitations.micrositeId, m.id),
        eq(invitations.status, 'sent'),
        gt(invitations.expiresAt, now()),
      ),
    )

  const landing = await getLandingRow(m.id)
  const draft = landing?.draft ?? EMPTY_LANDING(m)
  return {
    microsite: {
      ...(await toMicrositeRef(m, viewer.id)),
      status: m.status as 'requested' | 'draft' | 'live' | 'archived',
      signInMode: m.signInMode as 'open' | 'invite_only' | 'landing_only',
      landingOnly: m.landingOnly,
    },
    kpis: {
      members: members?.n ?? 0,
      active30d: active?.n ?? 0,
      completions: completions?.n ?? 0,
      certificates: certificates?.n ?? 0,
      pendingInvites: pendingInvites?.n ?? 0,
      pendingResources: await micrositeKpi('pendingResources', m),
    },
    landing: await toLandingDto(draft, viewer.id),
    updatedAt: (landing?.updatedAt ?? m.updatedAt).toISOString(),
    ...(landing?.publishedAt ? { publishedAt: landing.publishedAt.toISOString() } : {}),
    hasUnpublishedChanges:
      !landing?.published || JSON.stringify(landing.published) !== JSON.stringify(landing.draft),
  }
}

/* ------------------------------------------------------------------ P40 members */

/** Name, e-mail, status, progress — never employee id, phone or profile details. */
export async function listMembers(m: Microsite, q: z.infer<typeof MembersQuery>) {
  const courseIds = (
    await db
      .select({ id: micrositeCourses.courseId })
      .from(micrositeCourses)
      .where(eq(micrositeCourses.micrositeId, m.id))
  ).map((r) => r.id)
  const where = and(
    eq(memberships.micrositeId, m.id),
    q.status ? eq(users.status, q.status) : undefined,
    q.q ? or(ilike(users.name, `%${q.q}%`), ilike(users.email, `%${q.q}%`)) : undefined,
  )
  const [total] = await db
    .select({ n: count() })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(where)
  const { limit, offset } = pageWindow(q)
  const rows = await db
    .select({ user: users, joinedAt: memberships.createdAt })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(where)
    .orderBy(users.name)
    .limit(limit)
    .offset(offset)
  const progress = new Map<string, number>()
  if (courseIds.length && rows.length) {
    const p = await db
      .select({ userId: enrolments.userId, pct: avg(enrolments.progressPct) })
      .from(enrolments)
      .where(
        and(
          inArray(enrolments.courseId, courseIds),
          inArray(
            enrolments.userId,
            rows.map((r) => r.user.id),
          ),
        ),
      )
      .groupBy(enrolments.userId)
    for (const r of p) progress.set(r.userId, Math.round(Number(r.pct ?? 0)))
  }
  return paged(
    rows.map((r) => ({
      userId: r.user.id,
      name: r.user.name,
      email: r.user.email,
      status: r.user.status as 'active' | 'disabled' | 'invited',
      joinedAt: r.joinedAt.toISOString(),
      progressPct: progress.get(r.user.id) ?? 0,
      ...(r.user.lastLoginAt ? { lastSignInAt: r.user.lastLoginAt.toISOString() } : {}),
    })),
    total?.n ?? 0,
    q,
  )
}

export async function inviteMembers(
  m: Microsite,
  viewer: Viewer,
  input: { emails: string[]; role: 'learner' | 'judge'; message?: string },
) {
  const result = await createInvitations({
    emails: input.emails,
    role: input.role,
    micrositeId: m.id,
    message: input.message ?? null,
    inviter: { id: viewer.id, name: viewer.name, ip: viewer.ip },
  })
  // Sub admins must not learn whether an address has an account elsewhere (security review L5).
  const generic = (r: string) =>
    r === 'account_disabled' || r === 'role_conflict' ? 'not_invitable' : r
  return {
    created: result.created.length,
    skipped: result.skipped.map((x) => ({
      ...x,
      reason: viewer.role === 'admin' ? x.reason : generic(x.reason),
    })),
  }
}

type CsvRow = { row: number; email: string; name?: string; valid: boolean; reason?: string }

/** P40 CSV step 1: parse and preview (≤ 5,000 rows, columns `email`, optional `name`). */
export async function previewInvitationCsv(m: Microsite, viewer: Viewer, text: string) {
  const { headers, rows } = parseCsvObjects(text)
  if (!headers.includes('email'))
    throw validationFailed({ file: 'The first row must contain an `email` column' })
  if (rows.length > 5000) throw validationFailed({ file: 'At most 5,000 rows' })
  const seen = new Set<string>()
  const preview: CsvRow[] = rows.map((r, i) => {
    const parsed = emailSchema.safeParse(r.email ?? '')
    const name = r.name || undefined
    if (!parsed.success)
      return {
        row: i + 2,
        email: r.email ?? '',
        ...(name ? { name } : {}),
        valid: false,
        reason: 'invalid_email',
      }
    if (seen.has(parsed.data))
      return {
        row: i + 2,
        email: parsed.data,
        ...(name ? { name } : {}),
        valid: false,
        reason: 'duplicate',
      }
    seen.add(parsed.data)
    return { row: i + 2, email: parsed.data, ...(name ? { name } : {}), valid: true }
  })
  const token = await createImport('invitations', m.id, preview, viewer.id)
  return { preview, token }
}

/** P40 CSV step 2: invites the valid rows of a confirmed preview (one import per microsite). */
export async function confirmInvitationCsv(m: Microsite, viewer: Viewer, token: string) {
  return db.transaction(async (tx) => {
    const rows = (await claimImport(tx, 'invitations', m.id, token, viewer.id)) as CsvRow[]
    const result = await createInvitations(
      {
        emails: rows.filter((r) => r.valid).map((r) => r.email),
        role: 'learner',
        micrositeId: m.id,
        inviter: { id: viewer.id, name: viewer.name, ip: viewer.ip },
      },
      tx,
    )
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'invitation.csv_import',
      target: { type: 'microsite', id: m.id, label: m.slug },
      micrositeId: m.id,
      ip: viewer.ip,
      meta: { created: result.created.length },
    })
    return {
      created: result.created.length,
      skipped: [
        ...rows
          .filter((r) => !r.valid)
          .map((r) => ({ email: r.email, reason: r.reason ?? 'invalid' })),
        ...result.skipped,
      ],
    }
  })
}

export async function listInvitations(m: Microsite, q: z.infer<typeof InvitationsQuery>) {
  const where = and(
    eq(invitations.micrositeId, m.id),
    q.status ? eq(invitations.status, q.status) : undefined,
  )
  const [total] = await db.select({ n: count() }).from(invitations).where(where)
  const { limit, offset } = pageWindow(q)
  const rows = await db
    .select()
    .from(invitations)
    .where(where)
    .orderBy(desc(invitations.createdAt))
    .limit(limit)
    .offset(offset)
  return paged(
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      status: (r.status === 'sent' && r.expiresAt < now() ? 'expired' : r.status) as
        | 'sent'
        | 'accepted'
        | 'revoked'
        | 'expired',
      sentAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    })),
    total?.n ?? 0,
    q,
  )
}

/** Removes the membership only (progress and certificates are kept). Audited. */
export async function removeMember(m: Microsite, viewer: Viewer, userId: string) {
  await db.transaction(async (tx) => {
    const removed = await leaveMicrosite(tx, userId, m.id)
    if (!removed) throw notFound()
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'membership.remove',
      target: { type: 'user', id: userId },
      micrositeId: m.id,
      ip: viewer.ip,
    })
  })
}
