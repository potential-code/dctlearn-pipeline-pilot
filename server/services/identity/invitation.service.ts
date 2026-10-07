import { env } from '@server/config/env'
import { type DbOrTx, db, type Tx } from '@server/db/connection'
import { invitations, users } from '@server/db/schema/identity'
import { type Microsite, microsites } from '@server/db/schema/microsites'
import { queueEmail } from '@server/jobs/email.job'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, invitationInvalid, locked, notFound, validationFailed } from '@server/lib/errors'
import { findMicrositeById, toMicrositeRef } from '@server/services/microsites/lookup.service'
import { getMembership, joinMicrosite } from '@server/services/microsites/membership.service'
import { generateToken, hashToken } from '@server/utils/tokens'
import { type Role, UPGRADABLE_FROM_LEARNER } from '@shared/roles'
import { email as emailSchema } from '@shared/schemas/common'
import { and, eq, gt, lt } from 'drizzle-orm'
import { checkPassword, createCredentialUser, findUserByEmail } from './accounts.service'

/**
 * Invitations (P11, P40, P42, P48). 14-day single-use tokens bound to the invited e-mail; only
 * the SHA-256 is stored. Role and microsite come from the invitation, never from a request body.
 */

export const INVITATION_TTL_DAYS = 14

export type Invitation = typeof invitations.$inferSelect

/** Other areas react to an accepted invitation (mentor profile, judge roster) through hooks. */
type AcceptHook = (
  tx: Tx,
  input: { invitation: Invitation; userId: string; isNewUser: boolean },
) => Promise<void>
const acceptHooks: AcceptHook[] = []
export function onInvitationAccepted(hook: AcceptHook) {
  acceptHooks.push(hook)
}

const ROLE_LABEL: Record<string, string> = {
  learner: 'a learner',
  judge: 'a judge',
  mentor: 'a mentor',
  sub_admin: 'a microsite admin',
  admin: 'an administrator',
}

export function invitationUrl(token: string) {
  return `${env.APP_URL}/invite/${token}`
}

async function sendInvitationEmail(
  tx: DbOrTx,
  inv: Invitation,
  token: string,
  inviterName: string,
  microsite: Microsite | null,
) {
  await queueEmail(
    inv.email,
    'invitation',
    {
      url: invitationUrl(token),
      invitedBy: inviterName,
      micrositeName: microsite?.name.en ?? 'DCT Learn',
      roleLabel: ROLE_LABEL[inv.role] ?? inv.role,
      message: inv.message,
      expiresAt: inv.expiresAt.toISOString().slice(0, 10),
    },
    { tx },
  )
}

export type CreateInvitationsInput = {
  emails: string[]
  role: Role
  micrositeId: string | null
  message?: string | null
  inviter: { id: string; name: string; ip?: string }
  meta?: Record<string, unknown>
}

export type Skipped = { email: string; reason: string }

