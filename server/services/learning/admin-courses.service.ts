import { randomUUID } from 'node:crypto'
import { type DbOrTx, db } from '@server/db/connection'
import { courses, enrolments, micrositeCourses } from '@server/db/schema/catalog'
import {
  assessmentAttempts,
  assessmentQuestions,
  type CourseAssessment,
  courseAssessments,
  courseBlocks,
  courseCertificateSettings,
  courseModules,
  courseUnits,
  scormPackages,
} from '@server/db/schema/learning'
import { microsites } from '@server/db/schema/microsites'
import { enqueue } from '@server/jobs/runtime'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, notFound, validationFailed } from '@server/lib/errors'
import { assertIfMatch } from '@server/lib/if-match'
import { paged, pageWindow } from '@server/lib/pagination'
import { sanitizeI18nRich } from '@server/lib/sanitize'
import { storeUpload } from '@server/services/files.service'
import { verifyFileType } from '@server/utils/file-signature'
import type {
  AdminCourseDetail,
  AdminCoursesQuery,
  AssessmentInput,
  AssessmentUpdate,
  CardInput,
  CertificateSettingsInput,
  CourseCreate,
  CourseUpdate,
  PointsConfigInput,
  QuestionInput,
} from '@shared/schemas/learning'
import { and, asc, count, desc, eq, ilike, inArray, isNull, max, or, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { type BlockType, parseBlockPayload } from './block-payloads'
import { inspectScormZip, isZip } from './scorm.service'

/**
 * P46 Catalog · P59 Course editor (role admin). Structural edits soft-delete (§9.5: progress of
 * removed units/blocks is kept but ignored) and queue a progress recalculation job for
 * published courses; publish / archive follow §9.1 and are audited; course saves use ifMatch.
 */

type Detail = z.infer<typeof AdminCourseDetail>

/* ---------------------------------------------------------------- helpers */

async function loadCourse(tx: DbOrTx, id: string, lock = false) {
  const q = tx.select().from(courses).where(eq(courses.id, id))
  const [c] = lock ? await q.for('update') : await q
  if (!c) throw notFound()
  return c
}

/** Marks the course changed (ifMatch) and, when published, queues a progress recalculation. */
async function touch(tx: DbOrTx, courseId: string, structural = false) {
  const [c] = await tx
    .update(courses)
    .set({ updatedAt: new Date() })
    .where(eq(courses.id, courseId))
    .returning({ status: courses.status })
  if (structural && c?.status !== 'draft')
    await enqueue('learning.recalc_course', { courseId }, { tx })
}

async function liveModule(tx: DbOrTx, courseId: string, moduleId: string) {
  const [m] = await tx
    .select()
    .from(courseModules)
    .where(
      and(
        eq(courseModules.id, moduleId),
        eq(courseModules.courseId, courseId),
        isNull(courseModules.deletedAt),
      ),
    )
  if (!m) throw notFound()
  return m
}

async function liveUnit(tx: DbOrTx, courseId: string, unitId: string) {
  const [u] = await tx
    .select()
    .from(courseUnits)
    .where(
      and(
        eq(courseUnits.id, unitId),
        eq(courseUnits.courseId, courseId),
        isNull(courseUnits.deletedAt),
      ),
    )
  if (!u) throw notFound()
  return u
}

async function liveBlock(tx: DbOrTx, courseId: string, blockId: string) {
  const [b] = await tx
    .select()
    .from(courseBlocks)
    .where(
      and(
        eq(courseBlocks.id, blockId),
        eq(courseBlocks.courseId, courseId),
        isNull(courseBlocks.deletedAt),
      ),
    )
  if (!b) throw notFound()
  return b
}

async function liveAssessment(tx: DbOrTx, courseId: string, id: string) {
  const [a] = await tx
    .select()
    .from(courseAssessments)
    .where(
      and(
        eq(courseAssessments.id, id),
        eq(courseAssessments.courseId, courseId),
        isNull(courseAssessments.deletedAt),
      ),
    )
    .for('update')
  if (!a) throw notFound()
  return a
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

async function uniqueSlug(tx: DbOrTx, base: string, explicit: boolean, exceptId?: string) {
  const taken = async (s: string) => {
    const [r] = await tx.select({ id: courses.id }).from(courses).where(eq(courses.slug, s))
    return Boolean(r && r.id !== exceptId)
  }
  const root = base || 'course'
  if (!(await taken(root))) return root
  if (explicit) throw conflict('A course with this slug exists')
  for (let i = 2; i < 1000; i++) if (!(await taken(`${root}-${i}`))) return `${root}-${i}`
  return `${root}-${randomUUID().slice(0, 8)}`
}

async function validateMedia(tx: DbOrTx, payload: Record<string, unknown>, type: BlockType) {
  if (type !== 'scorm') return
  const [pkg] = await tx
    .select({ id: scormPackages.id })
    .from(scormPackages)
    .where(eq(scormPackages.id, String(payload.packageId)))
  if (!pkg) throw validationFailed({ 'payload.packageId': 'Upload the SCORM package first' })
}

/* ---------------------------------------------------------------- P46 list / create */

export async function listCourses(query: z.infer<typeof AdminCoursesQuery>) {
  const conds = []
  if (query.q) {
    const like = `%${query.q.replace(/[%_]/g, '')}%`
    conds.push(
      or(
        ilike(sql`${courses.title}->>'en'`, like),
        ilike(sql`${courses.title}->>'ar'`, like),
        ilike(courses.slug, like),
      ),
    )
  }
  if (query.status) conds.push(eq(courses.status, query.status))
  if (query.microsite) {
    const [m] = await db
      .select({ id: microsites.id })
      .from(microsites)
      .where(eq(microsites.slug, query.microsite))
    if (!m) return paged([], 0, query)
    conds.push(
      inArray(
        courses.id,
        db
          .select({ id: micrositeCourses.courseId })
          .from(micrositeCourses)
          .where(eq(micrositeCourses.micrositeId, m.id)),
      ),
    )
  }
  const where = conds.length ? and(...conds) : undefined
  const [total] = await db.select({ n: count() }).from(courses).where(where)
  const rows = await db
    .select()
    .from(courses)
    .where(where)
    .orderBy(desc(courses.updatedAt), asc(courses.slug))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const ids = rows.map((r) => r.id)
  const unitCounts = ids.length
    ? await db
        .select({ courseId: courseUnits.courseId, n: count() })
        .from(courseUnits)
        .innerJoin(courseModules, eq(courseModules.id, courseUnits.moduleId))
        .where(
          and(
            inArray(courseUnits.courseId, ids),
            isNull(courseUnits.deletedAt),
            isNull(courseModules.deletedAt),
          ),
        )
        .groupBy(courseUnits.courseId)
    : []
  const enrolCounts = ids.length
    ? await db
        .select({
          courseId: enrolments.courseId,
          n: count(),
          done: sql<number>`count(*) filter (where ${enrolments.state} = 'completed')`.mapWith(
            Number,
          ),
        })
        .from(enrolments)
        .where(inArray(enrolments.courseId, ids))
        .groupBy(enrolments.courseId)
    : []
  const sites = ids.length
    ? await db
        .select({ courseId: micrositeCourses.courseId, slug: microsites.slug })
        .from(micrositeCourses)
        .innerJoin(microsites, eq(microsites.id, micrositeCourses.micrositeId))
        .where(inArray(micrositeCourses.courseId, ids))
        .orderBy(asc(microsites.sortOrder))
    : []
  return paged(
    rows.map((c) => {
      const e = enrolCounts.find((x) => x.courseId === c.id)
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        status: c.status as 'draft' | 'published' | 'archived',
        level: c.level as 'beginner' | 'intermediate' | 'advanced',
        units: unitCounts.find((x) => x.courseId === c.id)?.n ?? 0,
        enrolled: e?.n ?? 0,
        completed: e?.done ?? 0,
        updatedAt: c.updatedAt.toISOString(),
        microsites: sites.filter((s) => s.courseId === c.id).map((s) => s.slug),
      }
    }),
    total?.n ?? 0,
    query,
  )
}

export async function createCourse(input: z.infer<typeof CourseCreate>, viewer: Viewer) {
  return db.transaction(async (tx) => {
    const slug = await uniqueSlug(tx, input.slug ?? slugify(input.title.en), Boolean(input.slug))
    const [c] = await tx
      .insert(courses)
      .values({
        slug,
        title: input.title,
        description: sanitizeI18nRich(input.description),
        level: input.level,
        durationMin: input.durationMin,
        categories: input.categories,
        imageUrl: input.imageUrl,
        certificateEnabled: input.certificateEnabled,
        externalCertificate: input.externalCertificate ?? false,
        sequential: input.sequential,
        status: 'draft',
      })
      .returning()
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'course.create',
      target: { type: 'course', id: c!.id, label: c!.title.en },
      ip: viewer.ip,
    })
    return { id: c!.id }
  })
}

