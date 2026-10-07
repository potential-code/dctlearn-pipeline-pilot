import { env } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import { courses, micrositeCourses } from '@server/db/schema/catalog'
import { invitations, users } from '@server/db/schema/identity'
import {
  landingTemplates,
  type Microsite,
  memberships,
  micrositeLandings,
  micrositeRequests,
  microsites,
} from '@server/db/schema/microsites'
import { queueEmail } from '@server/jobs/email.job'
import { enqueue } from '@server/jobs/runtime'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, notFound, validationFailed } from '@server/lib/errors'
import { assertIfMatch } from '@server/lib/if-match'
import { findUserByEmail } from '@server/services/identity/accounts.service'
import { createInvitations } from '@server/services/identity/invitation.service'
import { toUserDto } from '@server/services/identity/user-dto'
import type { MicrositeInput, MicrositeUpdate } from '@shared/schemas/microsites'
import { and, count, desc, eq, inArray, ne } from 'drizzle-orm'
import type { z } from 'zod'
import { findMicrositeBySlug, toMicrositeRef } from './lookup.service'

/** P50 / P36 / P37 and microsite requests. Every change is audited. */

type Input = z.infer<typeof MicrositeInput>
type Update = z.infer<typeof MicrositeUpdate>

async function adminRow(m: Microsite, viewerId: string) {
  const [members] = await db
    .select({ n: count() })
    .from(memberships)
    .where(eq(memberships.micrositeId, m.id))
  const [courseCount] = await db
    .select({ n: count() })
    .from(micrositeCourses)
    .where(eq(micrositeCourses.micrositeId, m.id))
  const [sub] = m.subAdminId ? await db.select().from(users).where(eq(users.id, m.subAdminId)) : []
  return {
    ...(await toMicrositeRef(m, viewerId)),
    status: m.status as Microsite['status'] & ('requested' | 'draft' | 'live' | 'archived'),
    signInMode: m.signInMode as 'open' | 'invite_only' | 'landing_only',
    landingOnly: m.landingOnly,
    ...(sub ? { subAdmin: await toUserDto(sub, viewerId) } : {}),
    members: members?.n ?? 0,
    courses: courseCount?.n ?? 0,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }
}

export async function listMicrosites(viewer: Viewer) {
  const rows = await db.select().from(microsites).orderBy(microsites.sortOrder, microsites.slug)
  return Promise.all(rows.map((m) => adminRow(m, viewer.id)))
}

export async function getMicrositeDetail(m: Microsite, viewer: Viewer) {
  const list = await db
    .select()
    .from(micrositeCourses)
    .where(eq(micrositeCourses.micrositeId, m.id))
    .orderBy(micrositeCourses.sortOrder)
  return {
    ...(await adminRow(m, viewer.id)),
    templateId: m.templateId,
    subtitle: m.subtitle,
    ...(m.emailDomainRule ? { emailDomainRule: m.emailDomainRule } : {}),
    courseIds: list.map((r) => r.courseId),
    mandatoryCourseIds: list.filter((r) => r.isMandatory).map((r) => r.courseId),
    tabs: m.tabs,
    mentoringEnabled: m.mentoringEnabled,
    competitionEnabled: m.competitionEnabled,
  }
}

async function assertCoursesExist(tx: DbOrTx, ids: string[]) {
  if (ids.length === 0) return
  const found = await tx.select({ id: courses.id }).from(courses).where(inArray(courses.id, ids))
  if (found.length !== new Set(ids).size) throw validationFailed({ courseIds: 'Unknown course' })
}

async function assertTemplate(tx: DbOrTx, id: string) {
  const [t] = await tx
    .select({ id: landingTemplates.id })
    .from(landingTemplates)
    .where(eq(landingTemplates.id, id))
  if (!t) throw validationFailed({ templateId: 'Unknown landing template' })
}

