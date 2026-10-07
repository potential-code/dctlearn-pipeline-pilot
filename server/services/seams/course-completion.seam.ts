import type { DbOrTx } from '@server/db/connection'

/**
 * Course completion is decided by the learning area (all required units + blocking
 * assessment, or an approved external certificate). Other areas that can complete a course
 * (P58 external-certificate approval) call `completeCourse`; the learning area registers the
 * implementation (certificate + points, idempotent).
 */
export type CompleteCourse = (
  tx: DbOrTx,
  input: { userId: string; courseId: string; actorId?: string | null },
) => Promise<void>

let impl: CompleteCourse = async () => {
  throw new Error('completeCourse not registered (learning area)')
}

export function setCompleteCourse(next: CompleteCourse) {
  impl = next
}

export function completeCourse(
  tx: DbOrTx,
  input: { userId: string; courseId: string; actorId?: string | null },
) {
  return impl(tx, input)
}
