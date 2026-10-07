import { createHash } from 'node:crypto'
import { env } from '@server/config/env'
import { db } from '@server/db/connection'
import { courseCertificates, courses, enrolments, pointsLedger } from '@server/db/schema/catalog'
import { files } from '@server/db/schema/files'
import { formEntries, forms } from '@server/db/schema/forms'
import {
  accounts,
  auditLog,
  dataRequests,
  invitations,
  loginAttempts,
  sessions,
  userProfiles,
  users,
  verifications,
} from '@server/db/schema/identity'
import { jobRuns } from '@server/db/schema/jobs'
import {
  accessRequests,
  memberships,
  microsites,
  registerInterest,
} from '@server/db/schema/microsites'
import { queueEmail } from '@server/jobs/email.job'
import { enqueue } from '@server/jobs/runtime'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, notFound } from '@server/lib/errors'
import { logger } from '@server/lib/logger'
import { storage } from '@server/lib/storage'
import { gulfDate } from '@server/services/analytics/range'
import { storeGenerated } from '@server/services/files.service'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

/**
 * Personal data rights (contract §9.7). Export: a job builds a JSON file of the user's own data,
 * stores it privately and e-mails a link that only the same signed-in user can open for 24 h.
 * Deletion: the user asks, an admin confirms on P47 and the account is anonymised in place
 * (users are never hard-deleted, §9.2); audit entries are kept.
 */
export const DATA_EXPORT_JOB = 'platform.data_export'
export const EXPORT_CATEGORY = 'data-export'
export const EXPORT_TTL_MS = 24 * 3_600_000

type RequestRow = typeof dataRequests.$inferSelect

const accepted = (r: RequestRow) => ({
  id: r.id,
  kind: r.kind as 'export' | 'delete',
  status: (r.status === 'done' ? 'done' : 'requested') as 'requested' | 'done',
  requestedAt: r.createdAt.toISOString(),
})

async function openRequest(userId: string, kind: 'export' | 'delete') {
  const [row] = await db
    .select()
    .from(dataRequests)
    .where(
      and(
        eq(dataRequests.userId, userId),
        eq(dataRequests.kind, kind),
        eq(dataRequests.status, 'requested'),
      ),
    )
    .orderBy(desc(dataRequests.createdAt))
    .limit(1)
  return row ?? null
}

/** GET /me/export → 202. A pending request is reused, so repeated clicks queue one job. */
export async function requestExport(viewer: Viewer) {
  const pending = await openRequest(viewer.id, 'export')
  if (pending) return accepted(pending)
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(dataRequests)
      .values({ userId: viewer.id, kind: 'export', createdAt: now() })
      .returning()
    await enqueue(DATA_EXPORT_JOB, { requestId: row!.id }, { tx, maxAttempts: 3 })
    return accepted(row!)
  })
}

/** Everything the platform holds about the user that this area can see (Phase 1 tables). */
export async function collectUserData(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId))
  if (!u) return null
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
  const ms = await db
    .select({ slug: microsites.slug, name: microsites.name, m: memberships })
    .from(memberships)
    .innerJoin(microsites, eq(microsites.id, memberships.micrositeId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(microsites.slug))
  const enr = await db
    .select({ e: enrolments, slug: courses.slug, title: courses.title })
    .from(enrolments)
    .innerJoin(courses, eq(courses.id, enrolments.courseId))
    .where(eq(enrolments.userId, userId))
    .orderBy(asc(courses.slug))
  const certs = await db
    .select({ c: courseCertificates, title: courses.title })
    .from(courseCertificates)
    .innerJoin(courses, eq(courses.id, courseCertificates.courseId))
    .where(eq(courseCertificates.userId, userId))
    .orderBy(asc(courseCertificates.issuedAt))
  const points = await db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userId))
    .orderBy(asc(pointsLedger.at))
  const entries = await db
    .select({ f: formEntries, title: forms.title, slug: microsites.slug })
    .from(formEntries)
    .innerJoin(forms, eq(forms.id, formEntries.formId))
    .leftJoin(microsites, eq(microsites.id, formEntries.micrositeId))
    .where(eq(formEntries.userId, userId))
    .orderBy(asc(formEntries.submittedAt))
  const iso = (d: Date | null) => (d ? d.toISOString() : null)
  return {
    generatedAt: now().toISOString(),
    account: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      locale: u.locale,
      timezone: u.timezone,
      createdAt: u.createdAt.toISOString(),
      lastSignInAt: iso(u.lastLoginAt),
    },
    profile: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          country: profile.country,
          position: profile.position,
          department: profile.department,
          employmentType: profile.employmentType,
          seniorityLevel: profile.seniorityLevel,
          linkedinUrl: profile.linkedinUrl,
          mobile: profile.mobile,
          employeeId: profile.employeeId,
          sector: profile.sector,
          hireDate: profile.hireDate,
          level: profile.level,
          timeAtDct: profile.timeAtDct,
        }
      : null,
    memberships: ms.map((r) => ({
      microsite: r.slug,
      name: r.name,
      source: r.m.source,
      joinedAt: r.m.createdAt.toISOString(),
      lastVisitedAt: iso(r.m.lastVisitedAt),
    })),
    enrolments: enr.map((r) => ({
      course: r.slug,
      title: r.title,
      state: r.e.state,
      progressPct: r.e.progressPct,
      enrolledAt: r.e.enrolledAt.toISOString(),
      startedAt: iso(r.e.startedAt),
      completedAt: iso(r.e.completedAt),
    })),
    certificates: certs.map((r) => ({
      serial: r.c.serial,
      course: r.title,
      learnerName: r.c.learnerName,
      issuedAt: r.c.issuedAt.toISOString(),
    })),
    points: points.map((p) => ({
      points: p.points,
      sourceType: p.sourceType,
      reason: p.reason,
      at: p.at.toISOString(),
    })),
    formEntries: entries.map((r) => ({
      form: r.title,
      microsite: r.slug,
      answers: r.f.answers,
      submittedAt: r.f.submittedAt.toISOString(),
    })),
  }
}

