import { validationFailed } from '@server/lib/errors'
import type { RouteContext } from '@server/lib/route'
import * as svc from '@server/services/identity/admin-users.service'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
// biome-ignore lint/suspicious/noExplicitAny: validated by the route schema
type Any = any

export const list = ({ query, viewer }: Ctx<unknown, Any>) => svc.listUsers(query, viewer)
export const detail = ({ params, viewer }: Ctx<{ id: string }>) =>
  svc.getUserDetail(params.id, viewer)
export const update = ({ params, body, viewer }: Ctx<{ id: string }, unknown, Any>) =>
  svc.updateUser(params.id, body, viewer)
export const resetPassword = async ({ params, viewer }: Ctx<{ id: string }>) => {
  await svc.sendPasswordReset(params.id, viewer)
}
export const importPreview = async ({ req, viewer }: Ctx) => {
  if (!req.file) throw validationFailed({ file: 'Choose a CSV file' })
  return svc.previewUserImport(req.file.buffer.toString('utf-8'), viewer)
}
export const importConfirm = ({
  body,
  viewer,
}: Ctx<unknown, unknown, { token: string; sendWelcome: boolean }>) =>
  svc.confirmUserImport(body.token, body.sendWelcome, viewer)
export const sample = async ({ res }: Ctx) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="users-sample.csv"')
  res.send(svc.sampleCsv())
}
export const audit = ({ query, viewer }: Ctx<unknown, Any>) => svc.listAudit(query, viewer)
