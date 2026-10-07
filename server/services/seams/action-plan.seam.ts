import type { DbOrTx } from '@server/db/connection'

/**
 * ActionPlanReader: the competition area reads and locks a learner's action-plan answers; the
 * learning area owns the answers and implements this. Until it registers, a not-implemented
 * reader throws, and competition tests install a fake with `setActionPlanReader`.
 */
export interface ActionPlanReader {
  /** The action-plan block that holds the pitch for a course (last action_plan block), or null. */
  findPitchBlock(
    courseId: string,
    tx?: DbOrTx,
  ): Promise<{
    blockId: string
    questions: { no: number; text: { en: string; ar: string } }[]
  } | null>
  /** The learner's saved answers for that block (empty object when none). */
  getAnswers(
    userId: string,
    blockId: string,
    tx?: DbOrTx,
  ): Promise<{ answers: Record<string, string>; updatedAt: Date | null; lockedAt: Date | null }>
  /** Locks answers so later saves answer 409 (competition submit). Idempotent. */
  lock(userId: string, blockId: string, tx: DbOrTx): Promise<void>
  /** URL of the generated PDF of the answers for that viewer, or null. */
  pdfUrl(userId: string, blockId: string, viewerId: string): Promise<string | null>
  /** Units completed / total in the course for the learner. */
  unitProgress(
    userId: string,
    courseId: string,
    tx?: DbOrTx,
  ): Promise<{ completed: number; total: number }>
}

const notImplemented = (): never => {
  throw new Error('ActionPlanReader not registered (learning area)')
}

let reader: ActionPlanReader = {
  findPitchBlock: async () => notImplemented(),
  getAnswers: async () => notImplemented(),
  lock: async () => notImplemented(),
  pdfUrl: async () => notImplemented(),
  unitProgress: async () => notImplemented(),
}

export function setActionPlanReader(next: ActionPlanReader) {
  reader = next
}

export function actionPlanReader() {
  return reader
}

/** Competition → learning: answers saved while not locked move a submission to in_progress. */
type SaveHook = (tx: DbOrTx, input: { userId: string; blockId: string }) => Promise<void>
const saveHooks: SaveHook[] = []
export function onActionPlanSaved(hook: SaveHook) {
  saveHooks.push(hook)
}
export async function runActionPlanSaved(tx: DbOrTx, input: { userId: string; blockId: string }) {
  for (const hook of saveHooks) await hook(tx, input)
}
