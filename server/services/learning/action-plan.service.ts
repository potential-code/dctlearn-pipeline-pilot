import { type DbOrTx, db } from '@server/db/connection'
import { courses } from '@server/db/schema/catalog'
import { users } from '@server/db/schema/identity'
import { actionPlanAnswers, courseBlocks } from '@server/db/schema/learning'
import { now } from '@server/lib/clock'
import { locked, notFound, validationFailed } from '@server/lib/errors'
import { storage } from '@server/lib/storage'
import { fileUrl, getFile, storeGenerated } from '@server/services/files.service'
import type { ActionPlanReader } from '@server/services/seams/action-plan.seam'
import { runActionPlanSaved } from '@server/services/seams/action-plan.seam'
import { and, eq, sql } from 'drizzle-orm'
import { loadBlockFor } from './access.service'
import { renderActionPlanPdf } from './pdf'
import { actionPlanPdfPath } from './player.service'
import { markBlockComplete, openBlockForWrite, recalcEnrolment } from './progress.service'
import { learnerState, liveBlocks, loadStructure } from './structure.service'

/**
 * Action plans (P16): autosaved answers per learner and block, locked by competition submit
 * (409 `locked`), PDF generated on demand and cached until the answers change. Implements the
 * competition area's `ActionPlanReader`.
 */

type Question = { no: number; text: { en: string; ar: string }; charLimit: number }

function questionsOf(block: { payload: Record<string, unknown> }) {
  return (block.payload.questions as Question[] | undefined) ?? []
}

async function answersRow(userId: string, blockId: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(actionPlanAnswers)
    .where(and(eq(actionPlanAnswers.userId, userId), eq(actionPlanAnswers.blockId, blockId)))
  return row ?? null
}

/** PUT .../action-plan — merges answers, checks each against its charLimit. */
export async function saveActionPlan(
  viewer: Viewer,
  unitId: string,
  blockId: string,
  answers: Record<string, string>,
) {
  await db.transaction(async (tx) => {
    const { block } = await openBlockForWrite(tx, viewer, unitId, blockId)
    if (block.type !== 'action_plan') throw notFound()
    const questions = questionsOf(block)
    const fields: Record<string, string> = {}
    for (const [no, text] of Object.entries(answers)) {
      const q = questions.find((x) => String(x.no) === no)
      if (!q) fields[`answers.${no}`] = 'No such question'
      else if (text.length > q.charLimit)
        fields[`answers.${no}`] = `At most ${q.charLimit} characters`
    }
    if (Object.keys(fields).length) throw validationFailed(fields)

    const [existing] = await tx
      .select()
      .from(actionPlanAnswers)
      .where(and(eq(actionPlanAnswers.userId, viewer.id), eq(actionPlanAnswers.blockId, blockId)))
      .for('update')
    if (existing?.lockedAt) throw locked('Your action plan was submitted and can no longer change')
    const merged = { ...(existing?.answers ?? {}), ...answers }
    if (existing)
      await tx
        .update(actionPlanAnswers)
        .set({ answers: merged, pdfFileId: null })
        .where(eq(actionPlanAnswers.id, existing.id))
    else await tx.insert(actionPlanAnswers).values({ userId: viewer.id, blockId, answers: merged })

    const complete = questions.every((q) => (merged[String(q.no)] ?? '').trim().length > 0)
    await markBlockComplete(tx, viewer.id, block, { completed: complete })
    await recalcEnrolment(tx, viewer.id, block.courseId, { activity: true })
    await runActionPlanSaved(tx, { userId: viewer.id, blockId })
  })
  return { pdfUrl: actionPlanPdfPath(unitId, blockId) }
}

/** Renders (or returns the cached) PDF for one learner's answers; null when nothing saved. */
async function ensurePdf(userId: string, blockId: string, tx: DbOrTx = db) {
  const row = await answersRow(userId, blockId, tx)
  if (!row) return null
  if (row.pdfFileId) {
    const cached = await getFile(row.pdfFileId, tx)
    if (cached) return cached
  }
  const [ctx] = await tx
    .select({ block: courseBlocks, course: courses })
    .from(courseBlocks)
    .innerJoin(courses, eq(courses.id, courseBlocks.courseId))
    .where(eq(courseBlocks.id, blockId))
  const [user] = await tx.select({ name: users.name }).from(users).where(eq(users.id, userId))
  if (!ctx) return null
  const title = (ctx.block.payload.title as { en: string } | undefined)?.en ?? 'Action plan'
  const bytes = await renderActionPlanPdf({
    title,
    learnerName: user?.name ?? '',
    courseTitle: ctx.course.title.en,
    items: questionsOf(ctx.block).map((q) => ({
      question: q.text.en,
      answer: row.answers[String(q.no)] ?? '',
    })),
    generatedAt: now(),
  })
  const file = await storeGenerated(
    bytes,
    {
      category: 'action-plan',
      contentType: 'application/pdf',
      ext: '.pdf',
      ownerId: userId,
      name: 'action-plan.pdf',
    },
    tx,
  )
  await tx
    .update(actionPlanAnswers)
    .set({ pdfFileId: file.id })
    .where(eq(actionPlanAnswers.id, row.id))
  return file
}

/** GET .../action-plan.pdf — own answers only. */
export async function actionPlanPdf(viewer: Viewer, unitId: string, blockId: string) {
  const { block } = await loadBlockFor(viewer, unitId, blockId)
  if (block.type !== 'action_plan') throw notFound()
  const file = await ensurePdf(viewer.id, blockId)
  if (!file) throw notFound()
  const bytes = await storage().get(file.key)
  if (!bytes) throw notFound()
  return bytes
}

/* ---------------------------------------------------------------- ActionPlanReader */

export const actionPlanReaderImpl: ActionPlanReader = {
  async findPitchBlock(courseId, tx = db) {
    const structure = await loadStructure(courseId, tx)
    for (const unit of [...structure.units].reverse()) {
      const blocks = (await liveBlocks(unit.id, tx)).filter((b) => b.type === 'action_plan')
      const last = blocks[blocks.length - 1]
      if (last)
        return {
          blockId: last.id,
          questions: questionsOf(last).map((q) => ({ no: q.no, text: q.text })),
        }
    }
    return null
  },
  async getAnswers(userId, blockId, tx = db) {
    const row = await answersRow(userId, blockId, tx)
    return {
      answers: row?.answers ?? {},
      updatedAt: row?.updatedAt ?? null,
      lockedAt: row?.lockedAt ?? null,
    }
  },
  async lock(userId, blockId, tx) {
    const at = now()
    await tx
      .insert(actionPlanAnswers)
      .values({ userId, blockId, answers: {}, lockedAt: at })
      .onConflictDoNothing()
    // Keep the first lock time (idempotent).
    await tx
      .update(actionPlanAnswers)
      .set({
        lockedAt: sql`coalesce(${actionPlanAnswers.lockedAt}, ${at.toISOString()}::timestamptz)`,
      })
      .where(and(eq(actionPlanAnswers.userId, userId), eq(actionPlanAnswers.blockId, blockId)))
  },
  async pdfUrl(userId, blockId, viewerId) {
    const file = await ensurePdf(userId, blockId)
    return file ? fileUrl(file, viewerId) : null
  },
  async unitProgress(userId, courseId, tx = db) {
    const structure = await loadStructure(courseId, tx)
    const state = await learnerState(userId, courseId, structure, tx)
    return { completed: state.completedUnits.size, total: structure.units.length }
  },
}
