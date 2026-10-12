// client: hand-built page (P59 course editor). Module, unit, assessment, question and image dialogs.
import { useId, useState } from 'react'
import { IMAGE_LIBRARY, uid } from './mock'
import type {
  Assessment,
  AssessmentInput,
  AssessmentKind,
  AssessmentType,
  I18n,
  Question,
  QuestionInput,
  QuestionOption,
  QuestionType,
} from './types'
import { Dialog, Field, IconBtn, PATH, Select, Toggle, useCb } from './ui'

const blank: I18n = { en: '', ar: '' }

function Footer({ onClose, label }: { onClose: () => void; label: string }) {
  const { s } = useCb()
  return (
    <>
      <button type="button" className="btn btn-line" onClick={onClose}>
        {s.cancel}
      </button>
      <button type="submit" className="btn btn-primary">
        {label}
      </button>
    </>
  )
}

/** English + Arabic inputs for one bilingual value. */
export function BilingualInput({
  label,
  labelAr,
  value,
  onChange,
  error,
  autoFocus,
  textarea,
}: {
  label: string
  labelAr: string
  value: I18n
  onChange: (v: I18n) => void
  error?: boolean
  autoFocus?: boolean
  textarea?: boolean
}) {
  const { s } = useCb()
  const a = useId()
  const b = useId()
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div className="fg">
      <Field label={label} htmlFor={a} error={error && s.required2}>
        <Tag
          id={a}
          className={`inp ${error ? 'is-error' : ''}`}
          value={value.en}
          dir="ltr"
          lang="en"
          autoFocus={autoFocus}
          aria-invalid={error || undefined}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
        />
      </Field>
      <Field label={labelAr} htmlFor={b}>
        <Tag
          id={b}
          className="inp"
          value={value.ar}
          dir="rtl"
          lang="ar"
          onChange={(e) => onChange({ ...value, ar: e.target.value })}
        />
      </Field>
    </div>
  )
}

export function ModuleDialog({
  initial,
  onSave,
  onClose,
}: {
  initial?: I18n
  onSave: (t: I18n) => void
  onClose: () => void
}) {
  const { s } = useCb()
  const [title, setTitle] = useState<I18n>(initial ?? blank)
  const [tried, setTried] = useState(false)
  const bad = !title.en.trim()
  return (
    <Dialog
      eyebrow={s.curriculum}
      title={initial ? s.editModule : s.addModule}
      onClose={onClose}
      onSubmit={() => (bad ? setTried(true) : onSave({ en: title.en.trim(), ar: title.ar.trim() }))}
      footer={<Footer onClose={onClose} label={initial ? s.save : s.create} />}
    >
      <BilingualInput
        label={`${s.moduleTitle} (English)`}
        labelAr={`${s.moduleTitle} (العربية)`}
        value={title}
        onChange={setTitle}
        error={tried && bad}
        autoFocus
      />
    </Dialog>
  )
}

export function UnitDialog({
  initial,
  onSave,
  onClose,
}: {
  initial?: { title: I18n; durationMin: number | null }
  onSave: (v: { title: I18n; durationMin: number | null }) => void
  onClose: () => void
}) {
  const { s } = useCb()
  const [title, setTitle] = useState<I18n>(initial?.title ?? blank)
  const [min, setMin] = useState(initial?.durationMin ? String(initial.durationMin) : '')
  const [tried, setTried] = useState(false)
  const id = useId()
  const minBad = min.trim() !== '' && !/^\d{1,3}$/.test(min.trim())
  const bad = !title.en.trim() || minBad
  return (
    <Dialog
      eyebrow={s.curriculum}
      title={initial ? s.editUnit : s.addUnit}
      onClose={onClose}
      onSubmit={() =>
        bad
          ? setTried(true)
          : onSave({
              title: { en: title.en.trim(), ar: title.ar.trim() },
              durationMin: min.trim() ? Number(min) : null,
            })
      }
      footer={<Footer onClose={onClose} label={initial ? s.save : s.create} />}
    >
      <BilingualInput
        label={`${s.unitTitle} (English)`}
        labelAr={`${s.unitTitle} (العربية)`}
        value={title}
        onChange={setTitle}
        error={tried && !title.en.trim()}
        autoFocus
      />
      <Field
        label={`${s.unitDuration} ${s.optionalW}`}
        htmlFor={id}
        error={tried && minBad && s.timeErr}
      >
        <input
          id={id}
          className={`inp cb-narrow ${tried && minBad ? 'is-error' : ''}`}
          inputMode="numeric"
          value={min}
          onChange={(e) => setMin(e.target.value)}
        />
      </Field>
    </Dialog>
  )
}

