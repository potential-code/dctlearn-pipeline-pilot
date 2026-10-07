import { auth } from '@server/auth/auth'
import { env } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import { courseCertificates, courses } from '@server/db/schema/catalog'
import { auditLog, sessions, userProfiles, users } from '@server/db/schema/identity'
import { memberships, microsites } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { conflict, notFound, validationFailed } from '@server/lib/errors'
import { assertIfMatch } from '@server/lib/if-match'
import { paged, pageWindow } from '@server/lib/pagination'
import { pointsTotal } from '@server/services/catalog/points.service'
import { claimImport, createImport } from '@server/services/imports.service'
import { joinMicrosite, leaveMicrosite } from '@server/services/microsites/membership.service'
import { userDetailSections } from '@server/services/seams/user-detail.registry'
import { parseCsvObjects } from '@server/utils/csv'
import { ROLES } from '@shared/roles'
import type { AdminUserUpdate, AuditQuery, UsersQuery } from '@shared/schemas/admin-users'
import { email as emailSchema } from '@shared/schemas/common'
import { and, count, desc, eq, gte, ilike, inArray, lte, or } from 'drizzle-orm'
import type { z } from 'zod'
import { createCredentialUser, findUserByEmail } from './accounts.service'
import { toUserDto } from './user-dto'

/** P47 users & roles. Full profile visible to admins; every change audited. */

async function slugsByUser(userIds: string[]) {
  const map = new Map<string, string[]>()
  if (userIds.length === 0) return map
  const rows = await db
    .select({ userId: memberships.userId, slug: microsites.slug })
    .from(memberships)
    .innerJoin(microsites, eq(microsites.id, memberships.micrositeId))
    .where(inArray(memberships.userId, userIds))
  for (const r of rows) map.set(r.userId, [...(map.get(r.userId) ?? []), r.slug])
  return map
}

async function row(u: typeof users.$inferSelect, slugs: string[], viewerId: string) {
  return {
    ...(await toUserDto(u, viewerId)),
    microsites: slugs.sort(),
    joinedAt: u.createdAt.toISOString(),
    ...(u.lastLoginAt ? { lastSignInAt: u.lastLoginAt.toISOString() } : {}),
    ...(u.legacyId ? { legacyId: u.legacyId } : {}),
  }
}

export async function listUsers(q: z.infer<typeof UsersQuery>, viewer: Viewer) {
  let micrositeFilter: ReturnType<typeof inArray> | undefined
  if (q.microsite) {
    const [m] = await db
      .select({ id: microsites.id })
      .from(microsites)
      .where(eq(microsites.slug, q.microsite))
    if (!m) return paged([], 0, q)
    micrositeFilter = inArray(
      users.id,
      db
        .select({ id: memberships.userId })
        .from(memberships)
        .where(eq(memberships.micrositeId, m.id)),
    )
  }
  const where = and(
    q.role ? eq(users.role, q.role) : undefined,
    q.status ? eq(users.status, q.status) : undefined,
    q.q ? or(ilike(users.name, `%${q.q}%`), ilike(users.email, `%${q.q}%`)) : undefined,
    micrositeFilter,
  )
  const [total] = await db.select({ n: count() }).from(users).where(where)
  const { limit, offset } = pageWindow(q)
  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(users.name)
    .limit(limit)
    .offset(offset)
  const slugs = await slugsByUser(rows.map((r) => r.id))
  return paged(
    await Promise.all(rows.map((u) => row(u, slugs.get(u.id) ?? [], viewer.id))),
    total?.n ?? 0,
    q,
  )
}

