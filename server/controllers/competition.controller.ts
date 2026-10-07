import type { RouteContext } from '@server/lib/route'
import { micrositeOf } from '@server/middleware/microsite.middleware'
import * as learner from '@server/services/competition/learner.service'

type Ctx = RouteContext<unknown, unknown, unknown>

/* P28 / P29 learner competition (own submission only) */
export const view = ({ viewer, res }: Ctx) => learner.competitionView(viewer, micrositeOf(res))
export const submit = ({ viewer, res }: Ctx) => learner.submit(viewer, micrositeOf(res))
export const dashboard = ({ viewer, res }: Ctx) =>
  learner.competitionDashboard(viewer, micrositeOf(res))
