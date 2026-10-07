import type { DbOrTx } from '@server/db/connection'
import { deliverEmail } from '@server/services/email.service'
import { z } from 'zod'
import { defineJob } from './runtime'

/** Every e-mail goes through the queue: 5 attempts, exponential backoff, then dead-letter. */
const sendEmailJob = defineJob(
  'email.send',
  async (p) => {
    await deliverEmail(p.to, p.template, p.data, p.locale)
  },
  {
    maxAttempts: 5,
    schema: z.object({
      to: z.string(),
      template: z.string(),
      data: z.record(z.string(), z.unknown()),
      locale: z.enum(['en', 'ar']),
    }),
  },
)

export function queueEmail(
  to: string,
  template: string,
  data: Record<string, unknown>,
  opts: { locale?: 'en' | 'ar'; tx?: DbOrTx } = {},
) {
  return sendEmailJob.enqueue({ to, template, data, locale: opts.locale ?? 'en' }, { tx: opts.tx })
}
