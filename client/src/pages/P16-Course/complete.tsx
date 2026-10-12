// client: hand-built page (P16 learner course player). The completion view: certificate, points, what next.
import { usePc } from './ctx'
import { courseHref } from './nav'
import { Ic, PATH, useLp } from './ui'

const CERT_BG = '/_blob/a08dcc0e73027985e0c330d26c246a01'

const dateLong = (iso: string, ar: boolean) =>
  new Date(iso).toLocaleDateString(ar ? 'ar-AE-u-nu-latn-ca-gregory' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
const dateShort = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function CompleteView({ name }: { name: string }) {
  const { s, t, ar, site, toast } = useLp()
  const { data, p } = usePc()
  const nU = data.unitOrder.length
  const issued = p.completedAt ?? new Date().toISOString()
  const c = data.course
  const check = data.postId ? data.points.assessmentPass : 0
  const total = nU * data.points.unit + check + data.points.course
  return (
    <div className="lp-done">
      <section className="done-band" aria-labelledby="lp-stage-h">
        <div className="patD" aria-hidden="true" />
        <div className="lp-done-t">
          <span className="eyebrow">{s.doneEy}</span>
          <h2 id="lp-stage-h" tabIndex={-1}>
            {s.doneH(name)}
          </h2>
          <p>{s.doneP(t(c.title))}</p>
          <div className="ptsbig">
            <b className="num">+{total}</b>
            <span>{s.ptsEarned}</span>
          </div>
          <div className="lp-done-a">
            <button type="button" className="btn btn-primary" onClick={() => toast(s.dlDone)}>
              <Ic d={PATH.download} size={16} />
              {s.dlCert}
            </button>
            <a href={`/${site}/achievements`} className="btn btn-glass">
              {s.viewAch}
            </a>
          </div>
          <div className="lp-done-s">
            <span>{s.share}</span>
            <div className="share">
              <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer">
                X
              </a>
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
              <button type="button" onClick={() => toast(s.copied)}>
                {s.copyLink}
              </button>
            </div>
          </div>
        </div>
        <span className="certp">
          <img src={CERT_BG} alt={s.certAlt} />
          <span className="c1">{t(c.title)}</span>
          <span className="c2">{name}</span>
          <span className="c3 num">{dateShort(issued)}</span>
          <span className="c4 num">{data.serial}</span>
        </span>
      </section>
      <div className="g3">
        <section className="pcard">
          <div className="hd">
            <h2>{s.certDetails}</h2>
          </div>
          <dl className="lp-dl">
            <div>
              <dt>{s.serialL}</dt>
              <dd className="num">{data.serial}</dd>
            </div>
            <div>
              <dt>{s.issuedL}</dt>
              <dd>{dateLong(issued, ar)}</dd>
            </div>
            <div>
              <dt>{s.verifyL}</dt>
              <dd className="num lp-wrap">dctlearn.ae/verify/{data.serial}</dd>
            </div>
          </dl>
        </section>
        <section className="pcard">
          <div className="hd">
            <h2>{s.ptsH}</h2>
            <span className="tag yel num">{total}</span>
          </div>
          <div className="ptsl">
            <div>
              <span>{s.ptsUnits(nU, data.points.unit)}</span>
              <b className="num">+{nU * data.points.unit}</b>
            </div>
            {check ? (
              <div>
                <span>{s.ptsCheck}</span>
                <b className="num">+{check}</b>
              </div>
            ) : null}
            <div>
              <span>{s.ptsCourse}</span>
              <b className="num">+{data.points.course}</b>
            </div>
          </div>
        </section>
        <section className="pcard qe">
          <div className="hd">
            <h2>{s.nextH}</h2>
          </div>
          <a className="lrow lp-lnk" href={courseHref(site, data.next.slug)}>
            <span className="lp-rt">
              <b>{t(data.next.title)}</b>
              <span className="cap">{t(data.next.meta)}</span>
            </span>
            <Ic d={PATH.arrow} size={16} className="flip" />
          </a>
          <a className="lrow lp-lnk" href={`/${site}/hub/courses`}>
            <b className="lp-rt">{s.back}</b>
          </a>
        </section>
      </div>
    </div>
  )
}