/** Creates one invitation per new address; returns what was created and what was skipped. */
export async function createInvitations(input: CreateInvitationsInput, tx?: Tx) {
  const run = async (t: Tx) => {
    const microsite = input.micrositeId ? await findMicrositeById(input.micrositeId, t) : null
    const created: { id: string; email: string; token: string }[] = []
    const skipped: Skipped[] = []
    const seen = new Set<string>()
    for (const raw of input.emails) {
      const parsed = emailSchema.safeParse(raw)
      if (!parsed.success) {
        skipped.push({ email: raw, reason: 'invalid_email' })
        continue
      }
      const address = parsed.data
      if (seen.has(address)) {
        skipped.push({ email: address, reason: 'duplicate' })
        continue
      }
      seen.add(address)

      const existing = await findUserByEmail(t, address)
      if (existing) {
        if (existing.status === 'disabled') {
          skipped.push({ email: address, reason: 'account_disabled' })
          continue
        }
        const sameRole = existing.role === input.role
        const upgrade = existing.role === 'learner' && UPGRADABLE_FROM_LEARNER.includes(input.role)
        if (!sameRole && !upgrade) {
          skipped.push({ email: address, reason: 'role_conflict' })
          continue
        }
        if (
          sameRole &&
          input.role === 'learner' &&
          microsite &&
          (await getMembership(t, existing.id, microsite.id))
        ) {
          skipped.push({ email: address, reason: 'already_member' })
          continue
        }
      }
      const [pending] = await t
        .select({ id: invitations.id })
        .from(invitations)
        .where(
          and(
            eq(invitations.email, address),
            eq(invitations.role, input.role),
            eq(invitations.status, 'sent'),
            gt(invitations.expiresAt, now()),
            microsite ? eq(invitations.micrositeId, microsite.id) : undefined,
          ),
        )
      if (pending) {
        skipped.push({ email: address, reason: 'already_invited' })
        continue
      }

      const token = generateToken()
      const [inv] = await t
        .insert(invitations)
        .values({
          email: address,
          role: input.role,
          micrositeId: microsite?.id ?? null,
          tokenHash: hashToken(token),
          message: input.message ?? null,
          meta: input.meta ?? {},
          invitedById: input.inviter.id,
          expiresAt: new Date(now().getTime() + INVITATION_TTL_DAYS * 86_400_000),
        })
        .returning()
      if (!inv) continue
      await sendInvitationEmail(t, inv, token, input.inviter.name, microsite)
      await recordAudit(t, {
        actorId: input.inviter.id,
        action: 'invitation.create',
        target: { type: 'invitation', id: inv.id, label: `${address} (${input.role})` },
        micrositeId: microsite?.id,
        ip: input.inviter.ip,
      })
      created.push({ id: inv.id, email: address, token })
    }
    return { created, skipped }
  }
  return tx ? run(tx) : db.transaction(run)
}

export async function getInvitation(id: string, tx: DbOrTx = db) {
  const [row] = await tx.select().from(invitations).where(eq(invitations.id, id))
  return row ?? null
}

/** sent/revoked/expired → a new `sent` invitation with a new token; the old token stays invalid. */
export async function resendInvitation(
  id: string,
  actor: { id: string; name: string; ip?: string },
  scopeMicrositeId?: string,
) {
  return db.transaction(async (tx) => {
    const [old] = await tx.select().from(invitations).where(eq(invitations.id, id)).for('update')
    if (!old || (scopeMicrositeId && old.micrositeId !== scopeMicrositeId)) throw notFound()
    if (old.status === 'accepted') throw locked('This invitation was already accepted')
    if (old.status === 'sent') {
      await tx
        .update(invitations)
        .set({ status: 'revoked', revokedAt: now() })
        .where(eq(invitations.id, old.id))
    }
    const token = generateToken()
    const [inv] = await tx
      .insert(invitations)
      .values({
        email: old.email,
        role: old.role,
        micrositeId: old.micrositeId,
        tokenHash: hashToken(token),
        message: old.message,
        meta: old.meta,
        invitedById: actor.id,
        resentFromId: old.id,
        expiresAt: new Date(now().getTime() + INVITATION_TTL_DAYS * 86_400_000),
      })
      .returning()
    if (!inv) throw new Error('resend failed')
    const microsite = old.micrositeId ? await findMicrositeById(old.micrositeId, tx) : null
    await sendInvitationEmail(tx, inv, token, actor.name, microsite)
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'invitation.resend',
      target: { type: 'invitation', id: inv.id, label: old.email },
      micrositeId: old.micrositeId,
      ip: actor.ip,
    })
    return { invitation: inv, token }
  })
}

/** sent → revoked (inviter or admin, audited). */
export async function revokeInvitation(
  id: string,
  actor: { id: string; ip?: string },
  scopeMicrositeId?: string,
) {
  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invitations).where(eq(invitations.id, id)).for('update')
    if (!inv || (scopeMicrositeId && inv.micrositeId !== scopeMicrositeId)) throw notFound()
    if (inv.status !== 'sent') throw conflict('Only a sent invitation can be revoked')
    const [row] = await tx
      .update(invitations)
      .set({ status: 'revoked', revokedAt: now() })
      .where(eq(invitations.id, id))
      .returning()
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'invitation.revoke',
      target: { type: 'invitation', id, label: inv.email },
      micrositeId: inv.micrositeId,
      ip: actor.ip,
    })
    return row!
  })
}

