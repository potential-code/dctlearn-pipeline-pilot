// client: hand-built page (P59 course editor). Layout follows the potential-template CourseBuilder:
// header card, then pre-test / curriculum / post-test on the left and settings / statistics on the right.
import { useMemo, useState } from 'react'
import { AssessmentCard } from './assessments'
import { CourseContext, useCourse as useCourseCtx } from './ctx'
import { SettingsPanel, StatsCard } from './settings'
import { useCourseAdmin } from './store'
import { ModuleTree } from './tree'
import { ConfirmDialog, Ic, PATH, useCb } from './ui'

function Header({ previewHref }: { previewHref: string }) {
  const { s, t, toast } = useCb()
  const { tree, api } = useCourseCtx()
  const c = tree.course
  const [dlg, setDlg] = useState<'publish' | null>(null)
  const units = tree.modules.flatMap((m) => m.units)
  const ready = units.some((u) => u.blocks.length > 0)
  const post = tree.assessments.find((a) => a.kind === 'post')
  const status = c.status === 'published' ? s.stPub : c.status === 'archived' ? s.stArch : s.stDraft
  const cls = c.status === 'published' ? 'ok' : c.status === 'archived' ? 'mut' : 'warn'
  const name = t(c.title)
  const toggle = () => {
    if (c.status === 'published') {
      api.unpublish()
      toast(s.tUnpublished)
    } else if (c.status === 'archived') {
      api.unpublish()
      toast(s.tUnpublished)
    } else setDlg('publish')
  }
  return (
    <header className="pcard cb-head">
      <img className="cb-cover" src={c.imageUrl} alt="" />
      <div className="cb-head-t">
        <div className="cb-chips">
          <span className={`tag ${cls}`}>{status}</span>
          <span className="tag info">{s.lvl[c.level]}</span>
        </div>
        <h1>{name || s.untitled}</h1>
        <p>{t(c.description) || s.noDescription}</p>
      </div>
      <div className="cb-head-a">
        <a className="btn btn-line" href={previewHref}>
          <Ic d={PATH.eye} size={18} />
          {s.preview}
        </a>
        <button
          type="button"
          className={`btn ${c.status === 'draft' ? 'btn-primary' : 'btn-line'}`}
          onClick={toggle}
        >
          <Ic d={c.status === 'draft' ? PATH.globe : PATH.undo} size={18} />
          {c.status === 'draft' ? s.publish : c.status === 'archived' ? s.restore : s.unpublish}
        </button>
      </div>
      {dlg ? (
        <ConfirmDialog
          eyebrow={ready ? s.pubEy : s.pubWarnH}
          title={ready ? s.pubH(name) : s.pubWarnH}
          body={ready ? s.pubP : s.pubWarnP}
          list={ready ? s.pubL(units.length, post ? post.questions.length : null) : undefined}
          confirmLabel={s.pubBtn}
          hideConfirm={!ready}
          onClose={() => setDlg(null)}
          onConfirm={() => {
            api.publish()
            setDlg(null)
            toast(s.tPublished)
          }}
        />
      ) : null}
    </header>
  )
}

export function CourseBuilder({ courseId }: { courseId: string }) {
  const { s } = useCb()
  const { tree, api, version } = useCourseAdmin(courseId)
  const ctx = useMemo(() => ({ tree, api }), [tree, api])
  const first = tree.course.microsites[0]?.id ?? 'employees'
  return (
    <CourseContext.Provider value={ctx}>
      <div className="cb">
        <a className="cb-back" href="/admin/catalog">
          <Ic d={PATH.back} size={16} className="cb-flip" />
          {s.back}
        </a>
        <Header previewHref={`/${first}/learn/${tree.course.slug}`} />
        {tree.course.status === 'published' ? (
          <details className="alert alert-warn cb-note">
            <summary>
              <strong>{s.banH}</strong>
            </summary>
            <p>{s.banP}</p>
            <ul>
              {s.banL.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
        ) : null}
        <div className="cb-grid">
          <div className="cb-main">
            <AssessmentCard kind="pre" />
            <ModuleTree />
            <AssessmentCard kind="post" />
          </div>
          <div className="cb-side">
            <SettingsPanel version={version} />
            <StatsCard />
          </div>
        </div>
      </div>
    </CourseContext.Provider>
  )
}
