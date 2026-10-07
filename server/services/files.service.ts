import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { fileSigningSecret } from '@server/config/env'
import { maxBytesFor, UPLOAD_POLICIES, type UploadCategory } from '@server/config/upload-policies'
import { type DbOrTx, db } from '@server/db/connection'
import { files } from '@server/db/schema/files'
import { HttpError, payloadTooLarge } from '@server/lib/errors'
import { storage } from '@server/lib/storage'
import { verifyFileType } from '@server/utils/file-signature'
import { eq } from 'drizzle-orm'

export type UploadInput = {
  bytes: Uint8Array
  declaredMime: string
  originalName: string
  category: UploadCategory
  ownerId: string | null
  visibility?: 'public' | 'private'
}

export type StoredFile = typeof files.$inferSelect

const unsupported = () =>
  new HttpError(422, 'validation_failed', 'This file type is not allowed', {
    file: 'This file type is not allowed',
  })

/** Verifies type by content and size by policy, stores the bytes, records the row. */
export async function storeUpload(input: UploadInput, tx: DbOrTx = db): Promise<StoredFile> {
  const policy = UPLOAD_POLICIES[input.category]
  if (input.bytes.byteLength === 0) throw unsupported()
  if (input.bytes.byteLength > policy.maxBytes) throw payloadTooLarge()
  const verified = verifyFileType(input.bytes, input.declaredMime)
  if (!verified || !(policy.mimes as readonly string[]).includes(verified.mime)) throw unsupported()
  if (input.bytes.byteLength > maxBytesFor(verified.mime)) throw payloadTooLarge()

  const id = randomUUID()
  const key = `${input.category}/${new Date().toISOString().slice(0, 7)}/${id}${verified.ext}`
  await storage().put(key, input.bytes, verified.mime)
  const [row] = await tx
    .insert(files)
    .values({
      id,
      key,
      category: input.category,
      contentType: verified.mime,
      size: input.bytes.byteLength,
      originalName: input.originalName.replace(/[^\w.\- ]+/g, '_').slice(0, 200),
      ownerId: input.ownerId,
      visibility: input.visibility ?? 'private',
    })
    .returning()
  return row as StoredFile
}

/** Stores bytes we generated ourselves (PDFs, exports) without content sniffing. */
export async function storeGenerated(
  bytes: Uint8Array,
  opts: {
    category: string
    contentType: string
    ext: string
    ownerId: string | null
    name: string
  },
  tx: DbOrTx = db,
): Promise<StoredFile> {
  const id = randomUUID()
  const key = `${opts.category}/${new Date().toISOString().slice(0, 7)}/${id}${opts.ext}`
  await storage().put(key, bytes, opts.contentType)
  const [row] = await tx
    .insert(files)
    .values({
      id,
      key,
      category: opts.category,
      contentType: opts.contentType,
      size: bytes.byteLength,
      originalName: opts.name,
      ownerId: opts.ownerId,
    })
    .returning()
  return row as StoredFile
}

export async function getFile(id: string, tx: DbOrTx = db) {
  const [row] = await tx.select().from(files).where(eq(files.id, id))
  return row ?? null
}

/* ---------------------------------------------------------------- signed URLs */

export const SIGNED_URL_TTL_SECONDS = 300

function sign(fileId: string, exp: number, uid: string) {
  return createHmac('sha256', fileSigningSecret)
    .update(`${fileId}:${exp}:${uid}`)
    .digest('base64url')
}

/**
 * Contract §0.3: signed file URLs have a 5-minute TTL and are tied to the requesting user.
 * Public brand/course imagery gets a stable unsigned URL instead.
 */
export function fileUrl(
  file: Pick<StoredFile, 'id' | 'visibility'>,
  viewerId: string | null,
  ttl = SIGNED_URL_TTL_SECONDS,
) {
  if (file.visibility === 'public') return `/api/files/public/${file.id}`
  const exp = Math.floor(Date.now() / 1000) + ttl
  const uid = viewerId ?? 'anon'
  return `/api/files/${file.id}?exp=${exp}&uid=${encodeURIComponent(uid)}&sig=${sign(file.id, exp, uid)}`
}

/** Checks signature (constant time), expiry and that the caller is the user it was signed for. */
export function verifySignedUrl(
  fileId: string,
  q: { exp?: unknown; uid?: unknown; sig?: unknown },
  viewerId: string | null,
) {
  const exp = Number(q.exp)
  const uid = typeof q.uid === 'string' ? q.uid : ''
  const sig = typeof q.sig === 'string' ? q.sig : ''
  if (!Number.isFinite(exp) || !uid || !sig) return false
  const expected = Buffer.from(sign(fileId, exp, uid))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false
  if (exp * 1000 < Date.now()) return false
  return uid === (viewerId ?? 'anon')
}

/** URL for a stored file id (or an already-public path / external https URL kept as is). */
export async function urlForStored(
  value: string | null | undefined,
  viewerId: string | null,
): Promise<string> {
  if (!value) return ''
  if (!/^[0-9a-f-]{36}$/i.test(value)) return value
  const file = await getFile(value)
  return file ? fileUrl(file, viewerId) : ''
}
