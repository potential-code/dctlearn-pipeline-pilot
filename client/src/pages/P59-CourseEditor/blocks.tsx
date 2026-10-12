// client: hand-built page (P59 course editor). Block dialog: type picker + one editor per block
// type (all eleven the old editor supported; SPEC §M4).
import { type ReactNode, useId, useRef, useState } from 'react'
import { AssessmentChips } from './assessments'
import { useCourse } from './ctx'
import { AssessmentDialog, BilingualInput } from './dialogs'
import { QuestionList } from './questions'
import type { Block, BlockInput, BlockPayload, BlockType, I18n, SurveyQuestionType } from './types'
import {
  BLOCK_ICON,
  BLOCK_TYPES,
  cvar,
  Dialog,
  Field,
  Ic,
  IconBtn,
  LangTabs,
  PATH,
  Select,
  Toggle,
  useCb,
} from './ui'

type Lang = 'en' | 'ar'
type Patch = (p: Partial<BlockPayload>) => void
interface EditorProps {
  p: BlockPayload
  set: Patch
  lang: Lang
  tried: boolean
}

const blank: I18n = { en: '', ar: '' }
const dirOf = (l: Lang) => (l === 'ar' ? 'rtl' : 'ltr')
const setLang = (v: I18n | undefined, l: Lang, text: string): I18n => ({
  ...(v ?? blank),
  [l]: text,
})

/** YouTube https link or a bare 11-character id (same rule as the old editor). */
export const videoOk = (v: string) =>
  /^[A-Za-z0-9_-]{11}$/.test(v) ||
  /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}/.test(v)

export function defaultPayload(type: BlockType): BlockPayload {
  const title = blank
  switch (type) {
    case 'youtube':
      return { title, videoUrl: '', mustWatch: true }
    case 'text':
      return { title, body: blank }
    case 'case_study':
      return { title, scenario: blank, reflection: blank }
    case 'quotes':
      return { title, quotes: [{ text: blank, author: blank }] }
    case 'audio':
      return { title, audioMeta: '6:04 · 5.6 MB · MP3', transcript: blank }
    case 'resources':
      return { title, files: [] }
    case 'scorm':
      return {
        title,
        scormMeta: '48 MB · SCORM 1.2',
        launchFile: 'index_lms.html',
        completionRule: 'completed',
      }
    case 'youtube_playlist':
      return { title, videos: [] }
    case 'action_plan':
      return {
        title,
        intro: blank,
        allowPdf: true,
        planQuestions: [0, 1, 2].map(() => ({ text: blank, limit: 500 })),
      }
    case 'survey':
      return { title, surveyQuestions: [{ text: blank, type: 'open' }] }
    case 'quiz_blocking':
      return { title }
  }
}

