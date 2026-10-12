// client: hand-built page (P59 course editor). Numbered, sortable question list for one assessment.
import { useState } from 'react'
import { useCourse } from './ctx'
import { QuestionDialog } from './dialogs'
import { SortableItem, SortableList } from './sortable'
import type { Assessment, Question } from './types'
import { ConfirmDialog, IconBtn, PATH, useCb } from './ui'

export function QuestionList({
  assessment,
  collapsible,
}: {
  assessment: Assessment
  collapsible?: boolean
}) {
  const { s, t, toast } = useCb()
  const { api } = useCourse()
  const [open, setOpen] = useState(true)
  const [edit, setEdit] = useState<Question | 'new' | null>(null)
  const [del, setDel] = useState<Question | null>(null)
  const qs = [...assessment.questions].sort((a, b) => a.order - b.order)
  const nameOf = (id: string) =>
    t(qs.find((q) => q.id === id)?.text ?? { en: '', ar: '' }) || s.untitled
  const listId = `ql-${assessment.id}`

  return (
    <div className="cb-qs">
      <div className="cb-qs-h">
        <h4 className="cb-lbl">{s.questionsN(qs.length)}</h4>
        {collapsible ? (
          <button
            type="button"
            className="cb-ib"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={s.expandQs}
            title={s.expandQs}
            onClick={() => setOpen((o) => !o)}
          >
            <svg
              className={`cb-chev ${open ? 'open' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={PATH.chevron} />
            </svg>
          </button>
        ) : null}
      </div>
      <div id={listId} hidden={collapsible ? !open : false}>
        {qs.length === 0 ? <p className="cb-empty-line">{s.noQuestions}</p> : null}
        <SortableList
          ids={qs.map((q) => q.id)}
          nameOf={nameOf}
          onReorder={(ids) => api.reorderQuestions(assessment.id, ids)}
        >
          <ol className="cb-qlist">
            {qs.map((q, n) => (
              <li key={q.id}>
                <SortableItem
                  id={q.id}
                  handleLabel={`${s.dragQuestion}: ${n + 1}`}
                  className="cb-qrow"
                >
                  {(handle) => (
                    <>
                      {handle}
                      <span className="cb-num" aria-hidden="true">
                        {n + 1}
                      </span>
                      <span className="cb-qt">{t(q.text) || s.untitled}</span>
                      <span className="cb-badge" title={s.qtLong[q.type]}>
                        <span aria-hidden="true">{s.qtShort[q.type]}</span>
                        <span className="cb-sr">{s.qtLong[q.type]}</span>
                      </span>
                      <IconBtn
                        d={PATH.pencil}
                        label={`${s.editQuestion} ${n + 1}`}
                        onClick={() => setEdit(q)}
                      />
                      <IconBtn
                        d={PATH.trash}
                        danger
                        label={`${s.deleteQuestion} ${n + 1}`}
                        onClick={() => setDel(q)}
                      />
                    </>
                  )}
                </SortableItem>
              </li>
            ))}
          </ol>
        </SortableList>
        <button type="button" className="cb-add-solid" onClick={() => setEdit('new')}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d={PATH.plus} />
          </svg>
          {s.addQuestion}
        </button>
      </div>

      {edit ? (
        <QuestionDialog
          initial={edit === 'new' ? undefined : edit}
          onClose={() => setEdit(null)}
          onSave={(input) => {
            if (edit === 'new') api.createQuestion(assessment.id, input)
            else api.updateQuestion(assessment.id, edit.id, input)
            setEdit(null)
            toast(s.tQuestion)
          }}
        />
      ) : null}
      {del ? (
        <ConfirmDialog
          danger
          eyebrow={s.delEy}
          title={s.delQuestionH}
          body={s.delQuestionP}
          confirmLabel={s.delBtn}
          onClose={() => setDel(null)}
          onConfirm={() => {
            api.deleteQuestion(assessment.id, del.id)
            setDel(null)
            toast(s.tDeleted)
          }}
        />
      ) : null}
    </div>
  )
}