/** Sub admin by e-mail: an existing sub admin is assigned now; anyone else is invited (role sub_admin). */
async function resolveSubAdmin(
  tx: DbOrTx,
  micrositeId: string,
  email: string | undefined,
  viewer: Viewer,
) {
  if (!email) return null
  // One sub-admin intent at a time: any other pending sub-admin invitation for this microsite is
  // revoked, so an old link can never take the microsite over later (security review M3).
  await tx
    .update(invitations)
    .set({ status: 'revoked', revokedAt: now() })
    .where(
      and(
        eq(invitations.micrositeId, micrositeId),
        eq(invitations.role, 'sub_admin'),
        eq(invitations.status, 'sent'),
        ne(invitations.email, email),
      ),
    )
  const existing = await findUserByEmail(tx, email)
  if (existing?.role === 'sub_admin' && existing.status === 'active') return existing.id
  if (existing && existing.role !== 'learner')
    throw validationFailed({ subAdminEmail: 'This account has another role' })
  await createInvitations(
    {
      emails: [email],
      role: 'sub_admin',
      micrositeId,
      inviter: { id: viewer.id, name: viewer.name, ip: viewer.ip },
    },
    tx as never,
  )
  return null
}

async function syncCourses(
  tx: DbOrTx,
  micrositeId: string,
  courseIds: string[],
  mandatory: string[],
) {
  const current = await tx
    .select()
    .from(micrositeCourses)
    .where(eq(micrositeCourses.micrositeId, micrositeId))
  const wanted = [...new Set(courseIds)]
  const removed = current.filter((c) => !wanted.includes(c.courseId)).map((c) => c.id)
  if (removed.length) await tx.delete(micrositeCourses).where(inArray(micrositeCourses.id, removed))
  const added: string[] = []
  for (const [i, courseId] of wanted.entries()) {
    const row = current.find((c) => c.courseId === courseId)
    if (row) {
      await tx
        .update(micrositeCourses)
        .set({ isMandatory: mandatory.includes(courseId), sortOrder: i })
        .where(eq(micrositeCourses.id, row.id))
    } else {
      await tx
        .insert(micrositeCourses)
        .values({ micrositeId, courseId, isMandatory: mandatory.includes(courseId), sortOrder: i })
      added.push(courseId)
    }
  }
  // Existing members are enrolled in newly added courses by a job, not in the request.
  if (added.length)
    await enqueue('microsites.enrol_members', { micrositeId, courseIds: added }, { tx })
}

function tabsFrom(input: { tabs: Input['tabs'] }) {
  return input.tabs.map((t) => ({ key: t.key, enabled: t.enabled, label: t.label }))
}

/** P36 create → draft. */
export async function createMicrosite(input: Input, viewer: Viewer) {
  if (await findMicrositeBySlug(input.id)) throw conflict('A microsite with this id already exists')
  if (input.mandatoryCourseIds.some((id) => !input.courseIds.includes(id)))
    throw validationFailed({ mandatoryCourseIds: 'Must be in the course list' })
  return db.transaction(async (tx) => {
    await assertTemplate(tx, input.templateId)
    await assertCoursesExist(tx, input.courseIds)
    const [m] = await tx
      .insert(microsites)
      .values({
        slug: input.id,
        name: input.name,
        subtitle: input.subtitle ?? { en: '', ar: '' },
        templateId: input.templateId,
        logoUrl: input.branding.logo,
        accentColor: input.branding.accentColor,
        heroUrl: input.branding.hero,
        signInMode: input.landingOnly ? 'landing_only' : input.signInMode,
        emailDomainRule: input.emailDomainRule || null,
        status: 'draft',
        landingOnly: input.landingOnly,
        tabs: tabsFrom(input),
        mentoringEnabled: input.mentoringEnabled,
        competitionEnabled: input.competitionEnabled,
      })
      .returning()
    const micrositeId = m!.id
    const subAdminId = await resolveSubAdmin(tx, micrositeId, input.subAdminEmail, viewer)
    if (subAdminId)
      await tx.update(microsites).set({ subAdminId }).where(eq(microsites.id, micrositeId))
    await syncCourses(tx, micrositeId, input.courseIds, input.mandatoryCourseIds)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'microsite.create',
      target: { type: 'microsite', id: micrositeId, label: input.id },
      micrositeId,
      ip: viewer.ip,
    })
    return { id: input.id }
  })
}

