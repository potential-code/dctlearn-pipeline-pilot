// client: hand-built page (P59 course editor). Pre-test and Post-test cards.
// Post-test = the course's final assessment (is_final). Pre-test has no backend equivalent yet
// (docs/CLIENT-NOTES.md, "Backend gaps").
import { useState } from 'react'
import { useCourse } from './ctx'
import { AssessmentDialog } from './dialogs'
import { QuestionList } from './questions'
import type { Assessment } from './types'
import { ConfirmDialog, Ic, IconBtn, PATH, useCb } from './ui'

export function AssessmentChips({ a }: { a: Assessment }) {
  const { s } = useCb()
  return (
    <div className="cb-chips">
      <span className={`tag ${a.type === 'survey' ? 'mut' : 'ok'}`}>
        {a.type === 'survey' ? s.ungraded : s.graded(a.passMark)}
      </span>
      <span className="tag mut">{s.attemptsN(a.attemptsAllowed)}</span>
      {a.timeLimitMin ? <span className="tag mut">{s.timeN(a.timeLimitMin)}</span> : null}
      {a.isFinal ? <span className="tag info">{s.blockingTag}</span> : null}
    </div>
  )
}

export function AssessmentCard({ kind }: { kind: 'pre' | 'post' }) {
  const { s, t, toast } = useCb()
  const { tree, api } = useCourse()
  const a = tree.assessments.find((x) => x.kind === kind)
  const copy = kind === 'pre' ? s.pre : s.post
  const [dlg, setDlg] = useState<'edit' | 'new' | 'delete' | null>(null)
  const headId = `cb-as-${kind}`

  return (
    <section className={`pcard cb-as ${kind}`} aria-labelledby={headId}>
      <div className="cb-as-h">
        <span className="cb-tile" aria-hidden="true">
          <Ic d={kind === 'pre' ? PATH.clipboard : PATH.checkCircle} size={20} />
        </span>
        <div className="cb-as-ht">
          <h3 id={headId}>{copy.title}</h3>
          <p>{copy.sub}</p>
        </div>
      </div>
      {a ? (
        <div className="cb-as-b">
          <div className="cb-as-row">
            <h4 className="cb-as-title">{t(a.title)}</h4>
            <AssessmentChips a={a} />
            <div className="cb-as-acts">
              <IconBtn
                d={PATH.pencil}
                label={`${s.editAssessment}: ${t(a.title)}`}
                onClick={() => setDlg('edit')}
              />
              <IconBtn
                d={PATH.trash}
                danger
                label={`${s.deleteAssessment}: ${t(a.title)}`}
                onClick={() => setDlg('delete')}
              />
            </div>
          </div>
          <QuestionList assessment={a} collapsible />
        </div>
      ) : (
        <div className="cb-as-b cb-empty">
          <strong>{copy.emptyH}</strong>
          <p>{copy.emptyP}</p>
          <button type="button" className="cb-add-solid" onClick={() => setDlg('new')}>
            <Ic d={PATH.plus} size={14} w={2.4} />
            {copy.add}
          </button>
        </div>
      )}

      {dlg === 'new' || (dlg === 'edit' && a) ? (
        <AssessmentDialog
          kind={kind}
          initial={dlg === 'edit' ? a : undefined}
          onClose={() => setDlg(null)}
          onSave={(input) => {
            if (dlg === 'edit' && a) {
              api.updateAssessment(a.id, input)
              toast(a.hasAttempts ? s.tAssessV(a.version + 1) : s.tAssess)
            } else {
              api.createAssessment(input)
              toast(s.tAssess)
            }
            setDlg(null)
          }}
        />
      ) : null}
      {dlg === 'delete' && a ? (
        <ConfirmDialog
          danger
          eyebrow={s.delEy}
          title={s.delAssessH(t(a.title))}
          body={s.delAssessP}
          confirmLabel={s.delBtn}
          onClose={() => setDlg(null)}
          onConfirm={() => {
            api.deleteAssessment(a.id)
            setDlg(null)
            toast(s.tDeleted)
          }}
        />
      ) : null}
    </section>
  )
}
