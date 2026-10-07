import type { RouteContext } from '@server/lib/route'
import * as svc from '@server/services/forms/forms.service'
import type { PaginationInput } from '@shared/schemas/common'
import type { AdminFormsQuery, FormInput } from '@shared/schemas/forms'
import type { z } from 'zod'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>
type Id = { id: string }

/* P56 admin */
export const list = ({ query }: Ctx<unknown, z.infer<typeof AdminFormsQuery>>) =>
  svc.listForms(query)
export const create = ({ viewer, body }: Ctx<unknown, unknown, FormInput>) =>
  svc.createForm(body, viewer)
export const update = ({ viewer, params, body }: Ctx<Id, unknown, FormInput>) =>
  svc.updateForm(params.id, body, viewer)
export const remove = async ({ viewer, params }: Ctx<Id>) => {
  await svc.deleteForm(params.id, viewer)
}
export const entries = ({ viewer, params, query }: Ctx<Id, PaginationInput>) =>
  svc.listEntries(params.id, query, viewer)
export const entriesCsv = async ({ viewer, params, res }: Ctx<Id>) => {
  const { csv, filename } = await svc.entriesCsv(params.id, viewer)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(`﻿${csv}`)
  return undefined
}

/* learner */
export const learnerForm = ({ viewer, params }: Ctx<{ formId: string }>) =>
  svc.getLearnerForm(params.formId, viewer)
export const submit = ({
  viewer,
  params,
  body,
}: Ctx<{ formId: string }, unknown, { answers: Record<string, unknown> }>) =>
  svc.submitLearnerEntry(params.formId, viewer, body.answers)