/** P50 edit sheet (ifMatch on updatedAt). */
export async function updateMicrosite(m: Microsite, input: Update, viewer: Viewer) {
  await db.transaction(async (tx) => {
    const [row] = await tx.select().from(microsites).where(eq(microsites.id, m.id)).for('update')
    if (!row) throw notFound()
    assertIfMatch(row.updatedAt, input.ifMatch)

    // Course list: only touched when sent. Mandatory ids must be in the (new or current) list.
    const current = await tx
      .select({ courseId: micrositeCourses.courseId, isMandatory: micrositeCourses.isMandatory })
      .from(micrositeCourses)
      .where(eq(micrositeCourses.micrositeId, m.id))
      .orderBy(micrositeCourses.sortOrder)
    const courseIds = input.courseIds ?? current.map((c) => c.courseId)
    const mandatoryIds =
      input.mandatoryCourseIds ?? current.filter((c) => c.isMandatory).map((c) => c.courseId)
    if (mandatoryIds.some((id) => !courseIds.includes(id)))
      throw validationFailed({ mandatoryCourseIds: 'Must be in the course list' })

    const landingOnly = input.landingOnly ?? row.landingOnly
    const tabs = input.tabs ? tabsFrom({ tabs: input.tabs }) : row.tabs
    // §9.1: a live microsite keeps at least one enabled tab (unless it is landing only).
    if (row.status === 'live' && !landingOnly && !tabs.some((t) => t.enabled))
      throw conflict('A live microsite needs at least one enabled tab')

    if (input.templateId) await assertTemplate(tx, input.templateId)
    if (input.courseIds) await assertCoursesExist(tx, input.courseIds)
    const subAdminId = input.subAdminEmail
      ? await resolveSubAdmin(tx, m.id, input.subAdminEmail, viewer)
      : row.subAdminId
    await tx
      .update(microsites)
      .set({
        name: input.name ?? row.name,
        subtitle: input.subtitle ?? row.subtitle,
        templateId: input.templateId ?? row.templateId,
        logoUrl: input.branding?.logo ?? row.logoUrl,
        accentColor: input.branding?.accentColor ?? row.accentColor,
        heroUrl: input.branding?.hero ?? row.heroUrl,
        signInMode: landingOnly ? 'landing_only' : (input.signInMode ?? row.signInMode),
        emailDomainRule:
          input.emailDomainRule === undefined ? row.emailDomainRule : input.emailDomainRule || null,
        landingOnly,
        tabs,
        mentoringEnabled: input.mentoringEnabled ?? row.mentoringEnabled,
        competitionEnabled: input.competitionEnabled ?? row.competitionEnabled,
        subAdminId: subAdminId ?? row.subAdminId,
      })
      .where(eq(microsites.id, m.id))
    if (input.courseIds || input.mandatoryCourseIds)
      await syncCourses(tx, m.id, courseIds, mandatoryIds)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'microsite.update',
      target: { type: 'microsite', id: m.id, label: m.slug },
      micrositeId: m.id,
      ip: viewer.ip,
    })
  })
  const fresh = await findMicrositeBySlug(m.slug)
  return getMicrositeDetail(fresh!, viewer)
}

const TRANSITIONS: Record<string, string[]> = {
  requested: ['draft'],
  draft: ['live'],
  live: ['archived'],
  archived: ['live'],
}

/** §9.1 microsite moves; draft → live needs a published landing and ≥ 1 tab (or landing only). */
export async function changeStatus(m: Microsite, status: string, viewer: Viewer) {
  if (!TRANSITIONS[m.status]?.includes(status))
    throw conflict(`Cannot move from ${m.status} to ${status}`)
  return db.transaction(async (tx) => {
    if (status === 'live' && m.status === 'draft') {
      const [landing] = await tx
        .select()
        .from(micrositeLandings)
        .where(eq(micrositeLandings.micrositeId, m.id))
      if (!landing?.published) throw conflict('Publish the landing page first')
      if (!m.landingOnly && !m.tabs.some((t) => t.enabled))
        throw conflict('Enable at least one tab')
    }
    await tx.update(microsites).set({ status }).where(eq(microsites.id, m.id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'microsite.status',
      target: { type: 'microsite', id: m.id, label: m.slug },
      micrositeId: m.id,
      ip: viewer.ip,
      meta: { from: m.status, to: status },
    })
    return { status }
  })
}

