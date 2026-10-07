import { db } from '@server/db/connection'
import { courseCertificates, enrolments } from '@server/db/schema/catalog'
import {
  actionPlanAnswers,
  type CourseBlock,
  scormPackages,
  surveyAnswers,
} from '@server/db/schema/learning'
import type { Microsite } from '@server/db/schema/microsites'
import { now } from '@server/lib/clock'
import { locked } from '@server/lib/errors'
import {
  cardState,
  micrositeCardRows,
  toCourseCard,
} from '@server/services/catalog/course-card.service'
import { urlForStored } from '@server/services/files.service'
import type { CourseView, UnitView } from '@shared/schemas/learning'
import { and, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import { assertCourseInMicrosite, loadUnitFor } from './access.service'
import { certificateRef } from './certificate.service'
import { unitCompletion } from './progress.service'
import {
  blockStates,
  finalAssessment,
  learnerState,
  liveBlocks,
  loadStructure,
  progressPct,
  unitStatuses,
} from './structure.service'

type CourseViewT = z.infer<typeof CourseView>
type UnitViewT = z.infer<typeof UnitView>

export const actionPlanPdfPath = (unitId: string, blockId: string) =>
  `/api/units/${unitId}/blocks/${blockId}/action-plan.pdf`
export const scormLaunchUrl = (pkgId: string, launchPath: string) =>
  `/api/scorm/${pkgId}/${launchPath}`

/** GET /api/microsites/{p}/courses/{slug} */
export async function courseView(
  viewer: Viewer,
  microsite: Microsite,
  slug: string,
): Promise<CourseViewT> {
  const { course, isMandatory } = await assertCourseInMicrosite(viewer, microsite, slug)
  const structure = await loadStructure(course.id)
  const state = await learnerState(viewer.id, course.id, structure)
  const statuses = unitStatuses(structure, state, {
    sequential: course.sequential,
    comingSoon: course.comingSoon,
  })
  const [enrolment] = await db
    .select()
    .from(enrolments)
    .where(and(eq(enrolments.userId, viewer.id), eq(enrolments.courseId, course.id)))
  const [cert] = await db
    .select()
    .from(courseCertificates)
    .where(
      and(eq(courseCertificates.userId, viewer.id), eq(courseCertificates.courseId, course.id)),
    )
  const final = finalAssessment(structure)
  let finalOut: CourseViewT['finalAssessment']
  if (final) {
    const a = state.attempts.get(final.id)
    const usedUp = final.attemptsAllowed > 0 && (a?.used ?? 0) >= final.attemptsAllowed
    const open = final.unitId
      ? statuses.get(final.unitId) !== 'locked'
      : structure.units.every((u) => state.completedUnits.has(u.id))
    finalOut = {
      id: final.id,
      title: final.title,
      status: a?.passed ? 'passed' : usedUp ? 'failed' : open ? 'available' : 'locked',
    }
  }
  const pct =
    enrolment?.state === 'completed'
      ? 100
      : (enrolment?.progressPct ?? progressPct(structure, state))
  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      imageUrl: await urlForStored(course.imageUrl, viewer.id),
      level: course.level as CourseViewT['course']['level'],
      durationMin: course.durationMin,
      categories: course.categories,
      isMandatory,
      certificateEnabled: course.certificateEnabled,
      progressPct: Math.round(pct),
      state: cardState({ course, isMandatory, track: null, enrolment: enrolment ?? null }),
      enrolledAt: (enrolment?.enrolledAt ?? now()).toISOString(),
    },
    modules: structure.modules.map((m) => {
      const units = structure.units.filter((u) => u.moduleId === m.id)
      const done = units.filter((u) => state.completedUnits.has(u.id)).length
      return {
        id: m.id,
        title: m.title,
        order: m.order,
        progressPct: units.length ? Math.round((done / units.length) * 100) : 0,
        units: units.map((u) => ({
          id: u.id,
          title: u.title,
          order: u.order,
          status: statuses.get(u.id) ?? 'locked',
          hasAssessment: structure.assessments.some((a) => a.unitId === u.id),
          assessments: unitAssessments(structure, state, u.id, statuses.get(u.id) ?? 'locked'),
          ...(u.durationMin != null ? { durationMin: u.durationMin } : {}),
        })),
      }
    }),
    ...(finalOut ? { finalAssessment: finalOut } : {}),
    ...(cert ? { certificate: await certificateRef(cert, viewer.id) } : {}),
  }
}

