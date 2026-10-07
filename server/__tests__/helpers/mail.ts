import { drainJobs } from '@server/jobs/runtime'
import { outbox } from '@server/services/email.service'

/** Delivers queued e-mails (jobs) and returns the outbox. */
export async function deliveredMail() {
  await new Promise((r) => setTimeout(r, 20))
  await drainJobs()
  return outbox
}

/** Last e-mail to an address, optionally of one template. */
export async function lastMailTo(to: string, template?: string) {
  const mail = await deliveredMail()
  return [...mail].reverse().find((m) => m.to === to && (!template || m.template === template))
}

export function tokenFromUrl(url: string) {
  return url.split('/').pop()!.split('?')[0]!
}