/* ---------------------------------------------------------------- P59 detail */

export async function courseDetail(id: string, tx: DbOrTx = db): Promise<Detail> {
  const c = await loadCourse(tx, id)
  const modules = await tx
    .select()
    .from(courseModules)
    .where(and(eq(courseModules.courseId, id), isNull(courseModules.deletedAt)))
    .orderBy(asc(courseModules.order), asc(courseModules.createdAt))
  const units = await tx
    .select()
    .from(courseUnits)
    .where(and(eq(courseUnits.courseId, id), isNull(courseUnits.deletedAt)))
    .orderBy(asc(courseUnits.order), asc(courseUnits.createdAt))
  const blocks = await tx
    .select()
    .from(courseBlocks)
    .where(and(eq(courseBlocks.courseId, id), isNull(courseBlocks.deletedAt)))
    .orderBy(asc(courseBlocks.order), asc(courseBlocks.createdAt))
  const assessments = await tx
    .select()
    .from(courseAssessments)
    .where(and(eq(courseAssessments.courseId, id), isNull(courseAssessments.deletedAt)))
    .orderBy(asc(courseAssessments.createdAt))
  const questions = assessments.length
    ? await tx
        .select()
        .from(assessmentQuestions)
        .where(
          inArray(
            assessmentQuestions.assessmentId,
            assessments.map((a) => a.id),
          ),
        )
        .orderBy(asc(assessmentQuestions.order), asc(assessmentQuestions.createdAt))
    : []
  const [settings] = await tx
    .select()
    .from(courseCertificateSettings)
    .where(eq(courseCertificateSettings.courseId, id))
  return {
    course: {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      status: c.status as Detail['course']['status'],
      level: c.level as Detail['course']['level'],
      durationMin: c.durationMin,
      categories: c.categories,
      imageUrl: c.imageUrl,
      certificateEnabled: c.certificateEnabled,
      externalCertificate: c.externalCertificate,
      sequential: c.sequential,
      pointsConfig: c.pointsConfig,
      ...(c.publishedAt ? { publishedAt: c.publishedAt.toISOString() } : {}),
      updatedAt: c.updatedAt.toISOString(),
    },
    modules: modules.map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      units: units
        .filter((u) => u.moduleId === m.id)
        .map((u) => ({
          id: u.id,
          title: u.title,
          order: u.order,
          ...(u.durationMin != null ? { durationMin: u.durationMin } : {}),
          blocks: blocks
            .filter((b) => b.unitId === u.id)
            .map((b) => ({
              id: b.id,
              type: b.type as Detail['modules'][number]['units'][number]['blocks'][number]['type'],
              order: b.order,
              required: b.required,
              payload: b.payload,
            })),
        })),
    })),
    assessments: assessments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type as Detail['assessments'][number]['type'],
      passMark: a.passMark,
      attemptsAllowed: a.attemptsAllowed,
      ...(a.timeLimitMin != null ? { timeLimitMin: a.timeLimitMin } : {}),
      shuffle: a.shuffle,
      isFinal: a.isFinal,
      ...(a.moduleId ? { moduleId: a.moduleId } : {}),
      ...(a.unitId ? { unitId: a.unitId } : {}),
      version: a.version,
      questions: questions
        .filter((q) => q.assessmentId === a.id && q.version === a.version)
        .map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type as Detail['assessments'][number]['questions'][number]['type'],
          options: q.options,
          points: q.points,
          order: q.order,
        })),
    })),
    card: {
      imageUrl: c.imageUrl,
      categories: c.categories,
      level: c.level as Detail['card']['level'],
      durationMin: c.durationMin,
      comingSoon: c.comingSoon,
      isCertProgramme: c.isCertProgramme,
      overview: c.overview,
    },
    certificateSettings: settings
      ? {
          backgroundUrl: settings.backgroundUrl,
          logoUrl: settings.logoUrl,
          signatureName: settings.signatureName,
          signatureTitle: settings.signatureTitle,
          ...(settings.signatureImageUrl ? { signatureImageUrl: settings.signatureImageUrl } : {}),
        }
      : null,
  }
}