/**
 * The assessments attached to a unit, with the viewer's status: passed · failed (attempts used
 * up) · locked (unit locked) · available. Without these the client could not reach a unit quiz.
 */
function unitAssessments(
  structure: Awaited<ReturnType<typeof loadStructure>>,
  state: Awaited<ReturnType<typeof learnerState>>,
  unitId: string,
  unitStatus: string,
) {
  return structure.assessments
    .filter((a) => a.unitId === unitId)
    .map((a) => {
      const attempt = state.attempts.get(a.id)
      const usedUp = a.attemptsAllowed > 0 && (attempt?.used ?? 0) >= a.attemptsAllowed
      return {
        id: a.id,
        title: a.title,
        type: a.type as 'survey' | 'quiz_blocking' | 'quiz_non_blocking',
        status: attempt?.passed
          ? ('passed' as const)
          : usedUp
            ? ('failed' as const)
            : unitStatus === 'locked'
              ? ('locked' as const)
              : ('available' as const),
      }
    })
}

/** GET /api/units/{unitId} — locked units answer 409 `locked`. */
export async function unitView(viewer: Viewer, unitId: string): Promise<UnitViewT> {
  const { unit, course, microsite } = await loadUnitFor(viewer, unitId)
  const structure = await loadStructure(course.id)
  const state = await learnerState(viewer.id, course.id, structure)
  const statuses = unitStatuses(structure, state, {
    sequential: course.sequential,
    comingSoon: course.comingSoon,
  })
  const status = statuses.get(unitId) ?? 'locked'
  if (status === 'locked') throw locked('This unit is locked — complete the earlier units first')
  const blocks = await liveBlocks(unitId)
  const progress = await blockStates(
    viewer.id,
    blocks.map((b) => b.id),
  )
  const ctx = await payloadContext(viewer, blocks, microsite, course)
  const idx = structure.units.findIndex((u) => u.id === unitId)
  const prev = structure.units[idx - 1]
  const next = structure.units[idx + 1]
  const completion = await unitCompletion(viewer.id, unitId, structure, state)
  return {
    unit: {
      id: unit.id,
      title: unit.title,
      order: unit.order,
      moduleId: unit.moduleId,
      status,
      ...(prev ? { prevUnitId: prev.id } : {}),
      ...(next ? { nextUnitId: next.id } : {}),
    },
    blocks: (await Promise.all(
      blocks.map(async (b) => ({
        id: b.id,
        type: b.type,
        order: b.order,
        required: b.required,
        completed: Boolean(progress.get(b.id)?.completedAt),
        payload: await renderPayload(b, ctx, progress.get(b.id)?.positionSec ?? null),
      })),
    )) as UnitViewT['blocks'],
    assessments: unitAssessments(structure, state, unitId, status),
    completion:
      status === 'completed'
        ? { canComplete: true }
        : completion.reason
          ? { canComplete: false, reason: completion.reason }
          : { canComplete: completion.canComplete },
  }
}

type PayloadContext = {
  viewer: Viewer
  actionPlans: Map<string, Record<string, string>>
  surveys: Map<string, unknown[]>
  packages: Map<string, typeof scormPackages.$inferSelect>
  related: () => Promise<unknown[]>
}

