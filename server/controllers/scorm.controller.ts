import { notFound } from '@server/lib/errors'
import type { RouteContext } from '@server/lib/route'
import { serveScormFile } from '@server/services/learning/scorm.service'

/** `GET /api/scorm/{pkg}/*path` — Express 5 gives the wildcard as segments. */
export const file = async ({ viewer, req, res }: RouteContext<unknown, unknown, unknown>) => {
  const raw = req.params.path as unknown
  const path = Array.isArray(raw) ? raw.join('/') : typeof raw === 'string' ? raw : ''
  if (!path) throw notFound()
  await serveScormFile(viewer, String(req.params.pkg), path, res)
}
