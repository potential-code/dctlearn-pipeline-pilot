import { env } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import { externalCertificates } from '@server/db/schema/achievements'
import { courses, micrositeCourses } from '@server/db/schema/catalog'
import { files } from '@server/db/schema/files'
import { users } from '@server/db/schema/identity'
import { type Microsite, microsites } from '@server/db/schema/microsites'
import { queueEmail } from '@server/jobs/email.job'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, notFound, validationFailed } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import { fileUrl, storeUpload } from '@server/services/files.service'
import { toUserDto } from '@server/services/identity/user-dto'
import { completeCourse } from '@server/services/seams/course-completion.seam'
import type { ExternalCertsQuery } from '@shared/schemas/achievements'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import type { z } from 'zod'

/**
 * External certificates (Nibras, §9.1): learner uploads (own, type by content, Audit) →
 * admin approves (completes the course through the completion seam) or rejects with a note;
 * a new upload after a rejection goes back to `pending`.
 */

async function notifyAdmins(
  tx: DbOrTx,
  data: { learnerName: string; courseTitle: string; micrositeName: string },
) {
  const admins = await tx
    .select({ email: users.email, locale: users.locale })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.status, 'active')))
  for (const a of admins)
    await queueEmail(
      a.email,
      'admin-external-cert-uploaded',
      { ...data, url: `${env.APP_URL}/admin/achievements` },
      { tx, locale: a.locale === 'ar' ? 'ar' : 'en' },
    )
}