function TextArea({
  id,
  value,
  lang,
  onChange,
  rows = 5,
  max,
}: {
  id: string
  value: string
  lang: Lang
  onChange: (v: string) => void
  rows?: number
  max?: number
}) {
  return (
    <textarea
      id={id}
      className="inp"
      rows={rows}
      dir={dirOf(lang)}
      lang={lang}
      maxLength={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/* ------------------------------------------------------------- editors */

function YoutubeEditor({ p, set, tried }: EditorProps) {
  const { s } = useCb()
  const id = useId()
  const bad = tried && !videoOk((p.videoUrl ?? '').trim())
  return (
    <>
      <Field label={s.vidUrl} hint={s.vidHint} htmlFor={id} error={bad && s.vidErr}>
        <input
          id={id}
          className={`inp ${bad ? 'is-error' : ''}`}
          dir="ltr"
          value={p.videoUrl ?? ''}
          aria-invalid={bad || undefined}
          onChange={(e) => set({ videoUrl: e.target.value })}
        />
      </Field>
      <Toggle label={s.watchEnd} on={p.mustWatch ?? true} onChange={(v) => set({ mustWatch: v })} />
    </>
  )
}

function TextEditor({ p, set, lang }: EditorProps) {
  const { s } = useCb()
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  const value = p.body?.[lang] ?? ''
  const wrap = (before: string, after = '') => {
    const el = ref.current
    const a = el?.selectionStart ?? value.length
    const b = el?.selectionEnd ?? value.length
    const next = value.slice(0, a) + before + value.slice(a, b) + after + value.slice(b)
    set({ body: setLang(p.body, lang, next) })
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(a + before.length, b + before.length)
    })
  }
  const tools: [string, string, () => void][] = [
    ['B', s.fmtL.b, () => wrap('**', '**')],
    ['I', s.fmtL.i, () => wrap('_', '_')],
    ['H', s.fmtL.h, () => wrap('## ')],
    ['•', s.fmtL.l, () => wrap('- ')],
    ['↗', s.fmtL.k, () => wrap('[', '](https://)')],
  ]
  return (
    <Field label={s.body} htmlFor={id}>
      <div className="tbar" role="toolbar" aria-label={s.format}>
        {tools.map(([g, l, fn]) => (
          <button key={l} type="button" aria-label={l} title={l} onClick={fn}>
            {g}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        id={id}
        className="inp"
        rows={8}
        dir={dirOf(lang)}
        lang={lang}
        maxLength={20000}
        value={value}
        onChange={(e) => set({ body: setLang(p.body, lang, e.target.value) })}
      />
      <span className="ctr" aria-live="off">
        {value.length} / 20000
      </span>
    </Field>
  )
}

function CaseEditor({ p, set, lang }: EditorProps) {
  const { s } = useCb()
  const a = useId()
  const b = useId()
  return (
    <>
      <Field label={s.scenario} htmlFor={a}>
        <TextArea
          id={a}
          lang={lang}
          rows={6}
          value={p.scenario?.[lang] ?? ''}
          onChange={(v) => set({ scenario: setLang(p.scenario, lang, v) })}
        />
      </Field>
      <Field label={s.reflect} hint={s.reflectH} htmlFor={b}>
        <TextArea
          id={b}
          lang={lang}
          rows={3}
          value={p.reflection?.[lang] ?? ''}
          onChange={(v) => set({ reflection: setLang(p.reflection, lang, v) })}
        />
      </Field>
    </>
  )
}

function QuotesEditor({ p, set, lang }: EditorProps) {
  const { s } = useCb()
  const list = p.quotes ?? []
  const upd = (n: number, patch: Partial<{ text: I18n; author: I18n }>) =>
    set({ quotes: list.map((q, k) => (k === n ? { ...q, ...patch } : q)) })
  return (
    <div className="cb-stack">
      {list.map((q, n) => (
        <div className="qcard" key={`q${n}`}>
          <div className="cb-row-h">
            <b>
              {s.quoteN} {n + 1}
            </b>
            <button
              type="button"
              className="ibtn del"
              onClick={() => set({ quotes: list.filter((_, k) => k !== n) })}
            >
              {s.removeQuote}
            </button>
          </div>
          <Field label={`${s.quoteText} ${n + 1}`}>
            <textarea
              className="inp"
              rows={2}
              dir={dirOf(lang)}
              lang={lang}
              value={q.text[lang]}
              onChange={(e) => upd(n, { text: setLang(q.text, lang, e.target.value) })}
            />
          </Field>
          <Field label={`${s.author} ${n + 1}`}>
            <input
              className="inp"
              dir={dirOf(lang)}
              lang={lang}
              value={q.author[lang]}
              onChange={(e) => upd(n, { author: setLang(q.author, lang, e.target.value) })}
            />
          </Field>
        </div>
      ))}
      <button
        type="button"
        className="cb-add-line"
        onClick={() => set({ quotes: [...list, { text: blank, author: blank }] })}
      >
        <Ic d={PATH.plus} size={16} />
        {s.addQuote}
      </button>
    </div>
  )
}

function AudioEditor({ p, set, lang }: EditorProps) {
  const { s, toast } = useCb()
  const id = useId()
  const [playing, setPlaying] = useState(false)
  const bars = [
    14, 22, 30, 18, 34, 26, 12, 28, 36, 20, 16, 30, 24, 38, 22, 14, 26, 32, 18, 24, 30, 16, 28, 20,
  ]
  return (
    <>
      <div className="file">
        <button
          type="button"
          className="playb"
          aria-label={playing ? s.pause : s.play}
          aria-pressed={playing}
          onClick={() => setPlaying((v) => !v)}
        >
          <Ic d={playing ? PATH.pause : PATH.play} size={18} w={0} />
        </button>
        <div className="wave" aria-hidden="true">
          {bars.map((h, n) => (
            <i
              key={`w${n}`}
              className={playing ? (n < 9 ? '' : 'dim') : n < 1 ? '' : 'dim'}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <span className="cap" dir="ltr">
          {p.audioMeta}
        </span>
        <button type="button" className="ibtn" onClick={() => toast(s.fileAdded)}>
          {s.replace}
        </button>
      </div>
      <p className="cap">{s.audioHint}</p>
      <Field label={`${s.transcript} ${s.optionalW}`} htmlFor={id}>
        <TextArea
          id={id}
          lang={lang}
          rows={5}
          value={p.transcript?.[lang] ?? ''}
          onChange={(v) => set({ transcript: setLang(p.transcript, lang, v) })}
        />
      </Field>
    </>
  )
}

function ResourcesEditor({ p, set }: EditorProps) {
  const { s, toast } = useCb()
  const files = p.files ?? []
  return (
    <div className="cb-stack">
      {files.map((f, n) => (
        <div className="file" key={`${f.name}${n}`}>
          <span className="fi" style={cvar(f.color)}>
            {f.ext}
          </span>
          <div className="fx">
            <b>{f.name}</b>
            <span className="cap">{f.size}</span>
          </div>
          <IconBtn
            d={PATH.trash}
            danger
            label={`${s.removeFile}: ${f.name}`}
            onClick={() => set({ files: files.filter((_, k) => k !== n) })}
          />
        </div>
      ))}
      <div className="drop">
        <b>{s.fileHint}</b>
      </div>
      <button
        type="button"
        className="cb-add-line"
        onClick={() => {
          set({
            files: [
              ...files,
              {
                name: s.addFile === 'Add a file' ? 'Supporting reading.pdf' : 'قراءة داعمة.pdf',
                ext: 'PDF',
                size: '640 KB',
                color: '#D63539',
              },
            ],
          })
          toast(s.fileAdded)
        }}
      >
        <Ic d={PATH.plus} size={16} />
        {s.addFile}
      </button>
    </div>
  )
}

function ScormEditor({ p, set }: EditorProps) {
  const { s, toast } = useCb()
  const a = useId()
  const b = useId()
  return (
    <>
      <div className="file">
        <span className="fi" style={cvar('#1D1650')}>
          ZIP
        </span>
        <div className="fx">
          <b>{s.scormTitle}</b>
          <span className="cap" dir="ltr">
            {p.scormMeta} · {s.scormMeta}
          </span>
        </div>
        <span className="tag ok">{s.manifestOk}</span>
      </div>
      <div className="fg">
        <Field label={s.launch} htmlFor={a}>
          <input
            id={a}
            className="inp"
            dir="ltr"
            value={p.launchFile ?? ''}
            onChange={(e) => set({ launchFile: e.target.value })}
          />
        </Field>
        <Field label={s.compRule} htmlFor={b}>
          <Select
            id={b}
            value={p.completionRule ?? 'completed'}
            onChange={(v) => set({ completionRule: v })}
            options={[
              { value: 'completed', label: s.ruleC },
              { value: 'passed', label: s.ruleP },
            ]}
          />
        </Field>
      </div>
      <button type="button" className="cb-add-line" onClick={() => toast(s.fileAdded)}>
        <Ic d={PATH.upload} size={16} />
        {s.uploadZip} · {s.zipHint}
      </button>
    </>
  )
}

function PlaylistEditor({ p, set, lang }: EditorProps) {
  const { s, t } = useCb()
  const id = useId()
  const [url, setUrl] = useState('')
  const [tried, setTried] = useState(false)
  const vids = p.videos ?? []
  const bad = tried && !videoOk(url.trim())
  const add = () => {
    if (!videoOk(url.trim())) {
      setTried(true)
      return
    }
    set({
      videos: [
        ...vids,
        {
          title: { en: 'New video', ar: 'فيديو جديد' },
          videoId: url.trim().slice(-11),
          duration: '—',
        },
      ],
    })
    setUrl('')
    setTried(false)
  }
  return (
    <div className="cb-stack">
      {vids.map((v, n) => (
        <div className="plrow" key={`${v.videoId}${n}`}>
          <span className="n">{n + 1}</span>
          <div className="tx">
            <input
              className="inp"
              aria-label={`${s.question} ${n + 1}`}
              dir={dirOf(lang)}
              lang={lang}
              value={v.title[lang]}
              onChange={(e) =>
                set({
                  videos: vids.map((x, k) =>
                    k === n ? { ...x, title: setLang(x.title, lang, e.target.value) } : x,
                  ),
                })
              }
            />
            <span className="cap" dir="ltr">
              {v.videoId} · {v.duration}
            </span>
          </div>
          <IconBtn
            d={PATH.trash}
            danger
            label={`${s.removeVideo}: ${t(v.title)}`}
            onClick={() => set({ videos: vids.filter((_, k) => k !== n) })}
          />
        </div>
      ))}
      <Field label={s.addVideo} hint={s.vidHint} htmlFor={id} error={bad && s.vidErr}>
        <div className="cb-inline">
          <input
            id={id}
            className={`inp ${bad ? 'is-error' : ''}`}
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          />
          <button type="button" className="btn btn-line" onClick={add}>
            {s.add}
          </button>
        </div>
      </Field>
    </div>
  )
}

function PlanEditor({ p, set, lang }: EditorProps) {
  const { s } = useCb()
  const id = useId()
  const qs = p.planQuestions ?? []
  const upd = (n: number, patch: Partial<{ text: I18n; limit: number }>) =>
    set({ planQuestions: qs.map((q, k) => (k === n ? { ...q, ...patch } : q)) })
  return (
    <>
      <Field label={s.intro} htmlFor={id}>
        <TextArea
          id={id}
          lang={lang}
          rows={3}
          value={p.intro?.[lang] ?? ''}
          onChange={(v) => set({ intro: setLang(p.intro, lang, v) })}
        />
      </Field>
      <div className="cb-stack">
        <span className="lbl">{s.planQs}</span>
        {qs.map((q, n) => (
          <div className="aprow" key={`p${n}`}>
            <span className="n">{n + 1}</span>
            <input
              className="inp"
              aria-label={`${s.question} ${n + 1}`}
              dir={dirOf(lang)}
              lang={lang}
              value={q.text[lang]}
              onChange={(e) => upd(n, { text: setLang(q.text, lang, e.target.value) })}
            />
            <input
              className="inp"
              inputMode="numeric"
              aria-label={`${s.charLimit} ${n + 1}`}
              value={String(q.limit)}
              onChange={(e) => upd(n, { limit: Number(e.target.value.replace(/\D/g, '')) || 0 })}
            />
          </div>
        ))}
        <button
          type="button"
          className="cb-add-line"
          onClick={() => set({ planQuestions: [...qs, { text: blank, limit: 500 }] })}
        >
          <Ic d={PATH.plus} size={16} />
          {s.add}
        </button>
      </div>
      <Toggle label={s.pdf} on={p.allowPdf ?? true} onChange={(v) => set({ allowPdf: v })} />
    </>
  )
}

function SurveyEditor({ p, set, lang }: EditorProps) {
  const { s } = useCb()
  const qs = p.surveyQuestions ?? []
  const upd = (n: number, patch: Partial<{ text: I18n; type: SurveyQuestionType }>) =>
    set({ surveyQuestions: qs.map((q, k) => (k === n ? { ...q, ...patch } : q)) })
  return (
    <div className="cb-stack">
      <p className="cap">{s.surveyHint}</p>
      {qs.map((q, n) => (
        <div className="cb-survey-row" key={`s${n}`}>
          <span className="n">{n + 1}</span>
          <input
            className="inp"
            aria-label={`${s.question} ${n + 1}`}
            dir={dirOf(lang)}
            lang={lang}
            value={q.text[lang]}
            onChange={(e) => upd(n, { text: setLang(q.text, lang, e.target.value) })}
          />
          <Select
            value={q.type}
            onChange={(v) => upd(n, { type: v })}
            options={(Object.keys(s.surveyQTypes) as SurveyQuestionType[]).map((v) => ({
              value: v,
              label: s.surveyQTypes[v],
            }))}
          />
          <IconBtn
            d={PATH.trash}
            danger
            label={`${s.deleteQuestion} ${n + 1}`}
            disabled={qs.length <= 1}
            onClick={() => set({ surveyQuestions: qs.filter((_, k) => k !== n) })}
          />
        </div>
      ))}
      <button
        type="button"
        className="cb-add-line"
        onClick={() => set({ surveyQuestions: [...qs, { text: blank, type: 'open' }] })}
      >
        <Ic d={PATH.plus} size={16} />
        {s.addQuestion}
      </button>
    </div>
  )
}

/** Per-unit quiz: the block points at a unit-level assessment, edited right here. */
function QuizEditor({ p }: EditorProps) {
  const { s, t, toast } = useCb()
  const { tree, api } = useCourse()
  const [settings, setSettings] = useState(false)
  const a = tree.assessments.find((x) => x.id === p.assessmentId)
  if (!a)
    return (
      <div className="alert alert-info" role="note">
        <div>
          <strong>{s.quizBlockTitle}</strong>
          <p>{s.quizNone}</p>
        </div>
      </div>
    )
  return (
    <div className="cb-stack">
      <p className="cap">{s.quizBlockHint}</p>
      <div className="cb-as-row">
        <h4 className="cb-as-title">{t(a.title)}</h4>
        <AssessmentChips a={a} />
        <div className="cb-as-acts">
          <button type="button" className="ibtn" onClick={() => setSettings(true)}>
            <Ic d={PATH.sliders} size={16} />
            {s.quizSettingsBtn}
          </button>
        </div>
      </div>
      <QuestionList assessment={a} />
      {settings ? (
        <AssessmentDialog
          kind="unit"
          initial={a}
          onClose={() => setSettings(false)}
          onSave={(input) => {
            api.updateAssessment(a.id, input)
            setSettings(false)
            toast(a.hasAttempts ? s.tAssessV(a.version + 1) : s.tAssess)
          }}
        />
      ) : null}
    </div>
  )
}

const EDITORS: Record<BlockType, (props: EditorProps) => ReactNode> = {
  youtube: YoutubeEditor,
  text: TextEditor,
  case_study: CaseEditor,
  quotes: QuotesEditor,
  audio: AudioEditor,
  resources: ResourcesEditor,
  scorm: ScormEditor,
  youtube_playlist: PlaylistEditor,
  action_plan: PlanEditor,
  survey: SurveyEditor,
  quiz_blocking: QuizEditor,
}

/** Whether a type has long-form content that follows the language switch. */
const LANGUAL: BlockType[] = [
  'text',
  'case_study',
  'quotes',
  'audio',
  'youtube_playlist',
  'action_plan',
  'survey',
]

/* -------------------------------------------------------------- dialog */

export function BlockDialog({
  unitId,
  initial,
  onSave,
  onClose,
}: {
  unitId: string
  initial?: Block
  onSave: (input: BlockInput) => void
  onClose: () => void
}) {
  const { s, lang: uiLang, t } = useCb()
  const { api } = useCourse()
  const [type, setType] = useState<BlockType | null>(initial?.type ?? null)
  const [payload, setPayload] = useState<BlockPayload>(initial?.payload ?? { title: blank })
  const [required, setRequired] = useState(initial?.required ?? true)
  const [lang, setContentLang] = useState<Lang>(uiLang)
  const [tried, setTried] = useState(false)
  const set: Patch = (patch) => setPayload((p) => ({ ...p, ...patch }))

  if (!type) {
    return (
      <Dialog
        wide
        eyebrow={s.blockEyNew}
        title={s.blockTypes}
        onClose={onClose}
        footer={
          <button type="button" className="btn btn-line" onClick={onClose}>
            {s.cancel}
          </button>
        }
      >
        <p className="cap">{s.pickType}</p>
        <div className="cb-types" role="list">
          {BLOCK_TYPES.map((k) => (
            <button
              key={k}
              type="button"
              role="listitem"
              className="cb-type"
              onClick={() => {
                setType(k)
                setPayload(defaultPayload(k))
                setRequired(k !== 'resources')
              }}
            >
              <span className="cb-type-i" style={cvar(BLOCK_ICON[k].c)}>
                <Ic d={BLOCK_ICON[k].d} size={20} />
              </span>
              <span className="cb-type-t">
                <b>{s.blockTypesInfo[k][0]}</b>
                <span>{s.blockTypesInfo[k][1]}</span>
              </span>
            </button>
          ))}
        </div>
      </Dialog>
    )
  }

  const Editor = EDITORS[type]
  const titleBad = !payload.title.en.trim()
  const vidBad = type === 'youtube' && !videoOk((payload.videoUrl ?? '').trim())
  const submit = () => {
    if (titleBad || vidBad) {
      setTried(true)
      return
    }
    let next = payload
    if (type === 'quiz_blocking' && !payload.assessmentId) {
      const id = api.createAssessment({
        kind: 'unit',
        unitId,
        title: payload.title,
        type: 'quiz_blocking',
        passMark: 70,
        attemptsAllowed: 2,
        timeLimitMin: null,
        shuffle: false,
        showAnswers: true,
        isFinal: false,
      })
      next = { ...payload, assessmentId: id }
    }
    onSave({ type, required, payload: next })
  }

  return (
    <Dialog
      wide
      eyebrow={`${initial ? s.blockEyEdit : s.blockEyNew} · ${s.blockTypesInfo[type][0]}`}
      title={initial ? t(initial.payload.title) || s.editBlock : s.blockTypesInfo[type][0]}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          {initial ? null : (
            <button
              type="button"
              className="btn btn-ghost cb-mr-auto"
              onClick={() => setType(null)}
            >
              {s.back2}
            </button>
          )}
          <button type="button" className="btn btn-line" onClick={onClose}>
            {s.cancel}
          </button>
          <button type="submit" className="btn btn-primary">
            {initial ? s.save : s.create}
          </button>
        </>
      }
    >
      <BilingualInput
        label={s.blockTitleEn}
        labelAr={s.blockTitleAr}
        value={payload.title}
        onChange={(title) => set({ title })}
        error={tried && titleBad}
        autoFocus
      />
      <Toggle label={s.reqToggle} hint={s.reqToggleH} on={required} onChange={setRequired} />
      {LANGUAL.includes(type) ? (
        <LangTabs label={s.contentLang} value={lang} onChange={setContentLang} />
      ) : null}
      <Editor p={payload} set={set} lang={lang} tried={tried} />
    </Dialog>
  )
}
