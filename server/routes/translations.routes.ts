import * as ctl from '@server/controllers/translations.controller'
import { route } from '@server/lib/route'
import { requireRole } from '@server/middleware/auth.middleware'
import {
  MachineTranslationQueued,
  MachineTranslationRequest,
  TranslationRow,
  TranslationsPage,
  TranslationsQuery,
  TranslationUpdate,
} from '@shared/schemas/translations'
import { Router } from 'express'

export const translationsRouter = Router()
const tags = ['Admin · Translations']
const admin = requireRole('admin')

route(translationsRouter, {
  method: 'get',
  path: '/admin/translations',
  summary: 'P60 Translatable fields (filter by entity, `missing=ar`)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  query: TranslationsQuery,
  response: TranslationsPage,
  handler: ctl.list,
})
route(translationsRouter, {
  method: 'put',
  path: '/admin/translations',
  summary: 'P60 Save a reviewed Arabic translation',
  tags,
  auth: 'role(admin) · Sanitise: translated rich text',
  middleware: admin,
  body: TranslationUpdate,
  response: TranslationRow,
  handler: ctl.update,
})
route(translationsRouter, {
  method: 'post',
  path: '/admin/translations/machine',
  summary: 'P60 Queue machine translation (503 feature_off without a provider)',
  tags,
  auth: 'role(admin)',
  middleware: admin,
  body: MachineTranslationRequest,
  response: MachineTranslationQueued,
  status: 202,
  handler: ctl.machine,
})