async function payloadContext(
  viewer: Viewer,
  blocks: CourseBlock[],
  microsite: Microsite | null,
  course: { id: string; categories: string[] },
): Promise<PayloadContext> {
  const ids = (t: string) => blocks.filter((b) => b.type === t).map((b) => b.id)
  const ap = ids('action_plan')
  const sv = ids('survey')
  const pkgIds = blocks
    .filter((b) => b.type === 'scorm')
    .map((b) => String(b.payload.packageId ?? ''))
    .filter(Boolean)
  const actionPlans = new Map(
    ap.length
      ? (
          await db
            .select()
            .from(actionPlanAnswers)
            .where(
              and(eq(actionPlanAnswers.userId, viewer.id), inArray(actionPlanAnswers.blockId, ap)),
            )
        ).map((r) => [r.blockId, r.answers])
      : [],
  )
  const surveys = new Map(
    sv.length
      ? (
          await db
            .select()
            .from(surveyAnswers)
            .where(and(eq(surveyAnswers.userId, viewer.id), inArray(surveyAnswers.blockId, sv)))
        ).map((r) => [r.blockId, r.answers])
      : [],
  )
  const packages = new Map(
    pkgIds.length
      ? (await db.select().from(scormPackages).where(inArray(scormPackages.id, pkgIds))).map(
          (p) => [p.id, p],
        )
      : [],
  )
  let relatedCache: unknown[] | null = null
  const related = async () => {
    if (relatedCache) return relatedCache
    if (!microsite) {
      relatedCache = []
      return relatedCache
    }
    const rows = await micrositeCardRows(microsite.id, viewer.id)
    const cats = new Set(course.categories)
    const picked = rows
      .filter((r) => r.course.id !== course.id && r.course.categories.some((c) => cats.has(c)))
      .slice(0, 4)
    relatedCache = await Promise.all(picked.map((r) => toCourseCard(r, viewer.id)))
    return relatedCache
  }
  return { viewer, actionPlans, surveys, packages, related }
}

type I18nV = { en: string; ar: string }

async function renderPayload(
  block: CourseBlock,
  ctx: PayloadContext,
  positionSec: number | null,
): Promise<unknown> {
  const p = block.payload as Record<string, unknown>
  const url = (v: unknown) => urlForStored(typeof v === 'string' ? v : '', ctx.viewer.id)
  switch (block.type) {
    case 'text':
    case 'case_study':
      return { html: p.html }
    case 'image':
      return { url: await url(p.url), ...(p.caption ? { caption: p.caption } : {}), alt: p.alt }
    case 'video':
    case 'youtube':
      return {
        ...(p.videoId ? { videoId: p.videoId } : {}),
        ...(p.url ? { url: await url(p.url) } : {}),
        ...(p.title ? { title: p.title } : {}),
        ...(positionSec != null ? { resumeAtSec: positionSec } : {}),
      }
    case 'youtube_playlist':
      return { items: p.items ?? [] }
    case 'scorm': {
      const pkg = ctx.packages.get(String(p.packageId ?? ''))
      return pkg?.status === 'ready'
        ? { launchUrl: scormLaunchUrl(pkg.id, pkg.launchPath), version: pkg.version }
        : { launchUrl: '', version: pkg?.version ?? '1.2' }
    }
    case 'audio':
      return {
        url: await url(p.url),
        title: p.title,
        ...(p.transcript ? { transcript: p.transcript } : {}),
      }
    case 'quotes':
      return {
        items: ((p.items as { text: I18nV; author?: string }[]) ?? []).map((q) => ({
          text: q.text,
          ...(q.author ? { author: q.author } : {}),
        })),
      }
    case 'resources':
      return {
        items: await Promise.all(
          ((p.items as { title: I18nV; url: string; type: string }[]) ?? []).map(async (r) => ({
            title: r.title,
            url: await url(r.url),
            type: r.type,
          })),
        ),
      }
    case 'related_courses':
      return { items: await ctx.related() }
    case 'action_plan': {
      const answers = ctx.actionPlans.get(block.id)
      return {
        title: p.title,
        questions: p.questions,
        answers: answers ?? {},
        ...(answers && Object.keys(answers).length
          ? { pdfUrl: actionPlanPdfPath(block.unitId, block.id) }
          : {}),
      }
    }
    case 'survey': {
      const answers = ctx.surveys.get(block.id)
      return {
        questions: ((p.questions as SurveyQ[]) ?? []).map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          ...(q.options ? { options: q.options.map((o) => ({ id: o.id, text: o.text })) } : {}),
        })),
        ...(answers ? { answers } : {}),
      }
    }
    default:
      return p
  }
}

type SurveyQ = { id: string; text: I18nV; type: string; options?: { id: string; text: I18nV }[] }
