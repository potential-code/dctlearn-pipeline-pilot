import type { DbOrTx } from '@server/db/connection'
import { accounts, users } from '@server/db/schema/identity'
import { hashPassword, verifyPassword } from 'better-auth/crypto'
import { and, eq } from 'drizzle-orm'

/**
 * Account rows written by us (invitation accept, imports, seed) use Better Auth's own password
 * hash, so the same sign-in route works for every account.
 */
export async function createCredentialUser(
  tx: DbOrTx,
  input: {
    name: string
    email: string
    password?: string | null
    passwordHash?: string
    role: string
    status?: 'active' | 'invited' | 'disabled'
    emailVerified?: boolean
    locale?: 'en' | 'ar'
    mustSetPassword?: boolean
    legacyId?: string | null
  },
) {
  const [user] = await tx
    .insert(users)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      status: input.status ?? 'active',
      emailVerified: input.emailVerified ?? true,
      locale: input.locale ?? 'en',
      mustSetPassword: input.mustSetPassword ?? false,
      legacyId: input.legacyId ?? null,
    })
    .returning()
  if (!user) throw new Error('Failed to create user')
  const hash = input.passwordHash ?? (input.password ? await hashPassword(input.password) : null)
  await tx
    .insert(accounts)
    .values({ userId: user.id, accountId: user.id, providerId: 'credential', password: hash })
  return user
}

export async function checkPassword(tx: DbOrTx, userId: string, password: string) {
  const [account] = await tx
    .select({ password: accounts.password })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'credential')))
  if (!account?.password) return false
  return verifyPassword({ hash: account.password, password })
}

export async function findUserByEmail(tx: DbOrTx, email: string) {
  const [row] = await tx.select().from(users).where(eq(users.email, email.toLowerCase()))
  return row ?? null
}