export async function listLandingTemplates() {
  const rows = await db.select().from(landingTemplates).orderBy(landingTemplates.id)
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    previewUrl: t.previewUrl,
    sections: t.sections,
  }))
}

/* ------------------------------------------------------------------ microsite requests */

export async function createMicrositeRequest(
  viewer: Viewer,
  input: { name: string; purpose: string },
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(micrositeRequests)
      .values({ requestedById: viewer.id, name: input.name, purpose: input.purpose })
      .returning()
    const admins = await tx
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.status, 'active')))
    for (const a of admins) {
      await queueEmail(
        a.email,
        'microsite-request-admin',
        {
          requestedBy: viewer.name,
          name: input.name,
          purpose: input.purpose,
          url: `${env.APP_URL}/admin/microsites`,
        },
        { tx },
      )
    }
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'microsite_request.create',
      target: { type: 'microsite_request', id: row!.id, label: input.name },
      ip: viewer.ip,
    })
    return { id: row!.id }
  })
}

export async function listMicrositeRequests(viewer: Viewer) {
  const rows = await db
    .select({ r: micrositeRequests, u: users })
    .from(micrositeRequests)
    .innerJoin(users, eq(users.id, micrositeRequests.requestedById))
    .orderBy(desc(micrositeRequests.createdAt))
  return Promise.all(
    rows.map(async ({ r, u }) => ({
      id: r.id,
      requestedBy: await toUserDto(u, viewer.id),
      name: r.name,
      purpose: r.purpose,
      status: r.status as 'requested' | 'approved' | 'rejected',
      requestedAt: r.createdAt.toISOString(),
    })),
  )
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 34)
  return base.length >= 2 ? base : 'microsite'
}

/** requested → approved: creates a draft microsite (the requester becomes its sub admin). */
export async function approveMicrositeRequest(id: string, viewer: Viewer) {
  return db.transaction(async (tx) => {
    const [r] = await tx
      .select()
      .from(micrositeRequests)
      .where(eq(micrositeRequests.id, id))
      .for('update')
    if (!r) throw notFound()
    if (r.status !== 'requested') throw conflict('This request was already decided')
    let slug = slugify(r.name)
    for (let i = 2; await findMicrositeBySlug(slug, tx); i++)
      slug = `${slugify(r.name).slice(0, 34)}-${i}`
    const [requester] = await tx.select().from(users).where(eq(users.id, r.requestedById))
    const [m] = await tx
      .insert(microsites)
      .values({
        slug,
        name: { en: r.name, ar: '' },
        status: 'draft',
        subAdminId: requester?.role === 'sub_admin' ? requester.id : null,
      })
      .returning()
    await tx
      .update(micrositeRequests)
      .set({ status: 'approved', micrositeId: m!.id, decidedById: viewer.id, decidedAt: now() })
      .where(eq(micrositeRequests.id, id))
    if (requester) {
      await queueEmail(
        requester.email,
        'microsite-request-approved',
        { name: requester.name, micrositeName: r.name, url: `${env.APP_URL}/${slug}/admin` },
        { tx },
      )
    }
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'microsite_request.approve',
      target: { type: 'microsite_request', id, label: r.name },
      micrositeId: m!.id,
      ip: viewer.ip,
    })
    return { micrositeId: slug }
  })
}

export async function rejectMicrositeRequest(id: string, note: string, viewer: Viewer) {
  await db.transaction(async (tx) => {
    const [r] = await tx
      .select()
      .from(micrositeRequests)
      .where(eq(micrositeRequests.id, id))
      .for('update')
    if (!r) throw notFound()
    if (r.status !== 'requested') throw conflict('This request was already decided')
    await tx
      .update(micrositeRequests)
      .set({ status: 'rejected', note, decidedById: viewer.id, decidedAt: now() })
      .where(eq(micrositeRequests.id, id))
    const [requester] = await tx.select().from(users).where(eq(users.id, r.requestedById))
    if (requester)
      await queueEmail(
        requester.email,
        'microsite-request-rejected',
        { name: requester.name, micrositeName: r.name, note },
        { tx },
      )
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'microsite_request.reject',
      target: { type: 'microsite_request', id, label: r.name },
      ip: viewer.ip,
    })
  })
}
