import { db } from '@server/db/connection'
import { scormPackages, scormStates, surveyAnswers } from '@server/db/schema/learning'
import { notFound, validationFailed } from '@server/lib/errors'
import type { ScormCmi, SurveyAnswer } from '@shared/schemas/learning'
import { and, eq } from 'drizzle-orm'
import type { z } from 'zod'
import { loadBlockFor } from './access.service'
import { scormLaunchUrl } from './player.service'
import { markBlockComplete, openBlockForWrite, recalcEnrolment } from './progress.service'

/** Survey block answers and SCORM runtime state (P16), own rows only. */

type SurveyQ = { id: string; type: string; options?: { id: string }[] }

export async function saveSurveyBlock(
  viewer: Viewer,
  unitId: string,
  blockId: string,
  answers: z.infer<typeof SurveyAnswer>[],
) {
  await db.transaction(async (tx) => {
    const { block } = await openBlockForWrite(tx, viewer, unitId, blockId)
    if (block.type !== 'survey') throw notFound()
    const questions = (block.payload.questions as SurveyQ[] | undefined) ?? []
    const fields: Record<string, string> = {}
    answers.forEach((a, i) => {
      const q = questions.find((x) => x.id === a.questionId)
      if (!q) fields[`answers.${i}.questionId`] = 'No such question'
      else {
        const known = new Set((q.options ?? []).map((o) => o.id))
        if ([...(a.optionIds ?? []), ...(a.order ?? [])].some((id) => !known.has(id)))
          fields[`answers.${i}.optionIds`] = 'No such option'
      }
    })
    if (Object.keys(fields).length) throw validationFailed(fields)
    await tx
      .insert(surveyAnswers)
      .values({ userId: viewer.id, blockId, answers })
      .onConflictDoUpdate({
        target: [surveyAnswers.userId, surveyAnswers.blockId],
        set: { answers },
      })
    await markBlockComplete(tx, viewer.id, block, { completed: true })
    await recalcEnrolment(tx, viewer.id, block.courseId, { activity: true })
  })
  return { completed: true as const }
}

async function packageOf(packageId: unknown) {
  if (typeof packageId !== 'string' || !/^[0-9a-f-]{36}$/i.test(packageId)) return null
  const [pkg] = await db.select().from(scormPackages).where(eq(scormPackages.id, packageId))
  return pkg ?? null
}

export async function getScormBlock(viewer: Viewer, unitId: string, blockId: string) {
  const { block } = await loadBlockFor(viewer, unitId, blockId)
  if (block.type !== 'scorm') throw notFound()
  const pkg = await packageOf(block.payload.packageId)
  const [state] = await db
    .select()
    .from(scormStates)
    .where(and(eq(scormStates.userId, viewer.id), eq(scormStates.blockId, blockId)))
  return {
    launchUrl: pkg?.status === 'ready' ? scormLaunchUrl(pkg.id, pkg.launchPath) : '',
    version: (pkg?.version ?? '1.2') as '1.2' | '2004',
    ...(state ? { state: { cmi: state.cmi as z.infer<typeof ScormCmi> } } : {}),
  }
}

/** Block completes when the SCO reports completed / passed. */
export async function putScormBlock(
  viewer: Viewer,
  unitId: string,
  blockId: string,
  cmi: z.infer<typeof ScormCmi>,
) {
  await db.transaction(async (tx) => {
    const { block } = await openBlockForWrite(tx, viewer, unitId, blockId)
    if (block.type !== 'scorm') throw notFound()
    await tx
      .insert(scormStates)
      .values({ userId: viewer.id, blockId, cmi })
      .onConflictDoUpdate({ target: [scormStates.userId, scormStates.blockId], set: { cmi } })
    const done =
      cmi.completionStatus === 'completed' ||
      cmi.completionStatus === 'passed' ||
      cmi.successStatus === 'passed'
    if (done) await markBlockComplete(tx, viewer.id, block, { completed: true })
    await recalcEnrolment(tx, viewer.id, block.courseId, { activity: true })
  })
}
