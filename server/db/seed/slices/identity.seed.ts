import type { DbOrTx } from '@server/db/connection'
import { userProfiles } from '@server/db/schema/identity'
import { createCredentialUser } from '@server/services/identity/accounts.service'
import { hashPassword } from 'better-auth/crypto'
import { PEOPLE, SEED_PASSWORD } from '../data'

let cachedHash: string | null = null
/** One scrypt hash reused for every seeded account (same password), so fixtures stay fast. */
export async function seedPasswordHash() {
  cachedHash ??= await hashPassword(SEED_PASSWORD)
  return cachedHash
}

export type SeededUsers = Record<string, { id: string; email: string; name: string; role: string }>

/** SEED §4 people (no memberships — see microsites slice). */
export async function seedIdentity(tx: DbOrTx): Promise<SeededUsers> {
  const passwordHash = await seedPasswordHash()
  const out: SeededUsers = {}
  for (const p of PEOPLE) {
    const user = await createCredentialUser(tx, {
      name: p.name,
      email: p.email,
      passwordHash,
      role: p.role,
      status: p.status ?? 'active',
      emailVerified: true,
    })
    const [first, ...rest] = p.name.replace(/^Dr\. /, '').split(' ')
    await tx
      .insert(userProfiles)
      .values({ userId: user.id, firstName: first ?? '', lastName: rest.join(' ') })
    out[p.key] = { id: user.id, email: user.email, name: user.name, role: user.role }
  }
  return out
}
