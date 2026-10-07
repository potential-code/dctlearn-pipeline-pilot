import { env } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import { type Microsite, microsites } from '@server/db/schema/microsites'
import { type ResourceRow, resources } from '@server/db/schema/resources'
import { queueEmail } from '@server/jobs/email.job'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, notFound, validationFailed } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import { storeUpload, urlForStored } from '@server/services/files.service'
import { toUserDto } from '@server/services/identity/user-dto'
import { toMicrositeRef } from '@server/services/microsites/lookup.service'
import type {
  AdminResourcesQuery,
  HubResourcesQuery,
  ResourceInput,
  SubResourcesQuery,
} from '@shared/schemas/resources'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import type { z } from 'zod'

/**
 * Resources (§9.1): sub admin creates → pending; admin approves / rejects (audited, the
 * submitter is told); any edit by the sub admin puts it back to pending (and admins are told).
 * https links or uploaded PDFs only; soft delete; learners see approved only.
 */

export type UploadedFile = { bytes: Uint8Array; mime: string; name: string }

const notDeleted = isNull(resources.deletedAt)

async function resourceUrl(r: ResourceRow, viewerId: string) {
  if (r.type === 'pdf') return urlForStored(r.fileId, viewerId)
  return r.url ?? ''
}

async function findInMicrosite(id: string, m: Microsite, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(resources)
    .where(and(eq(resources.id, id), eq(resources.micrositeId, m.id), notDeleted))
    .for('update')
  if (!row) throw notFound()
  return row
}

async function notifyAdmins(tx: DbOrTx, m: Microsite, title: string, by: Viewer) {
  const admins = await tx
    .select({ email: users.email, locale: users.locale })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.status, 'active')))
  for (const a of admins) {
    await queueEmail(
      a.email,
      'admin-resource-pending',
      {
        resourceTitle: title,
        microsite: m.name.en,
        submittedBy: by.name,
        url: `${env.APP_URL}/admin/resources`,
      },
      { tx, locale: a.locale === 'ar' ? 'ar' : 'en' },
    )
  }
}

async function subDto(r: ResourceRow, viewerId: string) {
  return {
    id: r.id,
    title: r.title,
    url: await resourceUrl(r, viewerId),
    type: r.type as 'link' | 'pdf',
    status: r.status as 'pending' | 'approved' | 'rejected',
    ...(r.reviewNote ? { reviewNote: r.reviewNote } : {}),
    submittedAt: r.submittedAt.toISOString(),
  }
}

/** Link or PDF from the request; on edit, neither keeps the current one. */
async function source(
  input: ResourceInput,
  file: UploadedFile | undefined,
  viewer: Viewer,
  tx: DbOrTx,
  current?: ResourceRow,
) {
  if (file && input.url) throw validationFailed({ url: 'Choose a link or a PDF, not both' })
  if (file) {
    const stored = await storeUpload(
      {
        bytes: file.bytes,
        declaredMime: file.mime,
        originalName: file.name,
        category: 'pdf',
        ownerId: viewer.id,
      },
      tx,
    )
    return { type: 'pdf', url: null, fileId: stored.id }
  }
  if (input.url) return { type: 'link', url: input.url, fileId: null }
  if (current) return { type: current.type, url: current.url, fileId: current.fileId }
  throw validationFailed({ url: 'Add an https link or upload a PDF' })
}

/* ------------------------------------------------------------------ P53 sub admin */

export async function listSubResources(
  m: Microsite,
  query: z.infer<typeof SubResourcesQuery>,
  viewer: Viewer,
) {
  const where = and(
    eq(resources.micrositeId, m.id),
    notDeleted,
    query.status ? eq(resources.status, query.status) : undefined,
  )
  const [total] = await db.select({ n: count() }).from(resources).where(where)
  const rows = await db
    .select()
    .from(resources)
    .where(where)
    .orderBy(desc(resources.submittedAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  return paged(await Promise.all(rows.map((r) => subDto(r, viewer.id))), total?.n ?? 0, query)
}

export async function createResource(
  m: Microsite,
  input: ResourceInput,
  file: UploadedFile | undefined,
  viewer: Viewer,
) {
  const row = await db.transaction(async (tx) => {
    const src = await source(input, file, viewer, tx)
    const [created] = await tx
      .insert(resources)
      .values({
        micrositeId: m.id,
        title: input.title,
        ...src,
        imageUrl: input.imageUrl || null,
        status: 'pending',
        submittedById: viewer.id,
        submittedAt: now(),
      })
      .returning()
    await notifyAdmins(tx, m, input.title.en, viewer)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'resource.create',
      target: { type: 'resource', id: created!.id, label: input.title.en },
      micrositeId: m.id,
      ip: viewer.ip,
    })
    return created!
  })
  return subDto(row, viewer.id)
}

/** §9.1: approved → pending and rejected → pending on edit (resubmission). */
export async function updateResource(
  m: Microsite,
  id: string,
  input: ResourceInput,
  file: UploadedFile | undefined,
  viewer: Viewer,
) {
  const row = await db.transaction(async (tx) => {
    const current = await findInMicrosite(id, m, tx)
    const src = await source(input, file, viewer, tx, current)
    const [updated] = await tx
      .update(resources)
      .set({
        title: input.title,
        ...src,
        imageUrl: input.imageUrl === undefined ? current.imageUrl : input.imageUrl || null,
        status: 'pending',
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
        submittedById: viewer.id,
        submittedAt: now(),
      })
      .where(eq(resources.id, id))
      .returning()
    if (current.status !== 'pending') await notifyAdmins(tx, m, input.title.en, viewer)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'resource.update',
      target: { type: 'resource', id, label: input.title.en },
      micrositeId: m.id,
      ip: viewer.ip,
      meta: { from: current.status, to: 'pending' },
    })
    return updated!
  })
  return subDto(row, viewer.id)
}

