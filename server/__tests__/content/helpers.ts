import { buildApp } from '@server/app'
import { db } from '@server/db/connection'
import { seedContent } from '@server/db/seed/slices/content.seed'
import { aiRouter } from '@server/routes/ai.routes'
import { eventsRouter } from '@server/routes/events.routes'
import { formsRouter } from '@server/routes/forms.routes'
import { resourcesRouter } from '@server/routes/resources.routes'
import { getHubTab } from '@server/services/microsites/dashboard.service'
import { findMicrositeBySlug } from '@server/services/microsites/lookup.service'
import type { HubTab } from '@shared/enums'
import { PDFDocument } from 'pdf-lib'
import { freshBase, userByEmail } from '../helpers/fixtures'
import { as } from '../helpers/http'
import '@server/registrations/content'

/** The app with the content routers mounted (the shared P14/P52 routes come with buildApp). */
export const app = buildApp([eventsRouter, resourcesRouter, formsRouter, aiRouter])

/** SEED base + content slice (§5 form, §7 events, §8 resources, §9 AI embeds, 1 survey). */
export async function freshContent() {
  const base = await freshBase()
  const content = await db.transaction((tx) => seedContent(tx, base.users, base.microsites))
  return { ...base, content }
}

export async function pdfBytes() {
  const doc = await PDFDocument.create()
  doc.addPage([200, 200])
  return Buffer.from(await doc.save())
}

// biome-ignore lint/suspicious/noExplicitAny: test bodies are checked with the tab's schema
type Body = Record<string, any>

/**
 * P52 hub tab through HTTP (auth, tab enabled, query validation) plus its body. The shared hub
 * route currently answers 204 without a body (no response schema and no `status: 200` —
 * requested shared change), so until that lands the body is read through the same service call
 * the route makes. Once the route answers 200 the HTTP body is used as is.
 */
export async function hub(
  email: string,
  p: string,
  tab: HubTab,
  query = '',
): Promise<{ status: number; body: Body }> {
  const client = await as(email, app)
  const res = await client.get(`/api/microsites/${p}/hub/${tab}${query ? `?${query}` : ''}`)
  if (res.status !== 204) return { status: res.status, body: res.body }
  const u = await userByEmail(email)
  const viewer: Viewer = {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Viewer['role'],
    status: u.status as Viewer['status'],
    emailVerified: u.emailVerified,
    locale: u.locale === 'ar' ? 'ar' : 'en',
    image: u.image,
    sessionId: 'test',
    ip: '127.0.0.1',
  }
  const m = await findMicrositeBySlug(p)
  const { result, response } = await getHubTab(
    viewer,
    m!,
    tab,
    Object.fromEntries(new URLSearchParams(query)),
  )
  return { status: 200, body: response.parse(result) as Body }
}