export async function getUserDetail(id: string, viewer: Viewer) {
  const [u] = await db.select().from(users).where(eq(users.id, id))
  if (!u) throw notFound()
  const [p] = await db.select().from(userProfiles).where(eq(userProfiles.userId, id))
  const slugs = (await slugsByUser([id])).get(id) ?? []
  const certs = await db
    .select({ c: courseCertificates, title: courses.title })
    .from(courseCertificates)
    .innerJoin(courses, eq(courses.id, courseCertificates.courseId))
    .where(eq(courseCertificates.userId, id))
    .orderBy(desc(courseCertificates.issuedAt))
  const trail = await db
    .select({ a: auditLog, actorName: users.name })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .where(and(eq(auditLog.targetType, 'user'), eq(auditLog.targetId, id)))
    .orderBy(desc(auditLog.at))
    .limit(50)
  let extra: Record<string, unknown> = {}
  for (const section of userDetailSections())
    extra = { ...extra, ...(await section(id, viewer.id)) }
  return {
    ...(await row(u, slugs, viewer.id)),
    profile: {
      firstName: p?.firstName ?? '',
      lastName: p?.lastName ?? '',
      country: p?.country ?? '',
      position: p?.position ?? '',
      department: p?.department ?? '',
      employmentType: p?.employmentType ?? '',
      seniorityLevel: p?.seniorityLevel ?? '',
      linkedinUrl: p?.linkedinUrl ?? '',
      mobile: p?.mobile ?? '',
      ...(p?.employeeId ? { employeeId: p.employeeId } : {}),
      ...(p?.sector ? { sector: p.sector } : {}),
      ...(p?.hireDate ? { hireDate: p.hireDate } : {}),
    },
    points: await pointsTotal(id),
    certificates: certs.map(({ c, title }) => ({
      id: c.id,
      courseTitle: title,
      serial: c.serial,
      issuedAt: c.issuedAt.toISOString(),
    })),
    externalCertificates: [],
    ...(u.deleteRequestedAt ? { deleteRequestedAt: u.deleteRequestedAt.toISOString() } : {}),
    updatedAt: u.updatedAt.toISOString(),
    auditTrail: trail.map((t) => ({
      at: t.a.at.toISOString(),
      actor: t.actorName ?? 'system',
      action: t.a.action,
    })),
    ...extra,
  }
}

async function micrositeIdsBySlug(tx: DbOrTx, slugs: string[]) {
  if (slugs.length === 0) return new Map<string, string>()
  const rows = await tx
    .select({ id: microsites.id, slug: microsites.slug })
    .from(microsites)
    .where(inArray(microsites.slug, slugs))
  const map = new Map(rows.map((r) => [r.slug, r.id]))
  const missing = slugs.filter((s) => !map.has(s))
  if (missing.length)
    throw validationFailed({ microsites: `Unknown microsite: ${missing.join(', ')}` })
  return map
}

/**
 * Role, status, memberships and profile. Disabling ends every session at once; an admin cannot
 * remove their own admin role or disable themselves.
 */
export async function updateUser(
  id: string,
  input: z.infer<typeof AdminUserUpdate>,
  viewer: Viewer,
) {
  await db.transaction(async (tx) => {
    const [u] = await tx.select().from(users).where(eq(users.id, id)).for('update')
    if (!u) throw notFound()
    assertIfMatch(u.updatedAt, input.ifMatch)
    if (
      id === viewer.id &&
      ((input.role && input.role !== 'admin') || input.status === 'disabled')
    ) {
      throw conflict('You cannot remove your own admin access')
    }
    const audit = (action: string, meta: Record<string, unknown> = {}) =>
      recordAudit(tx, {
        actorId: viewer.id,
        action,
        target: { type: 'user', id, label: u.email },
        ip: viewer.ip,
        meta,
      })

    const patch: Partial<typeof users.$inferInsert> = {}
    if (input.name && input.name !== u.name) patch.name = input.name
    if (input.role && input.role !== u.role) {
      patch.role = input.role
      await audit('user.role', { from: u.role, to: input.role })
    }
    if (input.status && input.status !== u.status) {
      patch.status = input.status
      await audit('user.status', { from: u.status, to: input.status })
      if (input.status === 'disabled') await tx.delete(sessions).where(eq(sessions.userId, id))
    }
    if (Object.keys(patch).length) await tx.update(users).set(patch).where(eq(users.id, id))

    if (input.microsites) {
      const wanted = await micrositeIdsBySlug(tx, [...new Set(input.microsites)])
      const current = await tx
        .select({ micrositeId: memberships.micrositeId })
        .from(memberships)
        .where(eq(memberships.userId, id))
      const currentIds = new Set(current.map((c) => c.micrositeId))
      const wantedIds = new Set(wanted.values())
      for (const mid of wantedIds)
        if (!currentIds.has(mid)) {
          await joinMicrosite(tx, id, mid, 'admin')
          await audit('membership.add', { micrositeId: mid })
        }
      for (const mid of currentIds)
        if (!wantedIds.has(mid)) {
          await leaveMicrosite(tx, id, mid)
          await audit('membership.remove', { micrositeId: mid })
        }
    }

    if (input.profile && Object.keys(input.profile).length) {
      await tx
        .insert(userProfiles)
        .values({ userId: id, ...input.profile })
        .onConflictDoUpdate({ target: userProfiles.userId, set: input.profile })
      await audit('user.profile')
    }
  })
  return getUserDetail(id, viewer)
}