/** The job: build, store privately, mark done, e-mail the link. Idempotent per request. */
export async function buildDataExport(requestId: string) {
  const [req] = await db.select().from(dataRequests).where(eq(dataRequests.id, requestId))
  if (req?.kind !== 'export' || req.status !== 'requested') return
  const data = await collectUserData(req.userId)
  if (!data) return
  const [u] = await db.select().from(users).where(eq(users.id, req.userId))
  if (!u || u.anonymisedAt) {
    await db.update(dataRequests).set({ status: 'rejected' }).where(eq(dataRequests.id, req.id))
    return
  }
  const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2))
  await db.transaction(async (tx) => {
    const file = await storeGenerated(
      bytes,
      {
        category: EXPORT_CATEGORY,
        contentType: 'application/json',
        ext: '.json',
        ownerId: req.userId,
        name: `dct-learn-data-${gulfDate(now())}.json`,
      },
      tx,
    )
    await tx
      .update(dataRequests)
      .set({ status: 'done', fileKey: file.id, decidedAt: now() })
      .where(eq(dataRequests.id, req.id))
    await queueEmail(
      u.email,
      'data-export',
      { name: u.name, url: `${env.APP_URL}/api/me/exports/${req.id}`, ar: u.locale === 'ar' },
      { locale: u.locale === 'ar' ? 'ar' : 'en', tx },
    )
  })
}

/** GET /me/exports/{id}: own only (404 otherwise), ready, and within 24 h. */
export async function downloadOwnExport(id: string, viewer: Viewer) {
  const [req] = await db
    .select()
    .from(dataRequests)
    .where(
      and(
        eq(dataRequests.id, id),
        eq(dataRequests.userId, viewer.id),
        eq(dataRequests.kind, 'export'),
      ),
    )
  if (!req) throw notFound()
  if (req.status === 'requested') throw conflict('Your export is still being prepared')
  if (req.status !== 'done' || !req.fileKey || !req.decidedAt) throw notFound()
  if (now().getTime() - req.decidedAt.getTime() > EXPORT_TTL_MS) throw notFound()
  const [file] = await db.select().from(files).where(eq(files.id, req.fileKey))
  const bytes = file ? await storage().get(file.key) : null
  if (!file || !bytes) throw notFound()
  return { bytes, name: file.originalName, contentType: file.contentType }
}

/** POST /me/delete-request → 202. Idempotent while a request is open. */
export async function requestDeletion(viewer: Viewer) {
  const pending = await openRequest(viewer.id, 'delete')
  if (pending) return accepted(pending)
  return db.transaction(async (tx) => {
    const at = now()
    await tx.update(users).set({ deleteRequestedAt: at }).where(eq(users.id, viewer.id))
    const [row] = await tx
      .insert(dataRequests)
      .values({ userId: viewer.id, kind: 'delete', createdAt: at })
      .returning()
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'user.delete_request',
      target: { type: 'user', id: viewer.id, label: viewer.name },
      ip: viewer.ip,
    })
    return accepted(row!)
  })
}

export const ANONYMISED_NAME = 'Deleted user'

export function anonymisedEmail(userId: string, email: string) {
  const sha = createHash('sha256').update(`${userId}:${email.toLowerCase()}`).digest('hex')
  return `deleted+${sha.slice(0, 40)}@anonymised.invalid`
}

/**
 * Admin confirms a deletion request (P47). Only with an open request; never one's own account.
 * Name → "Deleted user", e-mail hashed, profile cleared, certificates keep their serial but drop
 * the name, sessions and credentials removed, status disabled, data exports deleted. Existing
 * audit entries stay (append-only); one more records the anonymisation. Audit: yes.
 */
