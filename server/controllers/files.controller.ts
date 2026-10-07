import { notFound } from '@server/lib/errors'
import { storage } from '@server/lib/storage'
import { getFile, verifySignedUrl } from '@server/services/files.service'
import type { Request, Response } from 'express'

/**
 * Serves stored files. Public files (brand imagery) by id; private files only with a valid,
 * unexpired signature bound to the requesting user (contract §0.3). Bytes are sent with the
 * verified type, `nosniff`, and as attachment unless they are images/PDF/audio.
 */
const INLINE = /^(image\/(png|jpeg|webp|gif)|application\/pdf|audio\/(mpeg|mp4))$/

async function send(
  res: Response,
  file: { key: string; contentType: string; originalName: string },
  cache: string,
) {
  const bytes = await storage().get(file.key)
  if (!bytes) throw notFound()
  res.setHeader('Content-Type', file.contentType)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', cache)
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
  const disposition = INLINE.test(file.contentType) ? 'inline' : 'attachment'
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="${file.originalName.replace(/"/g, '')}"`,
  )
  res.end(Buffer.from(bytes))
}

export async function servePublic(req: Request, res: Response) {
  const id = String(req.params.id)
  const file = /^[0-9a-f-]{36}$/i.test(id) ? await getFile(id) : null
  if (file?.visibility !== 'public') throw notFound()
  await send(res, file, 'public, max-age=86400')
}

export async function serveSigned(req: Request, res: Response) {
  const id = String(req.params.id)
  const file = /^[0-9a-f-]{36}$/i.test(id) ? await getFile(id) : null
  if (!file) throw notFound()
  if (
    file.visibility !== 'public' &&
    !verifySignedUrl(id, req.query, res.locals.viewer?.id ?? null)
  )
    throw notFound()
  await send(res, file, 'private, no-store')
}
