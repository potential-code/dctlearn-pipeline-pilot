// client: hand-built page (P16 learner course player). The content side: footer navigation and notices.
import type { ReactNode } from 'react'
import { usePc } from './ctx'
import { type LockReason, neighbours, type Target } from './nav'
import { Ic, PATH, useLp } from './ui'

/** Label of the Next button for the place it leads to. */
function nextLabel(from: Target, next: Target, s: ReturnType<typeof useLp>['s']): string {
  if (from.kind === 'pre' && next.kind === 'block') return s.startCourse
  if (next.kind === 'block' && from.kind === 'block' && next.unit !== from.unit) return s.nextUnit
  if (next.kind === 'post') return s.postTest
  if (next.kind === 'complete') return s.toCertificate
  return s.next
}

/**
 * Previous / Next under the content. Next is open once `canNext` (the current block is complete);
 * `middle` carries the "Completed" tag or the "Mark as complete" button.
 */
export function StepNav({
  at,
  canNext,
  hint,
  middle,
}: {
  at: Target
  canNext: boolean
  hint?: string | null
  middle?: ReactNode
}) {
  const { s } = useLp()
  const { data, p, hrefOf } = usePc()
  const { prev, next } = neighbours(data, p, at)
  return (
    <div className="lp-foot">
      <div className="lp-foot-row">
        {prev ? (
          <a className="btn btn-line btn-sm" href={hrefOf(prev)} rel="prev">
            <Ic d={PATH.arrowBack} size={16} className="flip" />
            {s.prev}
          </a>
        ) : (
          <span />
        )}
        <div className="lp-foot-mid">{middle}</div>
        {next ? (
          canNext ? (
            <a className="btn btn-ink btn-sm" href={hrefOf(next)} rel="next">
              {nextLabel(at, next, s)}
              <Ic d={PATH.arrow} size={16} className="flip" />
            </a>
          ) : (
            <button
              type="button"
              className="btn btn-ink btn-sm"
              disabled
              aria-describedby={hint ? 'lp-hint' : undefined}
            >
              {nextLabel(at, next, s)}
              <Ic d={PATH.arrow} size={16} className="flip" />
            </button>
          )
        ) : (
          <span />
        )}
      </div>
      {hint ? (
        <p className="lp-hint" id="lp-hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** A place the learner cannot open yet, or that is not in this course. */
export function Notice({
  title,
  body,
  reason,
}: {
  title: string
  body?: string
  reason?: LockReason | null
}) {
  const { s } = useLp()
  const { hrefOf, resume } = usePc()
  return (
    <section className="pcard lp-stage lp-notice" aria-labelledby="lp-stage-h">
      <div className="lp-notice-b">
        <span className="lp-notice-i" aria-hidden="true">
          <Ic d={PATH.lock} size={26} />
        </span>
        <h2 id="lp-stage-h" tabIndex={-1}>
          {title}
        </h2>
        <p>{body ?? (reason ? s.lockWhy[reason] : '')}</p>
        <a className="btn btn-primary" href={hrefOf(resume)}>
          {s.lockGo}
          <Ic d={PATH.arrow} size={16} className="flip" />
        </a>
      </div>
    </section>
  )
}
