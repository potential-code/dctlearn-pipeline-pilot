import type { RouteContext } from '@server/lib/route'
import * as svc from '@server/services/i18n/translations.service'
import type { TranslatableEntity } from '@server/services/seams/translatable.registry'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>

export const list = ({
  query,
}: Ctx<unknown, { entity?: TranslatableEntity; missing?: 'ar'; page: number; pageSize: number }>) =>
  svc.listTranslations(query)

export const update = ({
  body,
  viewer,
}: Ctx<unknown, unknown, { entity: TranslatableEntity; id: string; field: string; ar: string }>) =>
  svc.updateTranslation(body, viewer)

export const machine = ({
  body,
}: Ctx<unknown, unknown, { entity: TranslatableEntity; ids: string[] }>) =>
  svc.queueMachineTranslation(body)