/** Sends the set-password e-mail (Better Auth reset flow, 24 h single-use token). */
export async function sendPasswordReset(id: string, viewer: Viewer) {
  const [u] = await db.select().from(users).where(eq(users.id, id))
  if (!u) throw notFound()
  await auth.api.requestPasswordReset({
    body: { email: u.email, redirectTo: `${env.APP_URL}/reset-password` },
  })
  await recordAudit(db, {
    actorId: viewer.id,
    action: 'user.reset_password',
    target: { type: 'user', id, label: u.email },
    ip: viewer.ip,
  })
}

/* ------------------------------------------------------------------ CSV import */

export const IMPORT_COLUMNS = [
  'email',
  'first_name',
  'last_name',
  'employee_id',
  'position',
  'sector',
  'department',
  'hire_date',
  'microsites',
  'role',
]

type ImportRow = {
  row: number
  email: string
  name: string
  microsites: string[]
  action: 'create' | 'update' | 'skip'
  reason?: string
  data?: Record<string, string>
}

export function sampleCsv() {
  return `${IMPORT_COLUMNS.join(',')}\r\nnew.person@dctabudhabi.ae,New,Person,E1234,Specialist,Culture,Heritage,2026-01-10,employees;znm,learner\r\n`
}

export async function previewUserImport(text: string, viewer: Viewer) {
  const { headers, rows } = parseCsvObjects(text)
  for (const h of ['email', 'first_name', 'last_name', 'microsites']) {
    if (!headers.includes(h)) throw validationFailed({ file: `Missing column ${h}` })
  }
  if (rows.length > 5000) throw validationFailed({ file: 'At most 5,000 rows' })
  const allSlugs = new Set(
    (await db.select({ slug: microsites.slug }).from(microsites)).map((m) => m.slug),
  )
  const seen = new Set<string>()
  const preview: ImportRow[] = []
  for (const [i, r] of rows.entries()) {
    const parsed = emailSchema.safeParse(r.email ?? '')
    const name = `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim()
    const slugs = (r.microsites ?? '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    const base = { row: i + 2, email: r.email ?? '', name, microsites: slugs }
    const role = r.role || 'learner'
    if (!parsed.success) preview.push({ ...base, action: 'skip', reason: 'invalid_email' })
    else if (seen.has(parsed.data)) preview.push({ ...base, action: 'skip', reason: 'duplicate' })
    else if (!name) preview.push({ ...base, action: 'skip', reason: 'missing_name' })
    else if (slugs.some((s) => !allSlugs.has(s)))
      preview.push({ ...base, action: 'skip', reason: 'unknown_microsite' })
    else if (!(ROLES as readonly string[]).includes(role))
      preview.push({ ...base, action: 'skip', reason: 'invalid_role' })
    else if (r.hire_date && !/^\d{4}-\d{2}-\d{2}$/.test(r.hire_date))
      preview.push({ ...base, action: 'skip', reason: 'invalid_hire_date' })
    else {
      seen.add(parsed.data)
      const existing = await findUserByEmail(db, parsed.data)
      preview.push({
        ...base,
        email: parsed.data,
        action: existing ? 'update' : 'create',
        data: { ...r, role },
      })
    }
  }
  const token = await createImport('users', 'platform', preview, viewer.id)
  return { preview: preview.map(({ data: _d, ...p }) => p), token }
}

export async function confirmUserImport(token: string, sendWelcome: boolean, viewer: Viewer) {
  const welcome: string[] = []
  const result = await db.transaction(async (tx) => {
    const rows = (await claimImport(tx, 'users', 'platform', token, viewer.id)) as ImportRow[]
    let created = 0
    let updated = 0
    let skipped = 0
    const slugMap = await micrositeIdsBySlug(tx, [
      ...new Set(rows.filter((r) => r.action !== 'skip').flatMap((r) => r.microsites)),
    ])
    for (const r of rows) {
      if (r.action === 'skip' || !r.data) {
        skipped++
        continue
      }
      const profile = {
        firstName: r.data.first_name ?? '',
        lastName: r.data.last_name ?? '',
        position: r.data.position ?? '',
        department: r.data.department ?? '',
        employeeId: r.data.employee_id || null,
        sector: r.data.sector || null,
        hireDate: r.data.hire_date || null,
      }
      let user = await findUserByEmail(tx, r.email)
      if (!user) {
        user = await createCredentialUser(tx, {
          name: r.name,
          email: r.email,
          role: r.data.role ?? 'learner',
          mustSetPassword: true,
          emailVerified: true,
        })
        await tx.insert(userProfiles).values({ userId: user.id, ...profile })
        created++
        if (sendWelcome) welcome.push(r.email)
      } else {
        await tx
          .insert(userProfiles)
          .values({ userId: user.id, ...profile })
          .onConflictDoUpdate({ target: userProfiles.userId, set: profile })
        updated++
      }
      for (const slug of r.microsites)
        await joinMicrosite(tx, user.id, slugMap.get(slug)!, 'import')
    }
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'user.import',
      target: { type: 'import', label: `${created} created, ${updated} updated` },
      ip: viewer.ip,
      meta: { created, updated, skipped },
    })
    return { created, updated, skipped }
  })
  for (const e of welcome) {
    await auth.api
      .requestPasswordReset({ body: { email: e, redirectTo: `${env.APP_URL}/set-password` } })
      .catch(() => {})
  }
  return result
}

/* ------------------------------------------------------------------ audit log */

export async function listAudit(q: z.infer<typeof AuditQuery>, viewer: Viewer) {
  const where = and(
    q.actor ? eq(auditLog.actorId, q.actor) : undefined,
    q.action ? ilike(auditLog.action, `${q.action}%`) : undefined,
    q.from ? gte(auditLog.at, new Date(q.from)) : undefined,
    q.to ? lte(auditLog.at, new Date(q.to)) : undefined,
  )
  const [total] = await db.select({ n: count() }).from(auditLog).where(where)
  const { limit, offset } = pageWindow(q)
  const rows = await db
    .select({ a: auditLog, u: users, slug: microsites.slug })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .leftJoin(microsites, eq(microsites.id, auditLog.micrositeId))
    .where(where)
    .orderBy(desc(auditLog.at))
    .limit(limit)
    .offset(offset)
  return paged(
    await Promise.all(
      rows.map(async ({ a, u, slug }) => ({
        at: a.at.toISOString(),
        ...(u ? { actor: await toUserDto(u, viewer.id) } : {}),
        action: a.action,
        target: {
          type: a.targetType,
          ...(a.targetId ? { id: a.targetId } : {}),
          ...(a.targetLabel ? { label: a.targetLabel } : {}),
        },
        ...(slug ? { microsite: slug } : {}),
      })),
    ),
    total?.n ?? 0,
    q,
  )
}
