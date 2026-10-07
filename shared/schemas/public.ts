import { z } from 'zod'
import { SIGN_IN_MODES } from '../enums'
import { CourseCard, I18n, MicrositeRef } from './common'

/** P01 */
export const HomeResponse = z.strictObject({
  hero: z.strictObject({ title: I18n, subtitle: I18n, imageUrl: z.string() }),
  microsites: z.array(
    MicrositeRef.extend({ landingUrl: z.string(), signInMode: z.enum(SIGN_IN_MODES) }).strict(),
  ),
  affiliates: z.array(
    z.strictObject({
      name: z.string(),
      url: z.string(),
      imageUrl: z.string(),
      newTab: z.boolean(),
    }),
  ),
  featured: z.array(CourseCard.omit({ state: true })),
})

/** P02 / P03 */
export const PageParams = z.object({ page: z.enum(['professionals', 'students']) })
export const PageResponse = z.strictObject({
  sections: z.array(
    z.strictObject({
      key: z.string(),
      title: I18n,
      body: I18n,
      imageUrl: z.string().optional(),
      cta: z.strictObject({ label: I18n, url: z.string() }).optional(),
    }),
  ),
})

/** P04 */
export const FaqResponse = z.strictObject({
  items: z.array(
    z.strictObject({ id: z.string(), question: I18n, answer: I18n, order: z.number() }),
  ),
})
