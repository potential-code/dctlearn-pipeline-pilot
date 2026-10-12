// client: hand-built page (P16 learner course player). The course card above the player.
import { usePc } from './ctx'
import { courseProgress } from './nav'
import { pc } from './strings'
import { Ic, PATH, useLp } from './ui'

export function CourseCard() {
  const { s, t, site } = useLp()
  const { data, p } = usePc()
  const c = data.course
  const pct = courseProgress(data, p)
  const mandatory = data.mandatoryOn.includes(site)
  return (
    <header className="pcard lp-card">
      <div className="lp-card-top">
        <div className="lp-card-t">
          <a className="lp-back" href={`/${site}/hub/courses`}>
            <Ic d={PATH.arrowBack} size={16} className="flip" />
            {s.back}
          </a>
          <span className="eyebrow">{c.categories.map((x) => t(x)).join(' · ')}</span>
          <h1>{t(c.title)}</h1>
          <p>{t(c.description)}</p>
          <ul className="lp-chips" aria-label={t(c.title)}>
            <li className="chip chip-success">{s.lvl[c.level]}</li>
            <li className="chip chip-indigo">
              <Ic d={PATH.layers} size={14} />
              {s.modulesN(data.modules.length)}
            </li>
            <li className="chip chip-muted">
              <Ic d={PATH.book} size={14} />
              {s.unitsN(data.unitOrder.length)}
            </li>
            <li className="chip chip-muted">
              <Ic d={PATH.clock} size={14} />
              {s.minutes(c.durationMin)}
            </li>
            {c.certificateEnabled ? (
              <li className="chip chip-sand">
                <Ic d={PATH.award} size={14} />
                {s.certificate}
              </li>
            ) : null}
            {mandatory ? <li className="chip chip-primary">{s.mandatory}</li> : null}
          </ul>
        </div>
        <div className="lp-cover" aria-hidden="true">
          <img src={c.imageUrl} alt="" />
        </div>
      </div>
      <div className="lp-prog">
        <div className="lp-prog-h">
          <span id="lp-prog-l">{s.yourProgress}</span>
          <b className="num">{pc(pct)}</b>
        </div>
        <div
          className="pbar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="lp-prog-l"
        >
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>
    </header>
  )
}
