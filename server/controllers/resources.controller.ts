import type { RouteContext } from '@server/lib/route'
import { micrositeOf } from '@server/middleware/microsite.middleware'
import * as svc from '@server/services/resources/resources.service'
import type {
  AdminResourcesQuery,
  ResourceInput,
  SubResourcesQuery,
} from '@shared/schemas/resources'
import type { Request } from 'express'
import type { z } from 'zod'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
type Id = { id: string }

const upload = (req: Request): svc.UploadedFile | undefined =>
  req.file
    ? {
        bytes: new Uint8Array(req.file.buffer),
        mime: req.file.mimetype,
        name: req.file.originalname,
      }
    : undefined

/* P53 sub admin */
export const subList = ({ viewer, res, query }: Ctx<unknown, z.infer<typeof SubResourcesQuery>>) =>
  svc.listSubResources(micrositeOf(res), query, viewer)
export const subCreate = ({ viewer, res, req, body }: Ctx<unknown, unknown, ResourceInput>) =>
  svc.createResource(micrositeOf(res), body, upload(req), viewer)
export const subUpdate = ({ viewer, res, req, params, body }: Ctx<Id, unknown, ResourceInput>) =>
  svc.updateResource(micrositeOf(res), params.id, body, upload(req), viewer)
export const subDelete = async ({ viewer, res, params }: Ctx<Id>) => {
  await svc.deleteResource(micrositeOf(res), params.id, viewer)
}

/* P54 admin */
export const adminList = ({ viewer, query }: Ctx<unknown, z.infer<typeof AdminResourcesQuery>>) =>
  svc.listAdminResources(query, viewer)
export const approve = ({ viewer, params }: Ctx<Id>) =>
  svc.reviewResource(params.id, { approve: true }, viewer)
export const reject = ({ viewer, params, body }: Ctx<Id, unknown, { note: string }>) =>
  svc.reviewResource(params.id, { approve: false, note: body.note }, viewer)
