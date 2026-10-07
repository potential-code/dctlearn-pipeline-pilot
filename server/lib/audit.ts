import type { DbOrTx } from '@server/db/connection'
import { auditLog } from '@server/db/schema/identity'

/**
 * Writes one append-only audit entry (contract §0.3 "Audit: yes"). Call it inside the same
 * transaction as the change so the entry exists exactly when the change does.
 */
export type AuditInput = {
  actorId: string | null
  action: string
  target: { type: string; id?: string | null; label?: string | null }
  micrositeId?: string | null
  ip?: string | null
  meta?: Record<string, unknown>
}

export async function recordAudit(tx: DbOrTx, input: AuditInput) {
  await tx.insert(auditLog).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.target.type,
    targetId: input.target.id ?? null,
    targetLabel: input.target.label ?? null,
    micrositeId: input.micrositeId ?? null,
    ip: input.ip && /^[0-9a-fA-F:.]+$/.test(input.ip) ? input.ip : null,
    meta: input.meta ?? {},
  })
}
