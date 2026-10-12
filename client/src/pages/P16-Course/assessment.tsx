// client: hand-built page (P16 learner course player). Assessment: intro (stats, passing score, status,
// Start / Retake), one-question-at-a-time runner, and the pass / fail result with the answer review.
// Modes: survey (not graded), quiz_blocking (must pass), quiz_non_blocking (graded, pass not required).
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePc } from './ctx'
import {
  assessmentStatus,
  attemptsLeft,
  attemptsOf,
  bestScore,
  courseComplete,
  neighbours,
  preDone,
  type Target,
  unitTarget,
} from './nav'
import { StepNav } from './stage'
import { pc } from './strings'
import type { AnswerInput, AssessmentView, AttemptResult, QuestionView } from './types'
import { clock, Ic, PATH, useLp } from './ui'

const OPEN_MIN = 10
const OPEN_MAX = 500

type Answers = Record<string, AnswerInput>

const isAnswered = (q: QuestionView, a: AnswerInput | undefined): boolean => {
  if (q.type === 'open_text') return (a?.text ?? '').trim().length >= OPEN_MIN
  if (q.type === 'sorting') return !!a?.order?.length
  return !!a?.optionIds?.length
}

function initialAnswers(a: AssessmentView): Answers {
  const out: Answers = {}
  for (const q of a.questions) {
    // sorting starts in the order shown, so it always has an answer
    if (q.type === 'sorting')
      out[q.id] = { questionId: q.id, order: (q.options ?? []).map((o) => o.id) }
  }
  return out
}

/* ------------------------------------------------------------------ question input */