/** POST /api/microsites/{p}/external-certificates */
export async function uploadExternalCertificate(
  viewer: Viewer,
  m: Microsite,
  courseId: string,
  file: { buffer: Buffer; mimetype: string; originalname: string },
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ course: courses })
      .from(micrositeCourses)
      .innerJoin(courses, eq(courses.id, micrositeCourses.courseId))
      .where(and(eq(micrositeCourses.micrositeId, m.id), eq(micrositeCourses.courseId, courseId)))
    if (row?.course.status !== 'published') throw notFound()
    if (!row.course.externalCertificate)
      throw validationFailed({ courseId: 'This course does not take an external certificate' })
    // Two first uploads at once would both insert: serialise per user and course (review L10).
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`extcert:${viewer.id}:${courseId}`}))`,
    )
    const [existing] = await tx
      .select()
      .from(externalCertificates)
      .where(
        and(
          eq(externalCertificates.userId, viewer.id),
          eq(externalCertificates.courseId, courseId),
        ),
      )
      .for('update')
    if (existing?.status === 'approved') throw conflict('This certificate was already approved')
    const stored = await storeUpload(
      {
        bytes: new Uint8Array(file.buffer),
        declaredMime: file.mimetype,
        originalName: file.originalname,
        category: 'certificate',
        ownerId: viewer.id,
      },
      tx,
    )
    const values = {
      fileId: stored.id,
      micrositeId: m.id,
      status: 'pending',
      note: null,
      uploadedAt: now(),
      decidedAt: null,
      decidedById: null,
    }
    const [saved] = existing
      ? await tx
          .update(externalCertificates)
          .set(values)
          .where(eq(externalCertificates.id, existing.id))
          .returning()
      : await tx
          .insert(externalCertificates)
          .values({ userId: viewer.id, courseId, ...values })
          .returning()
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'external_certificate.upload',
      target: { type: 'external_certificate', id: saved!.id, label: row.course.title.en },
      micrositeId: m.id,
      ip: viewer.ip,
    })
    await notifyAdmins(tx, {
      learnerName: viewer.name,
      courseTitle: row.course.title.en,
      micrositeName: m.name.en,
    })
    return { id: saved!.id, status: 'pending' as const }
  })
}

/** DELETE own upload; an approved certificate cannot be withdrawn (409). */
export async function deleteExternalCertificate(viewer: Viewer, m: Microsite, id: string) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(externalCertificates)
      .where(
        and(
          eq(externalCertificates.id, id),
          eq(externalCertificates.userId, viewer.id),
          eq(externalCertificates.micrositeId, m.id),
        ),
      )
      .for('update')
    if (!row) throw notFound()
    if (row.status === 'approved') throw conflict('An approved certificate cannot be removed')
    await tx.delete(externalCertificates).where(eq(externalCertificates.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'external_certificate.delete',
      target: { type: 'external_certificate', id },
      micrositeId: m.id,
      ip: viewer.ip,
    })
  })
}

/* ---------------------------------------------------------------- P58 admin */

export async function listExternalCertificates(
  viewer: Viewer,
  query: z.infer<typeof ExternalCertsQuery>,
) {
  const where = query.status ? eq(externalCertificates.status, query.status) : undefined
  const [total] = await db.select({ n: count() }).from(externalCertificates).where(where)
  const rows = await db
    .select({
      ext: externalCertificates,
      user: users,
      course: courses,
      file: files,
      micrositeSlug: microsites.slug,
    })
    .from(externalCertificates)
    .innerJoin(users, eq(users.id, externalCertificates.userId))
    .innerJoin(courses, eq(courses.id, externalCertificates.courseId))
    .innerJoin(files, eq(files.id, externalCertificates.fileId))
    .innerJoin(microsites, eq(microsites.id, externalCertificates.micrositeId))
    .where(where)
    .orderBy(desc(externalCertificates.uploadedAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  return paged(
    await Promise.all(
      rows.map(async (r) => ({
        id: r.ext.id,
        user: await toUserDto(r.user, viewer.id),
        microsite: r.micrositeSlug,
        course: { id: r.course.id, title: r.course.title },
        fileUrl: fileUrl(r.file, viewer.id),
        uploadedAt: r.ext.uploadedAt.toISOString(),
        status: r.ext.status as 'pending' | 'approved' | 'rejected',
      })),
    ),
    total?.n ?? 0,
    query,
  )
}

async function decide(
  id: string,
  viewer: Viewer,
  decision: 'approved' | 'rejected',
  note: string | null,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ ext: externalCertificates, course: courses, user: users })
      .from(externalCertificates)
      .innerJoin(courses, eq(courses.id, externalCertificates.courseId))
      .innerJoin(users, eq(users.id, externalCertificates.userId))
      .where(eq(externalCertificates.id, id))
      .for('update', { of: externalCertificates })
    if (!row) throw notFound()
    if (row.ext.status !== 'pending')
      throw conflict(`This certificate is already ${row.ext.status}`)
    await tx
      .update(externalCertificates)
      .set({ status: decision, note, decidedAt: now(), decidedById: viewer.id })
      .where(eq(externalCertificates.id, id))
    if (decision === 'approved')
      await completeCourse(tx, {
        userId: row.ext.userId,
        courseId: row.ext.courseId,
        actorId: viewer.id,
      })
    await recordAudit(tx, {
      actorId: viewer.id,
      action: `external_certificate.${decision === 'approved' ? 'approve' : 'reject'}`,
      target: { type: 'external_certificate', id, label: row.course.title.en },
      micrositeId: row.ext.micrositeId,
      ip: viewer.ip,
      ...(note ? { meta: { note } } : {}),
    })
    const ar = row.user.locale === 'ar'
    await queueEmail(
      row.user.email,
      decision === 'approved' ? 'external-cert-approved' : 'external-cert-rejected',
      {
        name: row.user.name,
        courseTitle: ar ? row.course.title.ar || row.course.title.en : row.course.title.en,
        ...(note ? { note } : {}),
        url: `${env.APP_URL}/achievements`,
      },
      { tx, locale: ar ? 'ar' : 'en' },
    )
    return { id, status: decision }
  })
}

export const approveExternalCertificate = (id: string, viewer: Viewer) =>
  decide(id, viewer, 'approved', null)
export const rejectExternalCertificate = (id: string, note: string, viewer: Viewer) =>
  decide(id, viewer, 'rejected', note)

/** P47 user detail section. */
export async function externalCertificatesOf(userId: string) {
  const rows = await db
    .select({ ext: externalCertificates, title: courses.title })
    .from(externalCertificates)
    .innerJoin(courses, eq(courses.id, externalCertificates.courseId))
    .where(eq(externalCertificates.userId, userId))
    .orderBy(desc(externalCertificates.uploadedAt))
  return {
    externalCertificates: rows.map((r) => ({
      id: r.ext.id,
      courseTitle: r.title,
      status: r.ext.status as 'pending' | 'approved' | 'rejected',
      uploadedAt: r.ext.uploadedAt.toISOString(),
    })),
  }
}
