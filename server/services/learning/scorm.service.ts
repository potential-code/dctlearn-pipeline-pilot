import { posix } from 'node:path'
import { env } from '@server/config/env'
import { db } from '@server/db/connection'
import { files } from '@server/db/schema/files'
import { courseBlocks, scormPackages } from '@server/db/schema/learning'
import { notFound, validationFailed } from '@server/lib/errors'
import { storage } from '@server/lib/storage'
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { Response } from 'express'
import { unzipSync } from 'fflate'
import { canAccessCourse } from './access.service'

/**
 * SCORM packages (P59 upload, contract §9.3 "SCORM unpack"): the zip is checked in the request
 * (zip-slip, size/count limits, `imsmanifest.xml` + launch file) and unpacked by a job into
 * `scorm/{packageId}/…`. Files are served behind the session and course access.
 */

const MAX_FILES = 5000
const MAX_UNPACKED = 500 * 1024 * 1024

/** Rejects absolute paths, drive letters, backslashes, NUL and any `..` segment. */
export function isSafeEntry(name: string) {
  if (!name || name.includes('\0') || name.includes('\\')) return false
  if (name.startsWith('/') || /^[a-zA-Z]:/.test(name)) return false
  if (name.split('/').some((seg) => seg === '..')) return false
  const norm = posix.normalize(name)
  return !norm.startsWith('..') && !norm.startsWith('/')
}

export type ScormManifest = { version: '1.2' | '2004'; launchPath: string }

export function parseManifest(xml: string, entries: Set<string>): ScormManifest {
  const version: '1.2' | '2004' =
    /<schemaversion>\s*(2004|CAM 1\.3)/i.test(xml) || /adlcp_v1p3|adlcp:scormType/.test(xml)
      ? '2004'
      : '1.2'
  const resources = [...xml.matchAll(/<resource\b[^>]*>/gi)].map((m) => m[0])
  const attr = (tag: string, name: string) =>
    new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag)?.[1] ??
    new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, 'i').exec(tag)?.[1]
  const withHref = resources.filter((r) => attr(r, 'href'))
  const sco =
    withHref.find((r) => (attr(r, 'adlcp:scormtype') ?? '').toLowerCase() === 'sco') ?? withHref[0]
  const href = sco ? attr(sco, 'href') : undefined
  if (!href) throw validationFailed({ file: 'The manifest has no launchable resource' })
  const path = href.split(/[?#]/)[0]!
  if (!isSafeEntry(path) || !entries.has(posix.normalize(path)))
    throw validationFailed({ file: 'The launch file named in the manifest is missing' })
  return { version, launchPath: href }
}

/** Checks a SCORM zip and returns its manifest + entries (decompressed). */
export function inspectScormZip(bytes: Uint8Array) {
  let count = 0
  let total = 0
  let unsafe: string | null = null
  let unzipped: Record<string, Uint8Array>
  try {
    unzipped = unzipSync(bytes, {
      filter: (f) => {
        count += 1
        total += f.originalSize
        if (!isSafeEntry(f.name)) unsafe ??= f.name
        return unsafe === null && count <= MAX_FILES && total <= MAX_UNPACKED
      },
    })
  } catch {
    throw validationFailed({ file: 'The zip file could not be read' })
  }
  if (unsafe)
    throw validationFailed({ file: `Unsafe path in zip: ${String(unsafe).slice(0, 120)}` })
  if (count > MAX_FILES || total > MAX_UNPACKED)
    throw validationFailed({ file: 'The package is too large once unpacked' })
  const entries = Object.fromEntries(
    Object.entries(unzipped)
      .filter(([name]) => !name.endsWith('/'))
      .map(([name, data]) => [posix.normalize(name), data]),
  )
  const manifest = entries['imsmanifest.xml']
  if (!manifest) throw validationFailed({ file: 'imsmanifest.xml is missing at the zip root' })
  const parsed = parseManifest(new TextDecoder().decode(manifest), new Set(Object.keys(entries)))
  return { ...parsed, entries }
}

export const isZip = (bytes: Uint8Array) =>
  bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04

/** Job: unpack the stored zip into storage and mark the package ready (or failed). */
export async function unpackPackage(packageId: string) {
  const [row] = await db
    .select({ pkg: scormPackages, file: files })
    .from(scormPackages)
    .innerJoin(files, eq(files.id, scormPackages.id))
    .where(eq(scormPackages.id, packageId))
  if (!row || row.pkg.status === 'ready') return
  try {
    const bytes = await storage().get(row.file.key)
    if (!bytes) throw new Error('Stored zip not found')
    const { version, launchPath, entries } = inspectScormZip(bytes)
    for (const [name, data] of Object.entries(entries))
      await storage().put(`scorm/${packageId}/${name}`, data, contentTypeFor(name))
    await db
      .update(scormPackages)
      .set({
        status: 'ready',
        version,
        launchPath,
        fileCount: Object.keys(entries).length,
        error: null,
      })
      .where(eq(scormPackages.id, packageId))
  } catch (error) {
    const message =
      (error as { fields?: Record<string, string> }).fields?.file ?? (error as Error).message
    await db
      .update(scormPackages)
      .set({ status: 'failed', error: message.slice(0, 500) })
      .where(eq(scormPackages.id, packageId))
  }
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.xsd': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
}
export const contentTypeFor = (name: string) =>
  TYPES[posix.extname(name).toLowerCase()] ?? 'application/octet-stream'

/** Courses whose live SCORM blocks use this package. */
async function coursesUsing(packageId: string) {
  const rows = await db
    .selectDistinct({ courseId: courseBlocks.courseId })
    .from(courseBlocks)
    .where(
      and(
        eq(courseBlocks.type, 'scorm'),
        isNull(courseBlocks.deletedAt),
        sql`${courseBlocks.payload}->>'packageId' = ${packageId}`,
      ),
    )
  return rows.map((r) => r.courseId)
}

/**
 * GET /api/scorm/{pkg}/* — session + access to a course that uses the package (learner:
 * membership of a live microsite with the course). Anything else is 404.
 */
export async function serveScormFile(
  viewer: Viewer,
  packageId: string,
  rawPath: string,
  res: Response,
) {
  if (!/^[0-9a-f-]{36}$/i.test(packageId)) throw notFound()
  const [pkg] = await db.select().from(scormPackages).where(eq(scormPackages.id, packageId))
  if (pkg?.status !== 'ready') throw notFound()
  if (viewer.role !== 'admin') {
    const courseIds = await coursesUsing(packageId)
    let ok = false
    for (const id of courseIds) if (!ok) ok = await canAccessCourse(viewer, id)
    if (!ok) throw notFound()
  }
  const path = posix.normalize(rawPath)
  if (!isSafeEntry(path)) throw notFound()
  const bytes = await storage().get(`scorm/${packageId}/${path}`)
  if (!bytes) throw notFound()
  res.setHeader('Content-Type', contentTypeFor(path))
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'private, max-age=300')
  // SCORM content runs scripts and talks to the player's SCORM API in the parent frame, so it
  // gets a CSP of its own (same-origin assets only) instead of the API's `default-src 'none'`.
  const frameAncestors = ["'self'", ...env.CORS_ORIGINS].join(' ')
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors ${frameAncestors}; base-uri 'self'; form-action 'self'`,
  )
  res.removeHeader('X-Frame-Options')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  res.end(Buffer.from(bytes))
}
