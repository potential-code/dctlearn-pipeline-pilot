import { readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import type { DbOrTx } from '@server/db/connection'
import { files } from '@server/db/schema/files'
import { storage } from '@server/lib/storage'
import { verifyFileType } from '@server/utils/file-signature'

/**
 * Uploads the brand pack (seed/assets) as public files so seeded microsites, courses and
 * certificates show DCT's real imagery. Returns `relative path → file id`. The licence-pending
 * fonts are never touched.
 */
const ROOT = join(import.meta.dir, '../../../seed/assets')
const FOLDERS = [
  'logos',
  'heroes',
  'cards',
  'partners',
  'certificates',
  'badges',
  'backgrounds',
  'popups',
  'people',
]
const DECLARED: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export async function uploadBrandPack(tx: DbOrTx) {
  const out: Record<string, string> = {}
  for (const folder of FOLDERS) {
    let names: string[] = []
    try {
      names = readdirSync(join(ROOT, folder))
    } catch {
      continue
    }
    for (const name of names) {
      const declared = DECLARED[extname(name).toLowerCase()]
      if (!declared) continue
      const bytes = new Uint8Array(readFileSync(join(ROOT, folder, name)))
      const verified = verifyFileType(bytes, declared)
      if (!verified) continue
      const key = `brand/${folder}/${basename(name, extname(name))}${verified.ext}`
      await storage().put(key, bytes, verified.mime)
      const [row] = await tx
        .insert(files)
        .values({
          key,
          category: 'brand',
          contentType: verified.mime,
          size: bytes.byteLength,
          originalName: name,
          visibility: 'public',
        })
        .returning({ id: files.id })
      out[`${folder}/${name}`] = row!.id
      // Also index by key without extension (cards/C01 → id) for convenience.
      out[`${folder}/${basename(name, extname(name))}`] = row!.id
    }
  }
  return out
}
