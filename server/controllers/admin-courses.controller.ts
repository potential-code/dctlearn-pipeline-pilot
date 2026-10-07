import { validationFailed } from '@server/lib/errors'
import type { RouteContext } from '@server/lib/route'
import { fileUrl } from '@server/services/files.service'
import * as svc from '@server/services/learning/admin-courses.service'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
// biome-ignore lint/suspicious/noExplicitAny: bodies are validated by the route's schema
type Any = any
type C = { id: string }
type M = C & { mid: string }
type U = C & { uid: string }
type B = C & { bid: string }
type A = C & { aid: string }
type Q = A & { qid: string }

/** P46 Catalog · P59 Course editor · P58 course points. */
export const list = ({ query }: Ctx<unknown, Any>) => svc.listCourses(query)
export const create = ({ viewer, body }: Ctx<unknown, unknown, Any>) =>
  svc.createCourse(body, viewer)
export const detail = ({ params }: Ctx<C>) => svc.courseDetail(params.id)
export const update = ({ viewer, params, body }: Ctx<C, unknown, Any>) =>
  svc.updateCourse(params.id, body, viewer)
export const publish = ({ viewer, params }: Ctx<C>) => svc.publishCourse(params.id, viewer)
export const archive = ({ viewer, params }: Ctx<C>) => svc.archiveCourse(params.id, viewer)

const detailOf = (id: string) => svc.courseDetail(id)

export const createModule = ({ params, body }: Ctx<C, unknown, Any>) =>
  svc.createModule(params.id, body.title)
export const updateModule = async ({ params, body }: Ctx<M, unknown, Any>) => {
  await svc.updateModule(params.id, params.mid, body.title)
  return detailOf(params.id)
}
export const deleteModule = async ({ params }: Ctx<M>) => {
  await svc.deleteModule(params.id, params.mid)
}
export const reorderModules = async ({ params, body }: Ctx<C, unknown, Any>) => {
  await svc.reorderModules(params.id, body.ids)
  return detailOf(params.id)
}
export const createUnit = ({ params, body }: Ctx<M, unknown, Any>) =>
  svc.createUnit(params.id, params.mid, body)
export const updateUnit = async ({ params, body }: Ctx<U, unknown, Any>) => {
  await svc.updateUnit(params.id, params.uid, body)
  return detailOf(params.id)
}
export const deleteUnit = async ({ params }: Ctx<U>) => {
  await svc.deleteUnit(params.id, params.uid)
}
export const reorderUnits = async ({ params, body }: Ctx<M, unknown, Any>) => {
  await svc.reorderUnits(params.id, params.mid, body.ids)
  return detailOf(params.id)
}
export const createBlock = ({ params, body }: Ctx<U, unknown, Any>) =>
  svc.createBlock(params.id, params.uid, body)
export const updateBlock = async ({ params, body }: Ctx<B, unknown, Any>) => {
  await svc.updateBlock(params.id, params.bid, body)
  return detailOf(params.id)
}
export const deleteBlock = async ({ params }: Ctx<B>) => {
  await svc.deleteBlock(params.id, params.bid)
}
export const reorderBlocks = async ({ params, body }: Ctx<U, unknown, Any>) => {
  await svc.reorderBlocks(params.id, params.uid, body.ids)
  return detailOf(params.id)
}
export const createAssessment = ({ params, body }: Ctx<C, unknown, Any>) =>
  svc.createAssessment(params.id, body)
export const updateAssessment = async ({ params, body }: Ctx<A, unknown, Any>) => {
  await svc.updateAssessment(params.id, params.aid, body)
  return detailOf(params.id)
}
export const deleteAssessment = async ({ params }: Ctx<A>) => {
  await svc.deleteAssessment(params.id, params.aid)
}
export const createQuestion = ({ params, body }: Ctx<A, unknown, Any>) =>
  svc.createQuestion(params.id, params.aid, body)
export const updateQuestion = ({ params, body }: Ctx<Q, unknown, Any>) =>
  svc.updateQuestion(params.id, params.aid, params.qid, body)
export const deleteQuestion = async ({ params }: Ctx<Q>) => {
  await svc.deleteQuestion(params.id, params.aid, params.qid)
}
export const card = ({ params, body }: Ctx<C, unknown, Any>) => svc.saveCard(params.id, body)
export const certificate = ({ params, body }: Ctx<C, unknown, Any>) =>
  svc.saveCertificateSettings(params.id, body)
export const points = ({ viewer, params, body }: Ctx<C, unknown, Any>) =>
  svc.savePointsConfig(params.id, body, viewer)
export const upload = async ({ viewer, req }: Ctx) => {
  if (!req.file) throw validationFailed({ file: 'Choose a file' })
  const stored = await svc.adminUpload(req.file, viewer)
  return { fileId: stored.id, url: fileUrl(stored, viewer.id) }
}