async function findByToken(tx: DbOrTx, token: string, forUpdate = false) {
  const q = tx
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, hashToken(token)))
  const [row] = forUpdate ? await q.for('update') : await q
  return row ?? null
}

function isValid(inv: Invitation) {
  return inv.status === 'sent' && inv.expiresAt > now()
}

/** P11 GET: 410 for an unknown token; `valid:false` for a used, revoked or expired one. */
export async function viewInvitation(token: string) {
  const inv = await findByToken(db, token)
  if (!inv) throw invitationInvalid()
  const microsite = inv.micrositeId ? await findMicrositeById(inv.micrositeId) : null
  const [inviter] = inv.invitedById
    ? await db.select({ name: users.name }).from(users).where(eq(users.id, inv.invitedById))
    : []
  return {
    valid: isValid(inv),
    email: inv.email,
    role: inv.role as Role,
    ...(microsite ? { microsite: await toMicrositeRef(microsite) } : {}),
    invitedBy: inviter?.name ?? 'DCT Learn',
    expiresAt: inv.expiresAt.toISOString(),
  }
}

/**
 * P11 accept. Transactional and single-use (row lock): a second call gets 410. New e-mail →
 * new verified account with the invitation's role. Existing account → must give its current
 * password; a learner may be upgraded to judge/mentor/sub_admin (audited); other role changes 409.
 */
export async function acceptInvitation(
  token: string,
  input: { name: string; password: string; locale: 'en' | 'ar' },
  ip?: string,
) {
  return db.transaction(async (tx) => {
    const inv = await findByToken(tx, token, true)
    if (!inv || !isValid(inv)) throw invitationInvalid()

    let user = await findUserByEmail(tx, inv.email)
    const isNewUser = !user
    if (user) {
      if (user.status === 'disabled') throw invitationInvalid()
      if (!(await checkPassword(tx, user.id, input.password))) {
        throw validationFailed({
          password: 'This e-mail already has an account: enter its current password',
        })
      }
      if (user.role !== inv.role) {
        if (user.role === 'learner' && UPGRADABLE_FROM_LEARNER.includes(inv.role as Role)) {
          await tx.update(users).set({ role: inv.role }).where(eq(users.id, user.id))
          await recordAudit(tx, {
            actorId: user.id,
            action: 'user.role_upgrade',
            target: { type: 'user', id: user.id, label: user.email },
            micrositeId: inv.micrositeId,
            ip,
            meta: { from: user.role, to: inv.role, invitationId: inv.id },
          })
        } else {
          throw conflict('This account already has a different role')
        }
      }
      if (user.status === 'invited')
        await tx.update(users).set({ status: 'active' }).where(eq(users.id, user.id))
    } else {
      user = await createCredentialUser(tx, {
        name: input.name,
        email: inv.email,
        password: input.password,
        role: inv.role,
        locale: input.locale,
        emailVerified: true,
      })
    }

    if (inv.micrositeId) {
      if (inv.role === 'learner') await joinMicrosite(tx, user.id, inv.micrositeId, 'invitation')
      if (inv.role === 'sub_admin') {
        await tx
          .update(microsites)
          .set({ subAdminId: user.id })
          .where(eq(microsites.id, inv.micrositeId))
      }
    }
    await tx
      .update(invitations)
      .set({ status: 'accepted', acceptedAt: now(), acceptedById: user.id })
      .where(eq(invitations.id, inv.id))
    for (const hook of acceptHooks) await hook(tx, { invitation: inv, userId: user.id, isNewUser })
    await recordAudit(tx, {
      actorId: user.id,
      action: 'invitation.accept',
      target: { type: 'invitation', id: inv.id, label: inv.email },
      micrositeId: inv.micrositeId,
      ip,
    })
    return { userId: user.id, email: inv.email }
  })
}

/** Hourly: sent → expired once the expiry has passed (contract §9.3). */
export async function expireInvitations() {
  const rows = await db
    .update(invitations)
    .set({ status: 'expired' })
    .where(and(eq(invitations.status, 'sent'), lt(invitations.expiresAt, now())))
    .returning({ id: invitations.id })
  return rows.length
}
