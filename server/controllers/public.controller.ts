import { notFound } from '@server/lib/errors'
import type { RouteContext } from '@server/lib/route'
import { getPublicLanding } from '@server/services/microsites/landing.service'
import { findMicrositeBySlug } from '@server/services/microsites/lookup.service'
import {
  loginConfig,
  requestAccess,
  submitRegisterInterest,
} from '@server/services/microsites/public.service'
import { getFaq, getHome, getPage } from '@server/services/public/content.service'
import type { RegisterInterest } from '@shared/schemas/microsites'
import type { z } from 'zod'

type Ctx<P = unknown, Q = unknown, B = unknown> = RouteContext<P, Q, B>

async function microsite(slug: string) {
  const m = await findMicrositeBySlug(slug)
  if (!m) throw notFound()
  return m
}

export const home = () => getHome()
export const page = ({ params }: Ctx<{ page: 'professionals' | 'students' }>) =>
  getPage(params.page)
export const faq = () => getFaq()
export const landing = async ({ params }: Ctx<{ p: string }>) =>
  getPublicLanding(await microsite(params.p))
export const registerInterest = async ({
  params,
  body,
}: Ctx<{ p: string }, unknown, z.infer<typeof RegisterInterest>>) => {
  await submitRegisterInterest(await microsite(params.p), body)
  return { ok: true as const }
}
export const login = async ({ params }: Ctx<{ p: string }>) =>
  loginConfig(await microsite(params.p))
export const accessRequest = async ({ params, viewer }: Ctx<{ p: string }>) =>
  requestAccess(await microsite(params.p), viewer)