export function ImagePickerDialog({
  current,
  onPick,
  onClose,
}: {
  current: string
  onPick: (url: string) => void
  onClose: () => void
}) {
  const { s, t } = useCb()
  return (
    <Dialog
      wide
      eyebrow={s.coverImage}
      title={s.chooseImage}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-line" onClick={onClose}>
          {s.cancel}
        </button>
      }
    >
      <p className="cap">{s.chooseImageP}</p>
      <div className="cb-gal">
        {IMAGE_LIBRARY.map((img) => (
          <button
            key={img.id}
            type="button"
            className="cb-gal-i"
            aria-pressed={img.url === current}
            onClick={() => onPick(img.url)}
            aria-label={`${s.useImage}: ${t(img.label)}`}
          >
            <img src={img.url} alt="" loading="lazy" />
            <span>{t(img.label)}</span>
          </button>
        ))}
      </div>
    </Dialog>
  )
}

/* ------------------------------------------------------------ assessment */

export function AssessmentDialog({
  kind,
  initial,
  unitId,
  onSave,
  onClose,
}: {
  kind: AssessmentKind
  initial?: Assessment
  unitId?: string | null
  onSave: (input: AssessmentInput) => void
  onClose: () => void
}) {
  const { s } = useCb()
  const ids = [useId(), useId(), useId(), useId()]
  const [title, setTitle] = useState<I18n>(initial?.title ?? blank)
  const [type, setType] = useState<AssessmentType>(
    initial?.type ??
      (kind === 'post' ? 'quiz_blocking' : kind === 'pre' ? 'quiz_non_blocking' : 'quiz_blocking'),
  )
  const [pass, setPass] = useState(String(initial?.passMark ?? (kind === 'pre' ? 50 : 70)))
  const [att, setAtt] = useState(String(initial?.attemptsAllowed ?? 2))
  const [tl, setTl] = useState(initial?.timeLimitMin ? String(initial.timeLimitMin) : '')
  const [shuffle, setShuffle] = useState(initial?.shuffle ?? kind === 'post')
  const [showAnswers, setShowAnswers] = useState(initial?.showAnswers ?? kind !== 'post')
  const [tried, setTried] = useState(false)
  const pmBad = !(Number(pass) >= 1 && Number(pass) <= 100 && Number.isInteger(Number(pass)))
  const atBad = !(Number(att) >= 1 && Number(att) <= 5 && Number.isInteger(Number(att)))
  const tlBad = tl.trim() !== '' && !/^\d{1,3}$/.test(tl.trim())
  const tBad = !title.en.trim()
  const survey = type === 'survey'
  const submit = () => {
    if (tBad || (!survey && pmBad) || atBad || tlBad) {
      setTried(true)
      return
    }
    onSave({
      kind,
      unitId: initial ? initial.unitId : (unitId ?? null),
      title: { en: title.en.trim(), ar: title.ar.trim() },
      type,
      passMark: survey ? (initial?.passMark ?? 0) : Number(pass),
      attemptsAllowed: Number(att),
      timeLimitMin: tl.trim() ? Number(tl) : null,
      shuffle,
      showAnswers,
      isFinal: kind === 'post',
    })
  }
  return (
    <Dialog
      wide
      eyebrow={kind === 'pre' ? s.pre.title : kind === 'post' ? s.post.title : s.quizBlockTitle}
      title={
        initial
          ? s.aEyEdit
          : kind === 'pre'
            ? s.pre.add
            : kind === 'post'
              ? s.post.add
              : s.quizSettingsBtn
      }
      onClose={onClose}
      onSubmit={submit}
      footer={<Footer onClose={onClose} label={initial ? s.save : s.create} />}
    >
      {initial?.hasAttempts ? (
        <div className="alert alert-warn" role="note">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={PATH.warn} />
          </svg>
          <div>
            <strong>{s.verH}</strong>
            <p>{s.verP(initial.version + 1)}</p>
          </div>
        </div>
      ) : null}
      {kind === 'pre' ? <p className="cap">{s.preNote}</p> : null}
      <BilingualInput
        label={s.aTitleEn}
        labelAr={s.aTitleAr}
        value={title}
        onChange={setTitle}
        error={tried && tBad}
        autoFocus
      />
      <div className="fg">
        <Field label={s.qType} htmlFor={ids[0]}>
          <Select
            id={ids[0]}
            value={type}
            onChange={setType}
            options={(Object.keys(s.atLong) as AssessmentType[]).map((v) => ({
              value: v,
              label: s.atLong[v],
            }))}
          />
        </Field>
        {survey ? null : (
          <Field label={s.passMark} htmlFor={ids[1]} error={tried && pmBad && s.pmErr}>
            <input
              id={ids[1]}
              className={`inp ${tried && pmBad ? 'is-error' : ''}`}
              inputMode="numeric"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </Field>
        )}
        <Field label={s.attempts} htmlFor={ids[2]} error={tried && atBad && s.atErr}>
          <input
            id={ids[2]}
            className={`inp ${tried && atBad ? 'is-error' : ''}`}
            inputMode="numeric"
            value={att}
            onChange={(e) => setAtt(e.target.value)}
          />
        </Field>
        <Field
          label={`${s.timeLimit} ${s.optionalW}`}
          htmlFor={ids[3]}
          error={tried && tlBad && s.timeErr}
        >
          <input
            id={ids[3]}
            className={`inp ${tried && tlBad ? 'is-error' : ''}`}
            inputMode="numeric"
            value={tl}
            onChange={(e) => setTl(e.target.value)}
          />
        </Field>
      </div>
      <div>
        <Toggle label={s.shuffle} hint={s.shuffleH} on={shuffle} onChange={setShuffle} />
        <Toggle
          label={s.showAnswers}
          hint={s.showAnswersH}
          on={showAnswers}
          onChange={setShowAnswers}
        />
        {kind === 'post' ? (
          <div className="tgr">
            <div className="tx">
              <b>{s.final}</b>
              <span className="cap">{s.finalH}</span>
            </div>
            <span className="tag ok">{s.blockingTag}</span>
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}

/* -------------------------------------------------------------- question */

const newOpt = (en = '', ar = '', correct = false): QuestionOption => ({
  id: uid('o'),
  text: { en, ar },
  correct,
})

function defaultOptions(type: QuestionType): QuestionOption[] {
  if (type === 'true_false') return [newOpt('True', 'صح', true), newOpt('False', 'خطأ')]
  if (type === 'open_text') return []
  if (type === 'sorting') return [newOpt('', '', true), newOpt('', '', true), newOpt('', '', true)]
  return [newOpt('', '', true), newOpt(), newOpt()]
}

export function QuestionDialog({
  initial,
  onSave,
  onClose,
}: {
  initial?: Question
  onSave: (q: QuestionInput) => void
  onClose: () => void
}) {
  const { s } = useCb()
  const [type, setType] = useState<QuestionType>(initial?.type ?? 'multiple_choice')
  const [text, setText] = useState<I18n>(initial?.text ?? blank)
  const [opts, setOpts] = useState<QuestionOption[]>(
    initial?.options ?? defaultOptions('multiple_choice'),
  )
  const [points, setPoints] = useState(String(initial?.points ?? 1))
  const [tried, setTried] = useState(false)
  const idType = useId()
  const idPts = useId()
  const radio = useId()
  const isOpen = type === 'open_text'
  const isSort = type === 'sorting'
  const isTf = type === 'true_false'
  const filled = opts.filter((o) => o.text.en.trim())
  const errs = {
    text: !text.en.trim(),
    opts: !isOpen && !isTf && filled.length < 2,
    correct: !isOpen && !isSort && !opts.some((o) => o.correct),
    pts: !(Number.isInteger(Number(points)) && Number(points) >= 1 && Number(points) <= 100),
  }
  const bad = errs.text || errs.opts || errs.correct || errs.pts

  const changeType = (next: QuestionType) => {
    setType(next)
    const keep = opts.filter((o) => o.text.en.trim() || o.text.ar.trim())
    if (next === 'true_false' || next === 'open_text') setOpts(defaultOptions(next))
    else if (type === 'true_false' || type === 'open_text' || keep.length < 2)
      setOpts(defaultOptions(next))
    else
      setOpts(
        next === 'sorting'
          ? opts.map((o) => ({ ...o, correct: true }))
          : opts.map((o, n) => ({ ...o, correct: n === opts.findIndex((x) => x.correct) })),
      )
  }
  const setOpt = (id: string, patch: Partial<QuestionOption>) =>
    setOpts((p) => p.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  const move = (n: number, d: number) =>
    setOpts((p) => {
      const j = n + d
      const x = p[n]
      const y = p[j]
      if (!x || !y) return p
      return p.map((o, k) => (k === n ? y : k === j ? x : o))
    })

  const submit = () => {
    if (bad) {
      setTried(true)
      return
    }
    onSave({
      type,
      text: { en: text.en.trim(), ar: text.ar.trim() },
      points: Number(points),
      options: isOpen
        ? []
        : opts
            .filter((o) => o.text.en.trim() || o.text.ar.trim())
            .map((o) => ({ ...o, text: { en: o.text.en.trim(), ar: o.text.ar.trim() } })),
    })
  }

  return (
    <Dialog
      wide
      eyebrow={s.questions}
      title={initial ? s.editQuestion : s.addQuestion}
      onClose={onClose}
      onSubmit={submit}
      footer={<Footer onClose={onClose} label={initial ? s.save : s.create} />}
    >
      <div className="fg">
        <Field label={s.qTypeL} htmlFor={idType}>
          <Select
            id={idType}
            value={type}
            onChange={changeType}
            options={(Object.keys(s.qtLong) as QuestionType[]).map((v) => ({
              value: v,
              label: s.qtLong[v],
            }))}
          />
        </Field>
        <Field label={s.pts} htmlFor={idPts} error={tried && errs.pts && '1–100'}>
          <input
            id={idPts}
            className={`inp ${tried && errs.pts ? 'is-error' : ''}`}
            inputMode="numeric"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </Field>
      </div>
      <BilingualInput
        textarea
        label={s.qTextEn}
        labelAr={s.qTextAr}
        value={text}
        onChange={setText}
        error={tried && errs.text}
        autoFocus
      />

      {isOpen ? (
        <div className="alert alert-info" role="note">
          <div>
            <strong>{s.openH}</strong>
            <p>{s.openP}</p>
          </div>
        </div>
      ) : (
        <fieldset className="cb-opts">
          <legend className="lbl">{isSort ? s.sortLbl : s.optsLbl}</legend>
          {opts.map((o, n) => (
            <div key={o.id} className={`qopt ${o.correct && !isSort ? 'ok' : ''}`}>
              {isSort ? (
                <span className="cb-ord" aria-hidden="true">
                  {n + 1}
                </span>
              ) : (
                <input
                  type="radio"
                  name={radio}
                  checked={o.correct}
                  aria-label={`${s.correct}: ${s.optN} ${n + 1}`}
                  onChange={() => setOpts((p) => p.map((x) => ({ ...x, correct: x.id === o.id })))}
                />
              )}
              <input
                className="inp"
                dir="ltr"
                lang="en"
                value={o.text.en}
                placeholder={`${s.optEn} ${n + 1}`}
                aria-label={`${s.optEn} ${n + 1}`}
                readOnly={isTf}
                onChange={(e) => setOpt(o.id, { text: { ...o.text, en: e.target.value } })}
              />
              <input
                className="inp"
                dir="rtl"
                lang="ar"
                value={o.text.ar}
                placeholder={`${s.optAr} ${n + 1}`}
                aria-label={`${s.optAr} ${n + 1}`}
                readOnly={isTf}
                onChange={(e) => setOpt(o.id, { text: { ...o.text, ar: e.target.value } })}
              />
              {isSort ? (
                <>
                  <IconBtn
                    d={PATH.up}
                    label={s.moveUp}
                    disabled={n === 0}
                    onClick={() => move(n, -1)}
                  />
                  <IconBtn
                    d={PATH.down}
                    label={s.moveDown}
                    disabled={n === opts.length - 1}
                    onClick={() => move(n, 1)}
                  />
                </>
              ) : null}
              {isTf ? null : (
                <IconBtn
                  d={PATH.trash}
                  danger
                  label={`${s.removeOption} ${n + 1}`}
                  disabled={opts.length <= 2}
                  onClick={() => setOpts((p) => p.filter((x) => x.id !== o.id))}
                />
              )}
            </div>
          ))}
          {isTf ? null : (
            <button
              type="button"
              className="cb-add-line"
              onClick={() => setOpts((p) => [...p, newOpt('', '', false)])}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d={PATH.plus} />
              </svg>
              {s.addOption}
            </button>
          )}
          {tried && errs.opts ? <span className="err">{s.needOptions}</span> : null}
          {tried && errs.correct && !errs.opts ? (
            <span className="err">{s.needCorrect}</span>
          ) : null}
        </fieldset>
      )}
    </Dialog>
  )
}
