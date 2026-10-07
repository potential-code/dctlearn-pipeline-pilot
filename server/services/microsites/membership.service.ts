import type { DbOrTx } from '@server/db/connection'
import { memberships } from '@server/db/schema/microsites'
import { enrolInMicrositeCourses } from '@server/services/catalog/enrolment.service'
import { and, eq } from 'drizzle-orm'

/**
 * Memberships. Joining enrols in the microsite's courses, then runs any `onJoin` hooks other
 * areas registered (e.g. mentoring registration defaults). Never trusts ids from a body.
 */
type JoinHook = (tx: DbOrTx, input: { userId: string; micrositeId: string }) => Promise<void>
const joinHooks: JoinHook[] = []

export function onMembershipJoin(hook: JoinHook) {
  joinHooks.push(hook)
}

export type MembershipSource = 'invitation' | 'signup' | 'rule' | 'admin' | 'import' | 'seed'

/** Adds a membership if missing. Returns true when a new one was created. */
export async function joinMicrosite(
  tx: DbOrTx,
  userId: string,
  micrositeId: string,
  source: MembershipSource,
) {
  const inserted = await tx
    .insert(memberships)
    .values({ userId, micrositeId, source })
    .onConflictDoNothing()
    .returning({ id: memberships.id })
  if (inserted.length === 0) return false
  await enrolInMicrositeCourses(tx, userId, micrositeId)
  for (const hook of joinHooks) await hook(tx, { userId, micrositeId })
  return true
}

export async function leaveMicrosite(tx: DbOrTx, userId: string, micrositeId: string) {
  const removed = await tx
    .delete(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.micrositeId, micrositeId)))
    .returning({ id: memberships.id })
  return removed.length > 0
}

export async function getMembership(tx: DbOrTx, userId: string, micrositeId: string) {
  const [row] = await tx
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.micrositeId, micrositeId)))
  return row ?? null
}

export async function listMembershipIds(tx: DbOrTx, userId: string) {
  const rows = await tx
    .select({ micrositeId: memberships.micrositeId })
    .from(memberships)
    .where(eq(memberships.userId, userId))
  return rows.map((r) => r.micrositeId)
}
