import { type DbOrTx, db } from '@server/db/connection'
import { csvImports } from '@server/db/schema/imports'
import { now } from '@server/lib/clock'
import { conflict, notFound } from '@server/lib/errors'
import { generateToken, hashToken } from '@server/utils/tokens'
import { and, eq, lt } from 'drizzle-orm'

const TTL_MINUTES = 30

/**
 * Stores a previewed import. An older pending preview for the same scope by the same user is
 * replaced; one by someone else blocks with 409 until it is confirmed or expires.
 */
export async function createImport(kind: string, scope: string, rows: unknown[], userId: string) {
  return db.transaction(async (tx) => {
    await tx
      .update(csvImports)
      .set({ status: 'expired' })
      .where(
        and(
          eq(csvImports.kind, kind),
          eq(csvImports.scope, scope),
          eq(csvImports.status, 'pending'),
          lt(csvImports.expiresAt, now()),
        ),
      )
    const [pending] = await tx
      .select()
      .from(csvImports)
      .where(
        and(
          eq(csvImports.kind, kind),
          eq(csvImports.scope, scope),
          eq(csvImports.status, 'pending'),
        ),
      )
    if (pending && pending.createdById !== userId)
      throw conflict('Another import is in progress for this list')
    if (pending)
      await tx.update(csvImports).set({ status: 'expired' }).where(eq(csvImports.id, pending.id))
    const token = generateToken(24)
    await tx.insert(csvImports).values({
      kind,
      scope,
      rows,
      tokenHash: hashToken(token),
      createdById: userId,
      expiresAt: new Date(now().getTime() + TTL_MINUTES * 60_000),
    })
    return token
  })
}

/** Claims a pending import (row lock) for confirmation; marks it confirmed in the same tx. */
export async function claimImport(
  tx: DbOrTx,
  kind: string,
  scope: string,
  token: string,
  userId: string,
) {
  const [row] = await tx
    .select()
    .from(csvImports)
    .where(
      and(
        eq(csvImports.tokenHash, hashToken(token)),
        eq(csvImports.kind, kind),
        eq(csvImports.scope, scope),
      ),
    )
    .for('update')
  if (!row || row.createdById !== userId || row.status !== 'pending' || row.expiresAt < now())
    throw notFound('Preview expired — upload the file again')
  await tx.update(csvImports).set({ status: 'confirmed' }).where(eq(csvImports.id, row.id))
  return row.rows
}