function QuestionInput({
  q,
  a,
  onChange,
  invalid,
}: {
  q: QuestionView
  a: AnswerInput | undefined
  onChange: (next: AnswerInput) => void
  invalid: boolean
}) {
  const { s, t } = useLp()
  if (q.type === 'open_text') {
    const v = a?.text ?? ''
    const id = `q-${q.id}`
    return (
      <div className="field">
        <label className="sr" htmlFor={id}>
          {t(q.text)}
        </label>
        <textarea
          id={id}
          className={`inp ${invalid ? 'is-error' : ''}`}
          maxLength={OPEN_MAX}
          value={v}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange({ questionId: q.id, text: e.target.value.slice(0, OPEN_MAX) })}
        />
        <span className="cap num">{s.charCount(v.length, OPEN_MAX)}</span>
      </div>
    )
  }
  if (q.type === 'sorting') {
    const order = a?.order ?? []
    const byId = new Map((q.options ?? []).map((o) => [o.id, o]))
    const move = (from: number, to: number) => {
      const next = order.slice()
      const [x] = next.splice(from, 1)
      if (x) next.splice(to, 0, x)
      onChange({ questionId: q.id, order: next })
    }
    return (
      <>
        <p className="cap">{s.sortHint}</p>
        <ol className="lp-sort">
          {order.map((oid, n) => {
            const label = t(byId.get(oid)?.text)
            return (
              <li key={oid}>
                <span className="num lp-sort-n" aria-hidden="true">
                  {n + 1}
                </span>
                <span className="lp-sort-t">{label}</span>
                <button
                  type="button"
                  className="lp-ib"
                  disabled={n === 0}
                  aria-label={s.moveUp(label)}
                  onClick={() => move(n, n - 1)}
                >
                  <Ic d={PATH.up} size={16} />
                </button>
                <button
                  type="button"
                  className="lp-ib"
                  disabled={n === order.length - 1}
                  aria-label={s.moveDown(label)}
                  onClick={() => move(n, n + 1)}
                >
                  <Ic d={PATH.down} size={16} />
                </button>
              </li>
            )
          })}
        </ol>
      </>
    )
  }
  const sel = a?.optionIds?.[0]
  return (
    <div className={`opts ${q.type === 'true_false' ? 'row' : ''}`}>
      {(q.options ?? []).map((o) => (
        <label key={o.id} className={`opt ${sel === o.id ? 'sel' : ''}`}>
          <input
            type="radio"
            name={`q-${q.id}`}
            checked={sel === o.id}
            onChange={() => onChange({ questionId: q.id, optionIds: [o.id] })}
          />
          <span>{t(o.text)}</span>
        </label>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ runner */

function Runner({
  a,
  onDone,
}: {
  a: AssessmentView
  onDone: (result: AttemptResult, answers: AnswerInput[], timedOut: boolean) => void
}) {
  const { s, t, toast } = useLp()
  const { api, fx, setGuard } = usePc()
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(a))
  const [idx, setIdx] = useState(0)
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const total = a.questions.length
  const q = a.questions[idx] as QuestionView
  const limit = a.timeLimitMin ? a.timeLimitMin * 60 : null
  const [left, setLeft] = useState(limit)
  const latest = useRef(answers)
  latest.current = answers
  const sent = useRef(false)
  const head = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    setGuard(true)
    return () => setGuard(false)
  }, [setGuard])

  const send = useCallback(
    (timedOut: boolean) => {
      if (sent.current) return
      sent.current = true
      setBusy(true)
      const list = a.questions.map((x) => latest.current[x.id] ?? { questionId: x.id })
      try {
        const { result, effects } = api.submitAttempt(a.id, list)
        fx(effects)
        onDone(result, list, timedOut)
      } catch {
        sent.current = false
        setBusy(false)
        toast(s.noAttempts)
      }
    },
    [a, api, fx, onDone, toast, s.noAttempts],
  )

  useEffect(() => {
    if (limit === null) return
    const id = setInterval(() => setLeft((x) => (x === null ? x : Math.max(0, x - 1))), 1000)
    return () => clearInterval(id)
  }, [limit])
  useEffect(() => {
    if (left === 0) send(true)
  }, [left, send])

  const missing = a.questions.findIndex((x) => !isAnswered(x, answers[x.id]))
  const graded = a.type !== 'survey'
  const submit = () => {
    if (graded && missing >= 0) {
      setErr(true)
      setIdx(missing)
      setTimeout(() => document.getElementById('lp-run-err')?.focus(), 0)
      return
    }
    send(false)
  }
  const answeredN = a.questions.filter((x) => isAnswered(x, answers[x.id])).length
  const last = idx === total - 1
  const unanswered = err && graded && !isAnswered(q, answers[q.id])
  const qHead = `lp-q-${idx}`

  // Move focus to the question text when the question changes, so keyboard and screen-reader users follow.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the question changes
  useEffect(() => {
    if (idx > 0 || err) head.current?.focus({ preventScroll: true })
  }, [idx])

  return (
    <section className="pcard lp-stage lp-run" aria-labelledby="lp-stage-h">
      <div className="lp-run-h">
        <h2 id="lp-stage-h" tabIndex={-1}>
          {t(a.title)}
        </h2>
        {left !== null ? (
          <span className={`lp-time ${left <= 60 ? 'warn' : ''}`} role="timer">
            <Ic d={PATH.clock} size={16} />
            {s.timeLeft(clock(left))}
          </span>
        ) : null}
      </div>
      <div className="lp-run-p">
        <div
          className="pbar"
          role="progressbar"
          aria-valuenow={idx + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={s.qOf(idx + 1, total)}
        >
          <i style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
        <span className="cap num">{s.qOf(idx + 1, total)}</span>
      </div>
      {err && graded && missing >= 0 ? (
        <div className="alert alert-error lp-run-e" role="alert" id="lp-run-err" tabIndex={-1}>
          <Ic d={PATH.alert} size={18} />
          <div>
            <strong>{s.answerAllH}</strong>
            <p>{s.answerAllP}</p>
          </div>
        </div>
      ) : null}
      <fieldset className="lp-q" aria-describedby={unanswered ? `${qHead}-e` : undefined}>
        <legend>
          <span className="qn">
            {s.qOf(idx + 1, total)} · {s.qType[q.type]}
          </span>
          <span className="qt2" ref={head} tabIndex={-1}>
            {t(q.text)}
          </span>
        </legend>
        <QuestionInput
          q={q}
          a={answers[q.id]}
          invalid={unanswered}
          onChange={(next) => setAnswers((x) => ({ ...x, [q.id]: next }))}
        />
        {unanswered ? (
          <span className="err" id={`${qHead}-e`}>
            {s.requiredQ}
          </span>
        ) : null}
      </fieldset>
      <div className="lp-foot">
        <div className="lp-foot-row">
          <button
            type="button"
            className="btn btn-line btn-sm"
            disabled={idx === 0}
            onClick={() => setIdx((n) => n - 1)}
          >
            <Ic d={PATH.arrowBack} size={16} className="flip" />
            {s.prev}
          </button>
          <span className="cap lp-foot-mid num">{s.answered(answeredN, total)}</span>
          {last ? (
            <button
              type="button"
              className={`btn btn-primary btn-sm ${busy ? 'is-loading' : ''}`}
              onClick={submit}
              aria-busy={busy}
              disabled={busy}
            >
              {busy ? s.submitting : s.submit}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ink btn-sm"
              onClick={() => setIdx((n) => n + 1)}
            >
              {s.next}
              <Ic d={PATH.arrow} size={16} className="flip" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ result */

function Result({
  a,
  at,
  result,
  answers,
  timedOut,
  onRetake,
  onIntro,
}: {
  a: AssessmentView
  at: Target
  result: AttemptResult
  answers: AnswerInput[]
  timedOut: boolean
  onRetake: () => void
  onIntro: () => void
}) {
  const { s, t } = useLp()
  const { data, p, hrefOf } = usePc()
  const survey = a.type === 'survey'
  const left = attemptsLeft(data, p, a.id)
  const blocking = a.type === 'quiz_blocking'
  const next = neighbours(data, p, at).next
  const R = 64
  const C = 2 * Math.PI * R
  const h = result.passed
    ? survey
      ? s.resPassedSurvey
      : s.resPassed
    : left === 0
      ? s.resFailedOut
      : left === null
        ? s.resFailedUnlimited
        : s.resFailedLeft(left)
  const body = result.passed
    ? a.kind === 'post'
      ? s.resPostPassedBody
      : survey
        ? s.surveyThanksP
        : s.resPassedBody
    : left === 0
      ? s.noAttemptsP
      : blocking
        ? s.resFailedBody
        : s.resNoGate
  const reviewUnits: Target =
    at.kind === 'block' ? unitTarget(data, p, at.unit) : unitTarget(data, p, 0)
  const optText = (qid: string, oid: string) =>
    t(a.questions.find((x) => x.id === qid)?.options?.find((o) => o.id === oid)?.text)
  const answerText = (q: QuestionView, x: AnswerInput | undefined): string => {
    if (!x) return s.noAnswer
    if (q.type === 'open_text') return x.text?.trim() || s.noAnswer
    if (q.type === 'sorting') return (x.order ?? []).map((o) => optText(q.id, o)).join(' → ')
    return x.optionIds?.[0] ? optText(q.id, x.optionIds[0]) : s.noAnswer
  }
  const goOn = next && (result.passed || !blocking)
  return (
    <>
      <section className="pcard lp-stage lp-result" aria-labelledby="lp-stage-h" aria-live="polite">
        <div className="lp-res">
          {survey ? (
            <span className="lp-res-ok" aria-hidden="true">
              <Ic d={PATH.check} size={44} w={2.4} />
            </span>
          ) : (
            <span className="ring">
              <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
                <circle cx="75" cy="75" r={R} fill="none" stroke="#EEEAE4" strokeWidth="12" />
                <circle
                  cx="75"
                  cy="75"
                  r={R}
                  fill="none"
                  stroke={result.passed ? '#15801A' : '#D63539'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(C * result.scorePct) / 100} ${C}`}
                />
              </svg>
              <span>
                <b className="num">{pc(result.scorePct)}</b>
                <small>{s.passAt(a.passMark)}</small>
              </span>
            </span>
          )}
          <div className="lp-res-t">
            <span className={`tag ${result.passed ? 'ok' : 'bad'}`}>
              {survey ? s.statusSurvey : result.passed ? s.statusPassed : s.statusFailed}
            </span>
            <h2 id="lp-stage-h" tabIndex={-1}>
              {h}
            </h2>
            {timedOut ? (
              <p className="lp-res-time">
                <strong>{s.timeUpH}. </strong>
                {s.timeUpP}
              </p>
            ) : null}
            <p>{body}</p>
            <div className="lp-res-a">
              {goOn ? (
                <a className="btn btn-primary" href={hrefOf(next)}>
                  {at.kind === 'pre'
                    ? s.startCourse
                    : next.kind === 'complete'
                      ? s.toCertificate
                      : s.continueCourse}
                  <Ic d={PATH.arrow} size={16} className="flip" />
                </a>
              ) : null}
              {!result.passed && blocking && left !== 0 ? (
                <>
                  <button type="button" className="btn btn-primary" onClick={onRetake}>
                    <Ic d={PATH.refresh} size={16} />
                    {s.retake}
                  </button>
                  <a className="btn btn-line" href={hrefOf(reviewUnits)}>
                    {s.reviewUnits}
                  </a>
                </>
              ) : null}
              {!result.passed && !blocking && left !== 0 ? (
                <button type="button" className="btn btn-line" onClick={onRetake}>
                  <Ic d={PATH.refresh} size={16} />
                  {s.retake}
                </button>
              ) : null}
              {left === 0 && !result.passed ? (
                <a className="btn btn-line" href="/notifications">
                  {s.contactAdmin}
                </a>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={onIntro}>
                {s.backToIntro}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="pcard lp-review" aria-label={s.yourAnswers}>
        <div className="hd">
          <h2>{s.yourAnswers}</h2>
          {result.right ? null : <span className="cap">{s.keysHidden}</span>}
        </div>
        {a.questions.map((q, n) => {
          const right = result.right?.[q.id]
          return (
            <div key={q.id} className="lrow">
              <span
                className={`lp-rn ${right === undefined ? '' : right ? 'ok' : 'bad'}`}
                aria-hidden="true"
              >
                {n + 1}
              </span>
              <span className="lp-rt">
                <b>{t(q.text)}</b>
                <span className="cap">
                  {answerText(
                    q,
                    answers.find((x) => x.questionId === q.id),
                  )}
                </span>
              </span>
              <span className={`tag ${right === undefined ? 'mut' : right ? 'ok' : 'bad'}`}>
                {right === undefined ? s.answeredTag : right ? s.correct : s.incorrect}
              </span>
            </div>
          )
        })}
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ intro */

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="lp-stat">
      <Ic d={icon} size={20} />
      <b className="num">{value}</b>
      <span>{label}</span>
    </div>
  )
}

function Intro({ a, at, onStart }: { a: AssessmentView; at: Target; onStart: () => void }) {
  const { s, t } = useLp()
  const { data, p } = usePc()
  const list = attemptsOf(p, a.id)
  const last = list[list.length - 1]
  const left = attemptsLeft(data, p, a.id)
  const best = bestScore(p, a.id)
  const status = assessmentStatus(data, p, a.id)
  const survey = a.type === 'survey'
  const locked = status === 'locked'
  const passed = status === 'passed'
  const noneLeft = left === 0
  const blockDone = at.kind === 'block' && passed
  const canNext =
    at.kind === 'pre' ? preDone(data, p) : at.kind === 'post' ? courseComplete(p) : blockDone
  const hint = canNext
    ? null
    : at.kind === 'pre'
      ? s.hintPre
      : at.kind === 'post'
        ? locked
          ? null
          : s.hintPost
        : s.hintQuiz
  // A passed blocking check needs no retake; a non-blocking one (pre-test) can be repeated.
  const canStart = !locked && !noneLeft && !(passed && a.type !== 'quiz_non_blocking')
  return (
    <section className="pcard lp-stage" aria-labelledby="lp-stage-h">
      <div className="lp-stage-h">
        <div className="lp-stage-t">
          <span className="tag red">{s.kind[a.kind]}</span>
          <span className="tag mut">{s.type[a.type]}</span>
        </div>
        <h2 id="lp-stage-h" tabIndex={-1}>
          <Ic d={PATH.clipboard} size={22} />
          {t(a.title)}
        </h2>
        <p className="cap lp-stage-d">{t(a.description)}</p>
      </div>
      <div className="lp-stage-b">
        <div className="lp-stats">
          <Stat icon={PATH.target} value={String(list.length)} label={s.statAttempts} />
          <Stat
            icon={PATH.clock}
            value={left === null ? s.unlimited : String(left)}
            label={s.statLeft}
          />
          <Stat
            icon={PATH.trophy}
            value={best === null || survey ? s.noScore : pc(best)}
            label={s.statBest}
          />
          <Stat icon={PATH.help} value={String(a.questions.length)} label={s.statQuestions} />
        </div>
        <p className="lp-pass">
          <Ic d={PATH.alert} size={16} />
          {survey ? s.ungraded : s.passingScore(a.passMark)}
        </p>
        {a.kind === 'pre' ? <p className="cap">{s.preNote}</p> : null}
        {locked ? (
          <div className="alert alert-warn" role="status">
            <Ic d={PATH.lock} size={18} />
            <div>
              <strong>{s.postLockedH}</strong>
              <p>{s.postLockedP}</p>
            </div>
          </div>
        ) : (
          <div className={`lp-status ${!last ? 'none' : last.passed ? 'ok' : 'bad'}`} role="status">
            <p>
              <b>{s.statusLabel}: </b>
              {!last ? (
                s.statusNone
              ) : survey ? (
                <span className="st">
                  <Ic d={PATH.checkCircle} size={16} />
                  {s.statusSurvey}
                </span>
              ) : last.passed ? (
                <span className="st">
                  <Ic d={PATH.checkCircle} size={16} />
                  {s.statusPassed}
                </span>
              ) : (
                <span className="st">
                  <Ic d={PATH.xCircle} size={16} />
                  {s.attemptFailed(last.n, last.scorePct)}
                </span>
              )}
            </p>
            {last ? (
              <p>{survey ? s.lastAttemptSurvey(last.n) : s.lastAttempt(last.scorePct, last.n)}</p>
            ) : null}
          </div>
        )}
        {noneLeft && !passed ? (
          <div className="alert alert-error" role="status">
            <Ic d={PATH.alert} size={18} />
            <div>
              <strong>{s.noAttempts}</strong>
              <p>{s.noAttemptsP}</p>
              <a className="ulink" href="/notifications">
                {s.contactAdmin}
              </a>
            </div>
          </div>
        ) : null}
        {canStart ? (
          <button type="button" className="btn btn-primary lp-self" onClick={onStart}>
            <Ic d={list.length ? PATH.refresh : PATH.play} size={16} w={list.length ? 2 : 0} />
            {list.length ? s.retake : s.start}
          </button>
        ) : null}
      </div>
      <StepNav at={at} canNext={canNext} hint={hint} />
    </section>
  )
}

/* ------------------------------------------------------------------ screen */

export function AssessmentScreen({ id, at }: { id: string; at: Target }) {
  const { data } = usePc()
  const a = data.assessments[id]
  const [phase, setPhase] = useState<'intro' | 'run' | 'result'>('intro')
  const [res, setRes] = useState<{
    result: AttemptResult
    answers: AnswerInput[]
    timedOut: boolean
  } | null>(null)
  const done = useCallback((result: AttemptResult, answers: AnswerInput[], timedOut: boolean) => {
    setRes({ result, answers, timedOut })
    setPhase('result')
  }, [])
  if (!a) return null
  if (phase === 'run') return <Runner a={a} onDone={done} />
  if (phase === 'result' && res) {
    return (
      <Result
        a={a}
        at={at}
        result={res.result}
        answers={res.answers}
        timedOut={res.timedOut}
        onRetake={() => setPhase('run')}
        onIntro={() => setPhase('intro')}
      />
    )
  }
  return <Intro a={a} at={at} onStart={() => setPhase('run')} />
}
