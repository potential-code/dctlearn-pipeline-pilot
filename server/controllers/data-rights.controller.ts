import type { RouteContext } from '@server/lib/route'
import * as svc from '@server/services/platform/data-rights.service'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>

export const requestExport = ({ viewer }: Ctx) => svc.requestExport(viewer)

export const downloadExport = async ({ params, viewer, res }: Ctx<{ id: string }>) => {
  const file = await svc.downloadOwnExport(params.id, viewer)
  res.setHeader('Content-Type', `${file.contentType}; charset=utf-8`)
  res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/"/g, '')}"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(Buffer.from(file.bytes))
}

export const requestDeletion = ({ viewer }: Ctx) => svc.requestDeletion(viewer)

export const anonymise = ({ params, viewer }: Ctx<{ id: string }>) =>
  svc.anonymiseUser(params.id, viewer)
