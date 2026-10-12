// client: hand-built page (P16 learner course player). One renderer per block type.
// Media playback is simulated (no real files in the mock): the position advances on a timer and is
// saved through the store, which is where `POST .../progress` and the SCORM `PUT` land later.
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePc } from './ctx'
import type { BlockView } from './types'
import { clock, Ic, PATH, useLp } from './ui'

type Of<T extends BlockView['type']> = Extract<BlockView, { type: T }>

/* ------------------------------------------------------------------ simulated playback */

function useSim(blockId: string, speed: number, stepPct: number) {
  const { p, api } = usePc()
  const pct = p.media[blockId] ?? 0
  const at = useRef(pct)
  at.current = pct
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const next = Math.min(100, at.current + stepPct * speed)
      api.setMedia(blockId, next)
      if (next >= 100) setPlaying(false)
    }, 400)
    return () => clearInterval(id)
  }, [playing, speed, stepPct, blockId, api])
  return { pct, playing, toggle: () => setPlaying((v) => !v) }
}

/* ------------------------------------------------------------------ video */

export function VideoBlock({ b }: { b: Of<'youtube'> }) {
  const { s, t } = useLp()
  const sim = useSim(b.id, 1, 12.5)
  const { durationSec } = b.payload
  const shown = Math.round((durationSec * sim.pct) / 100)
  return (
    <div className="lp-vid">
      <img src={b.payload.posterUrl} alt="" />
      <span className="ttl">{t(b.payload.title)}</span>
      <button
        type="button"
        className="play"
        onClick={sim.toggle}
        aria-label={sim.playing ? s.pause : s.play}
      >
        <Ic d={sim.playing ? PATH.pause : PATH.play} size={sim.playing ? 28 : 30} w={0} />
      </button>
      <span className="bar">
        <span className="tm">{clock(shown)}</span>
        <span
          className="pbar"
          role="progressbar"
          aria-valuenow={Math.round(sim.pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t(b.payload.title)}
        >
          <i style={{ width: `${sim.pct}%` }} />
        </span>
        <span className="tm">{clock(durationSec)}</span>
      </span>
      {sim.pct >= 100 ? <span className="tag ok lp-vid-ok">{s.watched}</span> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ text, case study, quotes */

export function TextBlock({ b }: { b: Of<'text'> }) {
  const { s, t } = useLp()
  const [more, setMore] = useState(false)
  const paras = t(b.payload.html)
    .split(/\n\s*\n/)
    .filter(Boolean)
  const rest = paras.slice(1)
  return (
    <>
      <div className="prose">
        <p>{paras[0]}</p>
        {more ? rest.map((x) => <p key={x}>{x}</p>) : null}
      </div>
      {rest.length ? (
        <button
          type="button"
          className="ulink lp-more"
          aria-expanded={more}
          onClick={() => setMore((v) => !v)}
        >
          {more ? s.readLess : s.readMore}
        </button>
      ) : null}
    </>
  )
}

export function CaseBlock({ b }: { b: Of<'case_study'> }) {
  const { s, t } = useLp()
  return (
    <div className="case">
      <p>{t(b.payload.html)}</p>
      {b.payload.reflection ? (
        <p>
          <b>{s.reflection}: </b>
          {t(b.payload.reflection)}
        </p>
      ) : null}
    </div>
  )
}

export function QuotesBlock({ b }: { b: Of<'quotes'> }) {
  const { s, t } = useLp()
  return (
    <div className="quotes">
      {b.payload.items.map((q) => (
        <blockquote key={q.text.en} className="qt">
          <span className="mk" aria-hidden="true">
            “
          </span>
          <p>{t(q.text)}</p>
          {q.author ? (
            <cite>
              {s.quoteBy}
              {t(q.author)}
            </cite>
          ) : null}
        </blockquote>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ audio */

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

export function AudioBlock({ b }: { b: Of<'audio'> }) {
  const { s, t } = useLp()
  const [speed, setSpeed] = useState(1)
  const [tr, setTr] = useState(false)
  const sim = useSim(b.id, speed, 10)
  const { durationSec } = b.payload
  const bars = useMemo(
    () =>
      Array.from(
        { length: 48 },
        (_, n) => 30 + Math.round(Math.abs(Math.sin(n * 1.7) * 60) + (n % 5) * 3),
      ),
    [],
  )
  return (
    <div className="aud">
      <div className="r">
        <button
          type="button"
          className="pp"
          onClick={sim.toggle}
          aria-label={sim.playing ? s.pauseAudio : s.playAudio}
        >
          <Ic d={sim.playing ? PATH.pause : PATH.play} size={sim.playing ? 20 : 22} w={0} />
        </button>
        <span className="lp-aud-t">
          <b>{t(b.payload.title)}</b>
          <span className="tm">
            {clock(Math.round((durationSec * sim.pct) / 100))} / {clock(durationSec)}
          </span>
        </span>
        <span className="wv" aria-hidden="true">
          {bars.map((h, n) => (
            <i
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative waveform
              key={n}
              className={(n / bars.length) * 100 < sim.pct ? 'on' : ''}
              style={{ height: `${h}%` }}
            />
          ))}
        </span>
      </div>
      <div className="r lp-aud-b">
        <div className="seg" role="group" aria-label={s.speed}>
          {SPEEDS.map((x) => (
            <button
              key={x}
              type="button"
              className={speed === x ? 'is-on' : ''}
              aria-pressed={speed === x}
              onClick={() => setSpeed(x)}
            >
              {x}×
            </button>
          ))}
        </div>
        {b.payload.transcript ? (
          <button
            type="button"
            className="ulink"
            aria-expanded={tr}
            onClick={() => setTr((v) => !v)}
          >
            {tr ? s.hideTranscript : s.showTranscript}
          </button>
        ) : null}
      </div>
      {tr && b.payload.transcript ? <p className="prose lp-tr">{t(b.payload.transcript)}</p> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ SCORM */

const SITES: [string, string, string, string][] = [
  [
    'Qasr Al Hosn',
    'قصر الحصن',
    'Abu Dhabi’s oldest stone building, once home to the ruling family and today a national monument.',
    'أقدم مبنى حجري في أبوظبي، كان مقراً للأسرة الحاكمة وهو اليوم معلم وطني.',
  ],
  [
    'Al Ain Oasis',
    'واحة العين',
    'A UNESCO World Heritage site with a working falaj irrigation system that is thousands of years old.',
    'موقع تراث عالمي لليونسكو يضم نظام ري بالأفلاج عمره آلاف السنين.',
  ],
  [
    'Saadiyat Cultural District',
    'المنطقة الثقافية في السعديات',
    'Home to Louvre Abu Dhabi, Zayed National Museum and teamLab Phenomena.',
    'موطن اللوفر أبوظبي ومتحف زايد الوطني وتيم لاب فينومينا.',
  ],
  [
    'Module finished',
    'انتهت الوحدة التفاعلية',
    'Great work. Your progress has been sent to DCT Learn.',
    'عمل رائع، تم إرسال تقدّمك إلى DCT Learn.',
  ],
]

export function ScormBlock({ b }: { b: Of<'scorm'> }) {
  const { s, ar, lang } = useLp()
  const { p, api, fx } = usePc()
  const step = p.scorm[b.id] ?? 0
  const unitId = useUnitId(b.id)
  const cur = Math.max(0, Math.min(step - 1, 3))
  const site = SITES[cur] as [string, string, string, string]
  const status =
    step === 0
      ? s.scormNotStarted
      : step >= 4
        ? 'completion_status: completed'
        : `completion_status: incomplete · ${step}/3`
  return (
    <div className="scorm">
      <div className="chrome">
        <span dir="ltr">
          SCORM {b.payload.version} · {b.payload.launchUrl}
        </span>
        <span dir="ltr">{status}</span>
      </div>
      <div className="stage">
        <img src={b.payload.posterUrl} alt="" />
        {step === 0 ? (
          <div className="in">
            <strong>{s.scormTitle}</strong>
            <span className="cap">{s.scormDesc}</span>
            <button
              type="button"
              className="btn btn-ink"
              onClick={() => unitId && api.putScorm(unitId, b.id, 1)}
            >
              {s.scormLaunch}
            </button>
          </div>
        ) : (
          <div className="slide" lang={lang}>
            <span className="eyebrow">{step >= 4 ? s.scormDone : s.scormSite(cur + 1, 3)}</span>
            <strong>{ar ? site[1] : site[0]}</strong>
            <p>{ar ? site[3] : site[2]}</p>
            <div className="lp-slide-f">
              <span className="dots" aria-hidden="true">
                {[0, 1, 2, 3].map((n) => (
                  <i key={n} className={n <= cur ? 'on' : ''} />
                ))}
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (!unitId) return
                  if (step >= 4) api.putScorm(unitId, b.id, 1)
                  else fx(api.putScorm(unitId, b.id, step + 1))
                }}
              >
                {step >= 4 ? s.scormReplay : step === 3 ? s.scormFinish : s.scormNext}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** The unit a block belongs to (the API calls are keyed by unit and block). */
function useUnitId(blockId: string): string | undefined {
  const { data } = usePc()
  return data.unitOrder.find((id) => data.units[id]?.blocks.some((x) => x.id === blockId))
}

/* ------------------------------------------------------------------ playlist, resources, related */

export function PlaylistBlock({ b }: { b: Of<'youtube_playlist'> }) {
  const { s, t, toast } = useLp()
  const [on, setOn] = useState(0)
  return (
    <div className="pl">
      {b.payload.items.map((v, n) => (
        <button
          key={v.videoId}
          type="button"
          className={`pli ${on === n ? 'on' : ''}`}
          aria-pressed={on === n}
          onClick={() => {
            setOn(n)
            toast(`${s.playlistNow} ${t(v.title)}`)
          }}
        >
          <span className="th">
            <img src={v.posterUrl} alt="" />
            <Ic d={PATH.play} size={22} w={0} />
          </span>
          <span className="lp-pl-t">
            <b>{t(v.title)}</b>
            <span className="cap num">{v.duration}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export function ResourcesBlock({ b }: { b: Of<'resources'> }) {
  const { s, t, toast } = useLp()
  return (
    <div className="rlist">
      {b.payload.items.map((r) => (
        <div key={r.title.en} className="rli">
          <span className="ty" style={{ background: r.color }} aria-hidden="true">
            {r.ext}
          </span>
          <span className="lp-pl-t">
            <b>{t(r.title)}</b>
            <span className="cap">
              {r.ext} · {r.size}
            </span>
          </span>
          <button
            type="button"
            className="btn btn-line btn-sm"
            onClick={() => toast(s.downloading(t(r.title)))}
          >
            <Ic d={PATH.download} size={16} />
            {s.download}
          </button>
        </div>
      ))}
    </div>
  )
}

export function RelatedBlock({ b }: { b: Of<'related_courses'> }) {
  const { s, t, site } = useLp()
  return (
    <ul className="lp-rel">
      {b.payload.items.map((c) => (
        <li key={c.slug}>
          <a className="lp-rel-c" href={`/${site}/learn/${c.slug}`}>
            <span className="im">
              <img src={c.imageUrl} alt="" />
            </span>
            <span className="tx">
              <b>{t(c.title)}</b>
              <span className="cap">
                {s.lvl[c.level]} · {s.minutes(c.durationMin)}
              </span>
              <span className="ulink">
                {s.openCourse}
                <Ic d={PATH.arrow} size={14} className="flip" />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ action plan */

export const PLAN_MIN = 10

export function ActionPlanBlock({ b }: { b: Of<'action_plan'> }) {
  const { s, t, toast } = useLp()
  const { p, api } = usePc()
  const saved = p.plan[b.id] ?? {}
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [seen, setSeen] = useState<Record<number, boolean>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])
  const change = (no: number, limit: number, v: string) => {
    api.saveActionPlan(b.id, no, v.slice(0, limit))
    setState('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('saved'), 600)
  }
  return (
    <>
      {b.payload.intro ? <p className="cap lp-intro">{t(b.payload.intro)}</p> : null}
      {b.payload.questions.map((q) => {
        const v = saved[q.no] ?? ''
        const short = !!seen[q.no] && v.trim().length < PLAN_MIN
        const near = v.length >= q.charLimit * 0.9
        const id = `ap-${b.id}-${q.no}`
        return (
          <div key={q.no} className="apq field">
            <label className="lbl" htmlFor={id}>
              <span className="no num">{q.no}</span>
              <span>{t(q.text)}</span>
            </label>
            <textarea
              id={id}
              className={`inp ${short ? 'is-error' : v.trim().length >= PLAN_MIN ? 'is-valid' : ''}`}
              maxLength={q.charLimit}
              value={v}
              aria-describedby={`${id}-c`}
              aria-invalid={short || undefined}
              onChange={(e) => change(q.no, q.charLimit, e.target.value)}
              onBlur={() => setSeen((x) => ({ ...x, [q.no]: true }))}
            />
            <span className="cc" id={`${id}-c`}>
              <span className={short || near ? 'warn' : ''}>
                {short ? s.planShort : near ? s.planNear : ''}
              </span>
              <span className="num">{s.charCount(v.length, q.charLimit)}</span>
            </span>
          </div>
        )
      })}
      <div className="lp-plan-f">
        {state === 'saved' ? (
          <span className="saved" role="status">
            <Ic d={PATH.check} size={16} w={2.6} />
            {s.planSaved}
          </span>
        ) : (
          <span className="cap" role="status">
            {state === 'saving' ? s.planSaving : s.planHint}
          </span>
        )}
        {b.payload.allowPdf ? (
          <button
            type="button"
            className="btn btn-line btn-sm"
            onClick={() => toast(s.planPdfDone)}
          >
            <Ic d={PATH.download} size={16} />
            {s.planPdf}
          </button>
        ) : null}
      </div>
    </>
  )
}

export const planReady = (b: Of<'action_plan'>, answers: Record<number, string> | undefined) =>
  b.payload.questions.every((q) => (answers?.[q.no] ?? '').trim().length >= PLAN_MIN)

/* ------------------------------------------------------------------ survey */

export function SurveyBlock({ b, done }: { b: Of<'survey'>; done: boolean }) {
  const { s, t, toast } = useLp()
  const { api, fx } = usePc()
  const unitId = useUnitId(b.id)
  const [ans, setAns] = useState<Record<string, string>>({})
  const [err, setErr] = useState(false)
  if (done) {
    return (
      <div className="alert alert-success" role="status">
        <Ic d={PATH.check} size={18} w={2.6} />
        <div>
          <strong>{s.surveyThanks}</strong>
          <p>{s.surveyThanksP}</p>
        </div>
      </div>
    )
  }
  const submit = () => {
    const missing = b.payload.questions.some((q) => q.type !== 'open' && !ans[q.id])
    if (missing) {
      setErr(true)
      return
    }
    if (!unitId) return
    fx(
      api.saveSurvey(
        unitId,
        b.id,
        b.payload.questions.map((q) =>
          q.type === 'open'
            ? { questionId: q.id, text: ans[q.id] ?? '' }
            : { questionId: q.id, optionIds: ans[q.id] ? [ans[q.id] as string] : [] },
        ),
      ),
    )
    toast(s.surveySent)
  }
  return (
    <>
      {b.payload.questions.map((q) => (
        <fieldset key={q.id} className="qq">
          <legend>{t(q.text)}</legend>
          {q.options ? (
            <div className="opts row">
              {q.options.map((o) => (
                <label key={o.id} className={`opt ${ans[q.id] === o.id ? 'sel' : ''}`}>
                  <input
                    type="radio"
                    name={q.id}
                    checked={ans[q.id] === o.id}
                    onChange={() => setAns((x) => ({ ...x, [q.id]: o.id }))}
                  />
                  <span>{t(o.text)}</span>
                </label>
              ))}
            </div>
          ) : (
            <>
              <label className="sr" htmlFor={q.id}>
                {t(q.text)}
              </label>
              <textarea
                id={q.id}
                className="inp"
                maxLength={300}
                value={ans[q.id] ?? ''}
                onChange={(e) => setAns((x) => ({ ...x, [q.id]: e.target.value }))}
              />
            </>
          )}
          {err && q.options && !ans[q.id] ? (
            <span className="err" role="alert">
              {s.pickOne}
            </span>
          ) : null}
        </fieldset>
      ))}
      <button type="button" className="btn btn-ink btn-sm lp-self" onClick={submit}>
        {s.sendSurvey}
      </button>
    </>
  )
}
