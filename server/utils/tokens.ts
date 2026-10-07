// Forked from potential-template packages/core/src/auth/tokens.ts.
import crypto from 'node:crypto'

/** URL-safe random token (32 bytes of entropy). */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

/** SHA-256 for storage: tokens are high-entropy, so a fast hash is right; only the hash is kept. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