export async function anonymiseUser(id: string, viewer: Viewer) {
  const removedKeys: string[] = []
  const result = await db.transaction(async (tx) => {
    const [u] = await tx.select().from(users).where(eq(users.id, id)).for('update')
    if (!u) throw notFound()
    if (u.id === viewer.id) throw conflict('You cannot anonymise your own account')
    if (u.anonymisedAt) throw conflict('This account is already anonymised')
    const [req] = await tx
      .select()
      .from(dataRequests)
      .where(
        and(
          eq(dataRequests.userId, id),
          eq(dataRequests.kind, 'delete'),
          eq(dataRequests.status, 'requested'),
        ),
      )
      .limit(1)
    if (!req && !u.deleteRequestedAt) throw conflict('This user has not asked for deletion')

    const at = now()
    const oldEmail = u.email
    const newEmail = anonymisedEmail(u.id, u.email)
    await tx
      .update(users)
      .set({
        name: ANONYMISED_NAME,
        email: newEmail,
        image: null,
        status: 'disabled',
        emailVerified: false,
        legacyId: null,
        anonymisedAt: at,
      })
      .where(eq(users.id, id))
    await tx
      .update(userProfiles)
      .set({
        firstName: '',
        lastName: '',
        country: '',
        position: '',
        department: '',
        employmentType: '',
        seniorityLevel: '',
        linkedinUrl: '',
        mobile: '',
        employeeId: null,
        sector: null,
        hireDate: null,
        level: null,
        timeAtDct: null,
      })
      .where(eq(userProfiles.userId, id))
    // Serial kept, name dropped; the cached PDF still shows the name, so it is rebuilt.
    await tx
      .update(courseCertificates)
      .set({ learnerName: '', pdfKey: null })
      .where(eq(courseCertificates.userId, id))
    // Free-text personal data elsewhere (security review M6).
    await tx.update(formEntries).set({ answers: {} }).where(eq(formEntries.userId, id))
    await tx.delete(accessRequests).where(eq(accessRequests.userId, id))
    await tx.delete(registerInterest).where(eq(registerInterest.email, oldEmail))
    await tx
      .delete(jobRuns)
      .where(and(eq(jobRuns.name, 'email.send'), sql`${jobRuns.payload}->>'to' = ${oldEmail}`))
    // The audit trail stays (append-only) but must not link "Deleted user" back to the e-mail.
    await tx
      .update(auditLog)
      .set({ targetLabel: sql`replace(${auditLog.targetLabel}, ${oldEmail}, ${newEmail})` })
      .where(sql`${auditLog.targetLabel} like ${`%${oldEmail}%`}`)
    // Profile photos the user uploaded.
    const photos = await tx
      .delete(files)
      .where(and(eq(files.ownerId, id), eq(files.category, 'image')))
      .returning({ key: files.key })
    removedKeys.push(...photos.map((p) => p.key))
    await tx.delete(sessions).where(eq(sessions.userId, id))
    await tx.delete(accounts).where(eq(accounts.userId, id))
    await tx.delete(verifications).where(eq(verifications.identifier, oldEmail))
    await tx.delete(loginAttempts).where(eq(loginAttempts.email, oldEmail))
    await tx.update(invitations).set({ email: newEmail }).where(eq(invitations.email, oldEmail))

    // Earlier data exports hold the personal data in full: remove them.
    const exportsOf = await tx
      .select({ id: dataRequests.id, fileKey: dataRequests.fileKey })
      .from(dataRequests)
      .where(and(eq(dataRequests.userId, id), eq(dataRequests.kind, 'export')))
    const fileIds = exportsOf.map((e) => e.fileKey).filter((k): k is string => Boolean(k))
    if (fileIds.length) {
      await tx
        .update(dataRequests)
        .set({ fileKey: null })
        .where(
          inArray(
            dataRequests.id,
            exportsOf.map((e) => e.id),
          ),
        )
      const gone = await tx
        .delete(files)
        .where(and(inArray(files.id, fileIds), eq(files.category, EXPORT_CATEGORY)))
        .returning({ key: files.key })
      removedKeys.push(...gone.map((g) => g.key))
    }

    await tx
      .update(dataRequests)
      .set({ status: 'done', decidedById: viewer.id, decidedAt: at })
      .where(
        and(
          eq(dataRequests.userId, id),
          eq(dataRequests.kind, 'delete'),
          eq(dataRequests.status, 'requested'),
        ),
      )
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'user.anonymise',
      target: { type: 'user', id, label: ANONYMISED_NAME },
      ip: viewer.ip,
    })
    return { id, anonymisedAt: at.toISOString() }
  })
  for (const key of removedKeys)
    await storage()
      .delete(key)
      .catch((err) => logger.warn({ err, key }, 'Could not delete data export'))
  return result
}