/** Soft delete (§9.2). */
export async function deleteResource(m: Microsite, id: string, viewer: Viewer) {
  await db.transaction(async (tx) => {
    const current = await findInMicrosite(id, m, tx)
    await tx.update(resources).set({ deletedAt: now() }).where(eq(resources.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'resource.delete',
      target: { type: 'resource', id, label: current.title.en },
      micrositeId: m.id,
      ip: viewer.ip,
    })
  })
}

/* ------------------------------------------------------------------ P54 admin */

export async function listAdminResources(
  query: z.infer<typeof AdminResourcesQuery>,
  viewer: Viewer,
) {
  const where = and(notDeleted, eq(resources.status, query.status))
  const [total] = await db.select({ n: count() }).from(resources).where(where)
  const rows = await db
    .select({ r: resources, m: microsites, u: users })
    .from(resources)
    .innerJoin(microsites, eq(microsites.id, resources.micrositeId))
    .innerJoin(users, eq(users.id, resources.submittedById))
    .where(where)
    .orderBy(desc(resources.submittedAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const items = await Promise.all(
    rows.map(async ({ r, m, u }) => ({
      id: r.id,
      microsite: await toMicrositeRef(m, viewer.id),
      title: r.title,
      url: await resourceUrl(r, viewer.id),
      submittedBy: await toUserDto(u, viewer.id),
      submittedAt: r.submittedAt.toISOString(),
    })),
  )
  return paged(items, total?.n ?? 0, query)
}

/** §9.1 `pending → approved / rejected` only (409 otherwise). Audited; submitter is told. */
export async function reviewResource(
  id: string,
  decision: { approve: true } | { approve: false; note: string },
  viewer: Viewer,
) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ r: resources, m: microsites, u: users })
      .from(resources)
      .innerJoin(microsites, eq(microsites.id, resources.micrositeId))
      .innerJoin(users, eq(users.id, resources.submittedById))
      .where(and(eq(resources.id, id), notDeleted))
      .for('update', { of: resources })
    if (!row) throw notFound()
    if (row.r.status !== 'pending') throw conflict('Only pending resources can be reviewed')
    const status = decision.approve ? 'approved' : 'rejected'
    const note = decision.approve ? null : decision.note
    await tx
      .update(resources)
      .set({ status, reviewNote: note, reviewedById: viewer.id, reviewedAt: now() })
      .where(eq(resources.id, id))
    await queueEmail(
      row.u.email,
      decision.approve ? 'resource-approved' : 'resource-rejected',
      {
        name: row.u.name,
        resourceTitle: row.r.title.en,
        microsite: row.m.name.en,
        note,
        url: `${env.APP_URL}/${row.m.slug}/admin/resources`,
      },
      { tx, locale: row.u.locale === 'ar' ? 'ar' : 'en' },
    )
    await recordAudit(tx, {
      actorId: viewer.id,
      action: decision.approve ? 'resource.approve' : 'resource.reject',
      target: { type: 'resource', id, label: row.r.title.en },
      micrositeId: row.m.id,
      ip: viewer.ip,
    })
  })
  return { ok: true as const }
}

/* ------------------------------------------------------------------ learners, KPI */

const approvedIn = (micrositeId: string) =>
  and(eq(resources.micrositeId, micrositeId), eq(resources.status, 'approved'), notDeleted)

async function learnerDto(r: ResourceRow, viewerId: string) {
  const imageUrl = await urlForStored(r.imageUrl, viewerId)
  return {
    id: r.id,
    title: r.title,
    url: await resourceUrl(r, viewerId),
    ...(imageUrl ? { imageUrl } : {}),
  }
}

export async function listHubResources(
  viewer: Viewer,
  m: Microsite,
  query: z.infer<typeof HubResourcesQuery>,
) {
  const where = and(approvedIn(m.id), query.type ? eq(resources.type, query.type) : undefined)
  const [total] = await db.select({ n: count() }).from(resources).where(where)
  const rows = await db
    .select()
    .from(resources)
    .where(where)
    .orderBy(desc(resources.reviewedAt), desc(resources.submittedAt))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const items = await Promise.all(
    rows.map(async (r) => {
      const dto = await learnerDto(r, viewer.id)
      return {
        id: dto.id,
        title: dto.title,
        type: r.type as 'link' | 'pdf',
        url: dto.url,
        ...(dto.imageUrl ? { imageUrl: dto.imageUrl } : {}),
      }
    }),
  )
  return paged(items, total?.n ?? 0, query)
}

/** P14: max 4, approved only. */
export async function dashboardResources(viewer: Viewer, m: Microsite) {
  const rows = await db
    .select()
    .from(resources)
    .where(approvedIn(m.id))
    .orderBy(desc(resources.reviewedAt), desc(resources.submittedAt))
    .limit(4)
  return Promise.all(rows.map((r) => learnerDto(r, viewer.id)))
}

/** P35 `pendingResources`. */
export async function pendingResourceCount(m: Microsite) {
  const [row] = await db
    .select({ n: count() })
    .from(resources)
    .where(and(eq(resources.micrositeId, m.id), eq(resources.status, 'pending'), notDeleted))
  return row?.n ?? 0
}
