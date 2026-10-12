// client: hand-built page (P59 course editor). Right-hand "Course settings" and "Statistics" cards.
// The old tabs (Course card, Certificate, Points & settings, Archive) are collapsible sections here.
import { type ReactNode, useId, useState } from 'react'
import { useCourse } from './ctx'
import { ImagePickerDialog } from './dialogs'
import { CATEGORIES, MICROSITES, SEED_LAST_SAVED } from './mock'
import type { Course, Level } from './types'
import { ConfirmDialog, Field, Ic, PATH, Select, Toggle, useCb } from './ui'

const CERT_BG = '/_blob/a08dcc0e73027985e0c330d26c246a01'

function Section({
  title,
  children,
  defaultOpen,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const id = useId()
  return (
    <div className="cb-sect">
      <button
        type="button"
        className="cb-sect-h"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{title}</span>
        <Ic d={PATH.chevron} size={16} className={`cb-chev ${open ? 'open' : ''}`} />
      </button>
      <div id={id} className="cb-sect-b" hidden={!open}>
        {children}
      </div>
    </div>
  )
}

const validPts = (v: string) => /^\d+$/.test(v) && Number(v) <= 500

function CardSection({ c }: { c: Course }) {
  const { s, t, lang } = useCb()
  const { api } = useCourse()
  const ids = [useId(), useId(), useId()]
  const certL = c.externalCertificate
    ? s.certExternal
    : c.certificateEnabled
      ? s.certLabel
      : s.certNone
  const catName = c.categories[0]
    ? t(CATEGORIES[c.categories[0]] ?? { en: c.categories[0], ar: c.categories[0] })
    : '—'
  return (
    <>
      <fieldset className="cb-cats">
        <legend className="lbl">{s.cats}</legend>
        <div className="mchips">
          {Object.entries(CATEGORIES).map(([k, name]) => {
            const on = c.categories.includes(k)
            return (
              <button
                key={k}
                type="button"
                className="chipf"
                aria-pressed={on}
                onClick={() =>
                  api.updateCourse({
                    categories: on ? c.categories.filter((x) => x !== k) : [...c.categories, k],
                  })
                }
              >
                {t(name)}
              </button>
            )
          })}
        </div>
      </fieldset>
      <Field label={s.duration} htmlFor={ids[0]}>
        <input
          id={ids[0]}
          className="inp"
          inputMode="numeric"
          value={String(c.durationMin)}
          onChange={(e) =>
            api.updateCourse({ durationMin: Number(e.target.value.replace(/\D/g, '')) || 0 })
          }
        />
      </Field>
      <Field label={s.overviewEn} htmlFor={ids[1]}>
        <textarea
          id={ids[1]}
          className="inp"
          rows={3}
          dir="ltr"
          lang="en"
          value={c.overview.en}
          onChange={(e) => api.updateCourse({ overview: { ...c.overview, en: e.target.value } })}
        />
      </Field>
      <Field label={s.overviewAr} htmlFor={ids[2]}>
        <textarea
          id={ids[2]}
          className="inp"
          rows={3}
          dir="rtl"
          lang="ar"
          value={c.overview.ar}
          onChange={(e) => api.updateCourse({ overview: { ...c.overview, ar: e.target.value } })}
        />
      </Field>
      <div>
        <Toggle
          label={s.soon}
          hint={s.soonH}
          on={c.comingSoon}
          onChange={(v) => api.updateCourse({ comingSoon: v })}
        />
        <Toggle
          label={s.certProg}
          hint={s.certProgH}
          on={c.isCertProgramme}
          onChange={(v) => api.updateCourse({ isCertProgramme: v })}
        />
      </div>
      <div className="cb-prev">
        <span className="lbl">{s.livePrev}</span>
        <article className="cb-card-prev" lang={lang}>
          <img src={c.imageUrl} alt="" />
          <div className="cb-card-tags">
            {c.comingSoon ? <span className="tag warn">{s.soonTag}</span> : null}
            {c.isCertProgramme ? <span className="tag info">{s.certProg}</span> : null}
          </div>
          <div className="cb-card-b">
            <span className="eyebrow">{catName}</span>
            <b>{t(c.title)}</b>
            <p>{t(c.overview)}</p>
            <span className="cap">
              {s.lvl[c.level]} · {c.durationMin} {s.min} · {certL}
            </span>
          </div>
        </article>
      </div>
    </>
  )
}

const t2 = (c: Course, ar: boolean) => (ar ? c.title.ar || c.title.en : c.title.en || c.title.ar)

function CertSection({ c }: { c: Course }) {
  const { s, ar } = useCb()
  const { tree, api } = useCourse()
  const cert = tree.certificate
  const ids = [useId(), useId()]
  return (
    <>
      <div className="cb-cert-v" aria-label={s.certPrev}>
        <div className="certv">
          <img src={CERT_BG} alt={s.certAlt} />
          <div className="nm">{s.sampleName}</div>
          <div className="cs">{t2(c, ar)}</div>
          <div className="dt">{s.issued}</div>
          <div className="sg">
            <b>{cert.signatureName}</b>
            <span>{cert.signatureTitle}</span>
          </div>
          {cert.showSerial ? <div className="sr">DCT-2026-000123</div> : null}
          {c.certificateEnabled ? null : <div className="off">{s.certOff}</div>}
        </div>
        <span className="cap">{s.sampleFor}</span>
      </div>
      <Field label={s.sigName} htmlFor={ids[0]}>
        <input
          id={ids[0]}
          className="inp"
          value={cert.signatureName}
          onChange={(e) => api.updateCertificate({ signatureName: e.target.value })}
        />
      </Field>
      <Field label={s.sigTitle} htmlFor={ids[1]}>
        <input
          id={ids[1]}
          className="inp"
          value={cert.signatureTitle}
          onChange={(e) => api.updateCertificate({ signatureTitle: e.target.value })}
        />
      </Field>
      <Toggle
        label={s.serial}
        on={cert.showSerial}
        onChange={(v) => api.updateCertificate({ showSerial: v })}
      />
      <p className="cap">{c.certificateEnabled ? s.certOn : s.certOff}</p>
      <p className="cap">{s.certNote}</p>
    </>
  )
}

function PointsSection({ c }: { c: Course }) {
  const { s } = useCb()
  const { tree, api } = useCourse()
  const keys = ['module', 'course', 'assessmentPass'] as const
  const [draft, setDraft] = useState<Record<string, string>>({
    module: String(c.pointsConfig.module),
    course: String(c.pointsConfig.course),
    assessmentPass: String(c.pointsConfig.assessmentPass),
  })
  const ids = [useId(), useId(), useId()]
  const units = tree.modules.reduce((n, m) => n + m.units.length, 0)
  const hasFinal = tree.assessments.some((a) => a.isFinal)
  const p = c.pointsConfig
  const max =
    units * p.unit + tree.modules.length * p.module + p.course + (hasFinal ? p.assessmentPass : 0)
  return (
    <>
      <p className="cap">{s.pointsH}</p>
      <div className="cb-pts">
        {keys.map((k, n) => {
          const bad = !validPts(draft[k] ?? '')
          return (
            <Field
              key={k}
              label={s.ptsL[n + 1]}
              hint={s.ptsH[n + 1]}
              htmlFor={ids[n]}
              error={bad && s.ptsErr}
            >
              <input
                id={ids[n]}
                className={`inp ${bad ? 'is-error' : ''}`}
                inputMode="numeric"
                value={draft[k] ?? ''}
                aria-invalid={bad || undefined}
                onChange={(e) => {
                  const v = e.target.value
                  setDraft((d) => ({ ...d, [k]: v }))
                  if (validPts(v))
                    api.updateCourse({ pointsConfig: { ...c.pointsConfig, [k]: Number(v) } })
                }}
              />
            </Field>
          )
        })}
      </div>
      <div className="sumb" role="status">
        <b>{max}</b>
        <span>{s.maxTxt}</span>
      </div>
    </>
  )
}

function BehaviourSection({ c }: { c: Course }) {
  const { s, t } = useCb()
  const { api } = useCourse()
  return (
    <>
      <Toggle
        label={s.seq}
        hint={s.seqH}
        on={c.sequential}
        onChange={(v) => api.updateCourse({ sequential: v })}
      />
      <div>
        <span className="lbl">{s.usedBy}</span>
        <ul className="cb-ms">
          {c.microsites.map((m) => {
            const ms = MICROSITES[m.id]
            return (
              <li key={m.id}>
                <span className="msd" style={{ ['--c' as string]: ms?.color }}>
                  <i />
                  {ms ? t(ms.name) : m.id}
                </span>
                <span className={`tag ${m.mandatory ? 'bad' : 'mut'}`}>
                  {m.mandatory ? s.mand : s.opt}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}

export function SettingsPanel({ version }: { version: number }) {
  const { s, t, ar, toast } = useCb()
  const { tree, api } = useCourse()
  const c = tree.course
  const ids = [useId(), useId(), useId(), useId(), useId(), useId()]
  const [pick, setPick] = useState(false)
  const [archive, setArchive] = useState(false)
  const [unitPts, setUnitPts] = useState(String(c.pointsConfig.unit))
  const ptsBad = !validPts(unitPts)
  const titleBad = !c.title.en.trim()
  return (
    <aside className="pcard cb-settings" aria-labelledby="cb-set-h">
      <div className="cb-as-h">
        <span className="cb-tile" aria-hidden="true">
          <Ic d={PATH.sliders} size={20} />
        </span>
        <div className="cb-as-ht">
          <h3 id="cb-set-h">{s.settings}</h3>
          <p>{s.autoSave}</p>
          <p className="cb-savestate" role="status">
            {version > 0 ? (
              <>
                <Ic d={PATH.check} size={12} w={3} /> {s.saved}
              </>
            ) : (
              SEED_LAST_SAVED[ar ? 'ar' : 'en']
            )}
          </p>
        </div>
      </div>
      <div className="cb-set-b">
        <div className="fg cb-one">
          <Field label={s.titleEn} htmlFor={ids[0]} error={titleBad && s.required2}>
            <input
              id={ids[0]}
              className={`inp ${titleBad ? 'is-error' : ''}`}
              dir="ltr"
              lang="en"
              value={c.title.en}
              onChange={(e) => api.updateCourse({ title: { ...c.title, en: e.target.value } })}
            />
          </Field>
          <Field label={s.titleAr} htmlFor={ids[1]}>
            <input
              id={ids[1]}
              className="inp"
              dir="rtl"
              lang="ar"
              value={c.title.ar}
              onChange={(e) => api.updateCourse({ title: { ...c.title, ar: e.target.value } })}
            />
          </Field>
          <Field label={s.descEn} htmlFor={ids[2]}>
            <textarea
              id={ids[2]}
              className="inp"
              rows={3}
              dir="ltr"
              lang="en"
              value={c.description.en}
              onChange={(e) =>
                api.updateCourse({ description: { ...c.description, en: e.target.value } })
              }
            />
          </Field>
          <Field label={s.descAr} htmlFor={ids[3]}>
            <textarea
              id={ids[3]}
              className="inp"
              rows={3}
              dir="rtl"
              lang="ar"
              value={c.description.ar}
              onChange={(e) =>
                api.updateCourse({ description: { ...c.description, ar: e.target.value } })
              }
            />
          </Field>
          <Field label={s.coverImage} htmlFor={ids[4]}>
            <div className="cb-inline">
              <input
                id={ids[4]}
                className="inp"
                dir="ltr"
                value={c.imageUrl}
                onChange={(e) => api.updateCourse({ imageUrl: e.target.value })}
              />
              <button type="button" className="btn btn-line btn-sm" onClick={() => setPick(true)}>
                {s.browse}
              </button>
            </div>
          </Field>
          <Field label={s.difficulty} htmlFor={ids[5]}>
            <Select
              id={ids[5]}
              value={c.level}
              onChange={(v: Level) => api.updateCourse({ level: v })}
              options={(['beginner', 'intermediate', 'advanced'] as Level[]).map((v) => ({
                value: v,
                label: s.lvl[v],
              }))}
            />
          </Field>
          <Field
            label={s.pointsUnit}
            hint={s.pointsUnitH}
            htmlFor={`${ids[0]}-pu`}
            error={ptsBad && s.ptsErr}
          >
            <input
              id={`${ids[0]}-pu`}
              className={`inp ${ptsBad ? 'is-error' : ''}`}
              inputMode="numeric"
              value={unitPts}
              aria-invalid={ptsBad || undefined}
              onChange={(e) => {
                setUnitPts(e.target.value)
                if (validPts(e.target.value))
                  api.updateCourse({
                    pointsConfig: { ...c.pointsConfig, unit: Number(e.target.value) },
                  })
              }}
            />
          </Field>
        </div>
        <label className="chk cb-cert-chk">
          <input
            type="checkbox"
            checked={c.certificateEnabled}
            onChange={(e) => api.updateCourse({ certificateEnabled: e.target.checked })}
          />
          <span>{s.enableCert}</span>
        </label>
      </div>

      <div className="cb-sects">
        <Section title={s.secCard}>
          <CardSection c={c} />
        </Section>
        <Section title={s.secCert}>
          <CertSection c={c} />
        </Section>
        <Section title={s.secPoints}>
          <PointsSection c={c} />
        </Section>
        <Section title={s.secBehaviour}>
          <BehaviourSection c={c} />
        </Section>
        {c.status === 'archived' ? null : (
          <Section title={s.secArchive}>
            <p className="cap">{s.archiveP}</p>
            <button
              type="button"
              className="btn btn-line cb-danger-line"
              onClick={() => setArchive(true)}
            >
              {s.archive}
            </button>
          </Section>
        )}
      </div>

      {pick ? (
        <ImagePickerDialog
          current={c.imageUrl}
          onClose={() => setPick(false)}
          onPick={(url) => {
            api.updateCourse({ imageUrl: url })
            setPick(false)
          }}
        />
      ) : null}
      {archive ? (
        <ConfirmDialog
          danger
          eyebrow={s.arcEy}
          title={s.arcH(t(c.title))}
          body={s.archiveP}
          confirmLabel={s.arcBtn}
          onClose={() => setArchive(false)}
          onConfirm={() => {
            api.archive()
            setArchive(false)
            toast(s.tArchived)
          }}
        />
      ) : null}
    </aside>
  )
}

export function StatsCard() {
  const { s } = useCb()
  const { tree } = useCourse()
  const units = tree.modules.reduce((n, m) => n + m.units.length, 0)
  const blocks = tree.modules.reduce(
    (n, m) => n + m.units.reduce((k, u) => k + u.blocks.length, 0),
    0,
  )
  const items: [string, number, string][] = [
    [s.modules, tree.modules.length, PATH.layers],
    [s.units, units, PATH.book],
    [s.blocks, blocks, PATH.list],
  ]
  return (
    <section className="pcard cb-stats" aria-labelledby="cb-stats-h">
      <h3 id="cb-stats-h" className="cb-kicker">
        {s.stats}
      </h3>
      <dl className="cb-stat-g">
        {items.map(([label, n, d]) => (
          <div key={label} className="cb-stat">
            <Ic d={d} size={18} />
            <dt>{label}</dt>
            <dd>{n}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
