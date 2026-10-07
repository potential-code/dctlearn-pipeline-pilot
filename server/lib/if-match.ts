import { conflict } from './errors'

/**
 * Optimistic concurrency (contract §9.4): the client sends back the `updatedAt` it loaded as
 * `ifMatch`; a different current value means someone else saved first. Omitted = no check.
 */
export function assertIfMatch(current: Date, ifMatch: string | undefined | null) {
  if (!ifMatch) return
  if (new Date(ifMatch).getTime() !== current.getTime())
    throw conflict('Changed by someone else — reload and try again')
}