/* ---------------------------------------------------------------- course update / status */

export async function updateCourse(
  id: string,
  input: z.infer<typeof CourseUpdate>,
  viewer: Viewer,
) {
  return db.transaction(async (tx) => {
    const c = await loadCourse(tx, id, true)
    assertIfMatch(c.updatedAt, input.ifMatch)
    const { ifMatch: _ifMatch, ...rest } = input
    const slug =
      rest.slug && rest.slug !== c.slug ? await uniqueSlug(tx, rest.slug, true, id) : undefined
    await tx
      .update(courses)
      .set({
        ...rest,
        ...(slug ? { slug } : { slug: c.slug }),
        ...(rest.description ? { description: sanitizeI18nRich(rest.description) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'course.update',
      target: { type: 'course', id, label: c.title.en },
      ip: viewer.ip,
    })
    return courseDetail(id, tx)
  })
}

/** §9.1 draft → published (needs ≥ 1 live unit with content). Audit. */
export async function publishCourse(id: string, viewer: Viewer) {
  return db.transaction(async (tx) => {
    const c = await loadCourse(tx, id, true)
    if (c.status !== 'draft') throw conflict(`A ${c.status} course cannot be published`)
    const [withContent] = await tx
      .select({ n: count() })
      .from(courseBlocks)
      .innerJoin(courseUnits, eq(courseUnits.id, courseBlocks.unitId))
      .innerJoin(courseModules, eq(courseModules.id, courseUnits.moduleId))
      .where(
        and(
          eq(courseBlocks.courseId, id),
          isNull(courseBlocks.deletedAt),
          isNull(courseUnits.deletedAt),
          isNull(courseModules.deletedAt),
        ),
      )
    if (!withContent?.n) throw conflict('Add at least one unit with content before publishing')
    await tx
      .update(courses)
      .set({ status: 'published', publishedAt: now(), updatedAt: new Date() })
      .where(eq(courses.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'course.publish',
      target: { type: 'course', id, label: c.title.en },
      ip: viewer.ip,
    })
    return { id, status: 'published' as const }
  })
}

/** §9.1 published → archived (learners keep progress and certificates). Audit. */
export async function archiveCourse(id: string, viewer: Viewer) {
  return db.transaction(async (tx) => {
    const c = await loadCourse(tx, id, true)
    if (c.status !== 'published') throw conflict(`A ${c.status} course cannot be archived`)
    await tx
      .update(courses)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(courses.id, id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'course.archive',
      target: { type: 'course', id, label: c.title.en },
      ip: viewer.ip,
    })
    return { id, status: 'archived' as const }
  })
}

/* ---------------------------------------------------------------- modules / units / blocks */

async function nextOrder(
  tx: DbOrTx,
  table: typeof courseModules | typeof courseUnits | typeof courseBlocks,
  where: ReturnType<typeof and>,
) {
  const [r] = await tx
    .select({ m: max(table.order) })
    .from(table)
    .where(where)
  return (r?.m ?? 0) + 1
}

export async function createModule(courseId: string, title: { en: string; ar: string }) {
  return db.transaction(async (tx) => {
    await loadCourse(tx, courseId)
    const order = await nextOrder(
      tx,
      courseModules,
      and(eq(courseModules.courseId, courseId), isNull(courseModules.deletedAt)),
    )
    const [m] = await tx.insert(courseModules).values({ courseId, title, order }).returning()
    await touch(tx, courseId)
    return { id: m!.id }
  })
}

export async function updateModule(
  courseId: string,
  moduleId: string,
  title: { en: string; ar: string },
) {
  await db.transaction(async (tx) => {
    await liveModule(tx, courseId, moduleId)
    await tx.update(courseModules).set({ title }).where(eq(courseModules.id, moduleId))
    await touch(tx, courseId)
  })
}

export async function deleteModule(courseId: string, moduleId: string) {
  await db.transaction(async (tx) => {
    await liveModule(tx, courseId, moduleId)
    const at = now()
    await tx.update(courseModules).set({ deletedAt: at }).where(eq(courseModules.id, moduleId))
    await tx
      .update(courseUnits)
      .set({ deletedAt: at })
      .where(and(eq(courseUnits.moduleId, moduleId), isNull(courseUnits.deletedAt)))
    await touch(tx, courseId, true)
  })
}

async function reorder(
  tx: DbOrTx,
  table: typeof courseModules | typeof courseUnits | typeof courseBlocks,
  current: string[],
  ids: string[],
) {
  if (
    ids.length !== current.length ||
    new Set(ids).size !== ids.length ||
    ids.some((i) => !current.includes(i))
  )
    throw validationFailed({ ids: 'Send every item exactly once' })
  for (const [i, id] of ids.entries())
    await tx
      .update(table)
      .set({ order: i + 1 })
      .where(eq(table.id, id))
}

export async function reorderModules(courseId: string, ids: string[]) {
  await db.transaction(async (tx) => {
    await loadCourse(tx, courseId)
    const rows = await tx
      .select({ id: courseModules.id })
      .from(courseModules)
      .where(and(eq(courseModules.courseId, courseId), isNull(courseModules.deletedAt)))
    await reorder(
      tx,
      courseModules,
      rows.map((r) => r.id),
      ids,
    )
    await touch(tx, courseId, true)
  })
}

export async function createUnit(
  courseId: string,
  moduleId: string,
  input: { title: { en: string; ar: string }; durationMin?: number },
) {
  return db.transaction(async (tx) => {
    await liveModule(tx, courseId, moduleId)
    const order = await nextOrder(
      tx,
      courseUnits,
      and(eq(courseUnits.moduleId, moduleId), isNull(courseUnits.deletedAt)),
    )
    const [u] = await tx
      .insert(courseUnits)
      .values({
        courseId,
        moduleId,
        title: input.title,
        durationMin: input.durationMin ?? null,
        order,
      })
      .returning()
    await touch(tx, courseId, true)
    return { id: u!.id }
  })
}

export async function updateUnit(
  courseId: string,
  unitId: string,
  input: { title?: { en: string; ar: string }; durationMin?: number; moduleId?: string },
) {
  await db.transaction(async (tx) => {
    const u = await liveUnit(tx, courseId, unitId)
    let order: number | undefined
    if (input.moduleId && input.moduleId !== u.moduleId) {
      await liveModule(tx, courseId, input.moduleId)
      order = await nextOrder(
        tx,
        courseUnits,
        and(eq(courseUnits.moduleId, input.moduleId), isNull(courseUnits.deletedAt)),
      )
    }
    await tx
      .update(courseUnits)
      .set({
        ...(input.title ? { title: input.title } : {}),
        ...(input.durationMin !== undefined ? { durationMin: input.durationMin } : {}),
        ...(order !== undefined ? { moduleId: input.moduleId, order } : {}),
      })
      .where(eq(courseUnits.id, unitId))
    await touch(tx, courseId, order !== undefined)
  })
}

export async function deleteUnit(courseId: string, unitId: string) {
  await db.transaction(async (tx) => {
    await liveUnit(tx, courseId, unitId)
    await tx.update(courseUnits).set({ deletedAt: now() }).where(eq(courseUnits.id, unitId))
    await touch(tx, courseId, true)
  })
}

export async function reorderUnits(courseId: string, moduleId: string, ids: string[]) {
  await db.transaction(async (tx) => {
    await liveModule(tx, courseId, moduleId)
    const rows = await tx
      .select({ id: courseUnits.id })
      .from(courseUnits)
      .where(and(eq(courseUnits.moduleId, moduleId), isNull(courseUnits.deletedAt)))
    await reorder(
      tx,
      courseUnits,
      rows.map((r) => r.id),
      ids,
    )
    await touch(tx, courseId, true)
  })
}

export async function createBlock(
  courseId: string,
  unitId: string,
  input: { type: BlockType; payload: Record<string, unknown>; required: boolean },
) {
  return db.transaction(async (tx) => {
    await liveUnit(tx, courseId, unitId)
    const payload = parseBlockPayload(input.type, input.payload)
    await validateMedia(tx, payload, input.type)
    const order = await nextOrder(
      tx,
      courseBlocks,
      and(eq(courseBlocks.unitId, unitId), isNull(courseBlocks.deletedAt)),
    )
    const [b] = await tx
      .insert(courseBlocks)
      .values({ courseId, unitId, type: input.type, payload, required: input.required, order })
      .returning()
    await touch(tx, courseId, true)
    return { id: b!.id }
  })
}

/** Text/media edits apply immediately; making a block required does not undo completions (§9.5). */
export async function updateBlock(
  courseId: string,
  blockId: string,
  input: { payload?: Record<string, unknown>; required?: boolean },
) {
  await db.transaction(async (tx) => {
    const b = await liveBlock(tx, courseId, blockId)
    const payload = input.payload
      ? parseBlockPayload(b.type as BlockType, input.payload)
      : undefined
    if (payload) await validateMedia(tx, payload, b.type as BlockType)
    await tx
      .update(courseBlocks)
      .set({
        ...(payload ? { payload } : {}),
        ...(input.required !== undefined ? { required: input.required } : {}),
      })
      .where(eq(courseBlocks.id, blockId))
    await touch(tx, courseId)
  })
}

export async function deleteBlock(courseId: string, blockId: string) {
  await db.transaction(async (tx) => {
    await liveBlock(tx, courseId, blockId)
    await tx.update(courseBlocks).set({ deletedAt: now() }).where(eq(courseBlocks.id, blockId))
    await touch(tx, courseId, true)
  })
}

export async function reorderBlocks(courseId: string, unitId: string, ids: string[]) {
  await db.transaction(async (tx) => {
    await liveUnit(tx, courseId, unitId)
    const rows = await tx
      .select({ id: courseBlocks.id })
      .from(courseBlocks)
      .where(and(eq(courseBlocks.unitId, unitId), isNull(courseBlocks.deletedAt)))
    await reorder(
      tx,
      courseBlocks,
      rows.map((r) => r.id),
      ids,
    )
    await touch(tx, courseId)
  })
}

/* ---------------------------------------------------------------- assessments (versioned, §9.5) */

async function checkPlacement(
  tx: DbOrTx,
  courseId: string,
  input: { moduleId?: string; unitId?: string },
) {
  if (input.moduleId)
    await liveModule(tx, courseId, input.moduleId).catch(() => {
      throw validationFailed({ moduleId: 'Not a module of this course' })
    })
  if (input.unitId)
    await liveUnit(tx, courseId, input.unitId).catch(() => {
      throw validationFailed({ unitId: 'Not a unit of this course' })
    })
}

export async function createAssessment(courseId: string, input: z.infer<typeof AssessmentInput>) {
  return db.transaction(async (tx) => {
    await loadCourse(tx, courseId)
    await checkPlacement(tx, courseId, input)
    const [a] = await tx
      .insert(courseAssessments)
      .values({
        courseId,
        title: input.title,
        type: input.type,
        passMark: input.passMark,
        attemptsAllowed: input.attemptsAllowed,
        timeLimitMin: input.timeLimitMin ?? null,
        shuffle: input.shuffle,
        isFinal: input.isFinal,
        moduleId: input.moduleId ?? null,
        unitId: input.unitId ?? null,
      })
      .returning()
    await touch(tx, courseId, true)
    return { id: a!.id }
  })
}

/**
 * When the current version already has attempts, copies its questions into a new version and
 * returns old → new question ids; past attempts keep their score against the old version.
 */
async function editableVersion(tx: DbOrTx, a: CourseAssessment) {
  const map = new Map<string, string>()
  const [used] = await tx
    .select({ n: count() })
    .from(assessmentAttempts)
    .where(
      and(eq(assessmentAttempts.assessmentId, a.id), eq(assessmentAttempts.version, a.version)),
    )
  const questions = await tx
    .select()
    .from(assessmentQuestions)
    .where(
      and(eq(assessmentQuestions.assessmentId, a.id), eq(assessmentQuestions.version, a.version)),
    )
  if (!used?.n) {
    for (const q of questions) map.set(q.id, q.id)
    return { version: a.version, map }
  }
  const version = a.version + 1
  for (const q of questions) {
    const id = randomUUID()
    map.set(q.id, id)
    await tx.insert(assessmentQuestions).values({
      id,
      assessmentId: a.id,
      version,
      text: q.text,
      type: q.type,
      options: q.options,
      points: q.points,
      order: q.order,
    })
  }
  await tx.update(courseAssessments).set({ version }).where(eq(courseAssessments.id, a.id))
  return { version, map }
}

export async function updateAssessment(
  courseId: string,
  id: string,
  input: z.infer<typeof AssessmentUpdate>,
) {
  await db.transaction(async (tx) => {
    const a = await liveAssessment(tx, courseId, id)
    await checkPlacement(tx, courseId, input)
    // Scoring rules changed → new version (titles, time limit, shuffle apply in place).
    if (
      (input.type && input.type !== a.type) ||
      (input.passMark !== undefined && input.passMark !== a.passMark)
    )
      await editableVersion(tx, a)
    await tx
      .update(courseAssessments)
      .set({
        ...(input.title ? { title: input.title } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.passMark !== undefined ? { passMark: input.passMark } : {}),
        ...(input.attemptsAllowed !== undefined ? { attemptsAllowed: input.attemptsAllowed } : {}),
        ...(input.timeLimitMin !== undefined ? { timeLimitMin: input.timeLimitMin } : {}),
        ...(input.shuffle !== undefined ? { shuffle: input.shuffle } : {}),
        ...(input.isFinal !== undefined ? { isFinal: input.isFinal } : {}),
        ...(input.moduleId !== undefined ? { moduleId: input.moduleId } : {}),
        ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
      })
      .where(eq(courseAssessments.id, id))
    await touch(tx, courseId, true)
  })
}

export async function deleteAssessment(courseId: string, id: string) {
  await db.transaction(async (tx) => {
    await liveAssessment(tx, courseId, id)
    await tx.update(courseAssessments).set({ deletedAt: now() }).where(eq(courseAssessments.id, id))
    await touch(tx, courseId, true)
  })
}

function questionValues(input: z.infer<typeof QuestionInput>) {
  if (input.type !== 'open_text' && input.options.length < 2)
    throw validationFailed({ options: 'Add at least two options' })
  if (
    (input.type === 'multiple_choice' || input.type === 'true_false') &&
    !input.options.some((o) => o.correct)
  )
    throw validationFailed({ options: 'Mark the correct option' })
  return {
    text: input.text,
    type: input.type,
    points: input.points,
    options: input.options.map((o) => ({
      id: o.id ?? randomUUID(),
      text: o.text,
      correct: o.correct,
    })),
  }
}

export async function createQuestion(
  courseId: string,
  assessmentId: string,
  input: z.infer<typeof QuestionInput>,
) {
  return db.transaction(async (tx) => {
    const a = await liveAssessment(tx, courseId, assessmentId)
    const values = questionValues(input)
    const { version } = await editableVersion(tx, a)
    const [r] = await tx
      .select({ m: max(assessmentQuestions.order) })
      .from(assessmentQuestions)
      .where(
        and(eq(assessmentQuestions.assessmentId, a.id), eq(assessmentQuestions.version, version)),
      )
    const [q] = await tx
      .insert(assessmentQuestions)
      .values({ assessmentId: a.id, version, order: (r?.m ?? 0) + 1, ...values })
      .returning()
    await touch(tx, courseId)
    return { id: q!.id }
  })
}

async function currentQuestion(tx: DbOrTx, a: CourseAssessment, qid: string) {
  const [q] = await tx
    .select()
    .from(assessmentQuestions)
    .where(
      and(
        eq(assessmentQuestions.id, qid),
        eq(assessmentQuestions.assessmentId, a.id),
        eq(assessmentQuestions.version, a.version),
      ),
    )
  if (!q) throw notFound()
  return q
}

/** Returns the id of the edited question (a new id when a new version was created). */
export async function updateQuestion(
  courseId: string,
  assessmentId: string,
  qid: string,
  input: z.infer<typeof QuestionInput>,
) {
  return db.transaction(async (tx) => {
    const a = await liveAssessment(tx, courseId, assessmentId)
    await currentQuestion(tx, a, qid)
    const values = questionValues(input)
    const { map } = await editableVersion(tx, a)
    const id = map.get(qid)!
    await tx.update(assessmentQuestions).set(values).where(eq(assessmentQuestions.id, id))
    await touch(tx, courseId)
    return { id }
  })
}

export async function deleteQuestion(courseId: string, assessmentId: string, qid: string) {
  await db.transaction(async (tx) => {
    const a = await liveAssessment(tx, courseId, assessmentId)
    await currentQuestion(tx, a, qid)
    const { map } = await editableVersion(tx, a)
    await tx.delete(assessmentQuestions).where(eq(assessmentQuestions.id, map.get(qid)!))
    await touch(tx, courseId)
  })
}

/* ---------------------------------------------------------------- card / certificate / points */

export async function saveCard(courseId: string, input: z.infer<typeof CardInput>) {
  return db.transaction(async (tx) => {
    await loadCourse(tx, courseId)
    await tx
      .update(courses)
      .set({ ...input, overview: sanitizeI18nRich(input.overview), updatedAt: new Date() })
      .where(eq(courses.id, courseId))
    return courseDetail(courseId, tx)
  })
}

export async function saveCertificateSettings(
  courseId: string,
  input: z.infer<typeof CertificateSettingsInput>,
) {
  return db.transaction(async (tx) => {
    await loadCourse(tx, courseId)
    const values = { ...input, signatureImageUrl: input.signatureImageUrl ?? null }
    await tx
      .insert(courseCertificateSettings)
      .values({ courseId, ...values })
      .onConflictDoUpdate({ target: courseCertificateSettings.courseId, set: values })
    await touch(tx, courseId)
    return courseDetail(courseId, tx)
  })
}

/** P58 `PUT /api/admin/courses/{id}/points` — writes `courses.pointsConfig`. Audit. */
export async function savePointsConfig(
  courseId: string,
  input: z.infer<typeof PointsConfigInput>,
  viewer: Viewer,
) {
  return db.transaction(async (tx) => {
    const c = await loadCourse(tx, courseId)
    await tx
      .update(courses)
      .set({ pointsConfig: input, updatedAt: new Date() })
      .where(eq(courses.id, courseId))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'course.points',
      target: { type: 'course', id: courseId, label: c.title.en },
      ip: viewer.ip,
      meta: input,
    })
    return input
  })
}

/* ---------------------------------------------------------------- uploads */

/**
 * `POST /api/admin/uploads`: images (public), PDFs, audio, SCORM zips. A zip is checked here
 * (zip-slip, manifest) and unpacked by the `learning.scorm_unpack` job; its file id is the
 * SCORM `packageId` for blocks.
 */
export async function adminUpload(
  file: { buffer: Buffer; mimetype: string; originalname: string },
  viewer: Viewer,
) {
  const bytes = new Uint8Array(file.buffer)
  const zip = isZip(bytes)
  if (zip) inspectScormZip(bytes)
  // Course imagery is public (stable URL); everything else is served signed and user-bound.
  const isImage = verifyFileType(bytes, file.mimetype)?.mime.startsWith('image/') ?? false
  return db.transaction(async (tx) => {
    const stored = await storeUpload(
      {
        bytes,
        declaredMime: file.mimetype,
        originalName: file.originalname,
        category: 'content',
        ownerId: viewer.id,
        visibility: isImage ? 'public' : 'private',
      },
      tx,
    )
    if (zip) {
      await tx.insert(scormPackages).values({ id: stored.id, createdById: viewer.id })
      await enqueue('learning.scorm_unpack', { packageId: stored.id }, { tx })
    }
    return stored
  })
}
