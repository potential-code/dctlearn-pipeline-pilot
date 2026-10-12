// client: hand-built page (P16 learner course player). One block per screen, with its gate and footer.
import { AssessmentScreen } from './assessment'
import { usePc } from './ctx'
import type { Progress, Target } from './nav'
import { unitAt } from './nav'
import {
  ActionPlanBlock,
  AudioBlock,
  CaseBlock,
  PlaylistBlock,
  planReady,
  QuotesBlock,
  RelatedBlock,
  ResourcesBlock,
  ScormBlock,
  SurveyBlock,
  TextBlock,
  VideoBlock,
} from './renderers'
import { StepNav } from './stage'
import type { Strings } from './strings'
import type { BlockView } from './types'
import { BLOCK_ICON, Ic, PATH, useLp } from './ui'

interface Gate {
  /** the learner has done what the block asks, so "Mark as complete" is enabled */
  ready: boolean
  hint: string | null
  /** the block completes itself (survey sent, module finished): no button */
  auto: boolean
}

/** What a block needs before it counts as complete. Optional blocks only need an acknowledgement. */
function gate(b: BlockView, p: Progress, s: Strings): Gate {
  if (!b.required) return { ready: true, hint: null, auto: false }
  switch (b.type) {
    case 'youtube':
      return b.payload.mustWatch
        ? { ready: (p.media[b.id] ?? 0) >= 100, hint: s.hintWatch, auto: false }
        : { ready: true, hint: null, auto: false }
    case 'audio':
      return { ready: (p.media[b.id] ?? 0) >= 100, hint: s.hintListen, auto: false }
    case 'scorm':
      return { ready: false, hint: s.hintScorm, auto: true }
    case 'survey':
      return { ready: false, hint: s.hintSurvey, auto: true }
    case 'action_plan':
      return { ready: planReady(b, p.plan[b.id]), hint: s.hintPlan, auto: false }
    case 'quiz_blocking':
      return { ready: false, hint: s.hintQuiz, auto: true }
    default:
      return { ready: true, hint: null, auto: false }
  }
}

function Body({ b, done }: { b: BlockView; done: boolean }) {
  switch (b.type) {
    case 'youtube':
      return <VideoBlock b={b} />
    case 'text':
      return <TextBlock b={b} />
    case 'case_study':
      return <CaseBlock b={b} />
    case 'quotes':
      return <QuotesBlock b={b} />
    case 'audio':
      return <AudioBlock b={b} />
    case 'scorm':
      return <ScormBlock b={b} />
    case 'youtube_playlist':
      return <PlaylistBlock b={b} />
    case 'resources':
      return <ResourcesBlock b={b} />
    case 'related_courses':
      return <RelatedBlock b={b} />
    case 'action_plan':
      return <ActionPlanBlock b={b} />
    case 'survey':
      return <SurveyBlock b={b} done={done} />
    case 'quiz_blocking':
      return null
  }
}

export function BlockScreen({ ui, bi }: { ui: number; bi: number }) {
  const { s, t, toast } = useLp()
  const { data, p, api, fx } = usePc()
  const u = unitAt(data, ui)
  const b = u?.blocks[bi]
  if (!u || !b) return null
  const at: Target = { kind: 'block', unit: ui, block: bi }
  if (b.type === 'quiz_blocking') {
    return <AssessmentScreen id={b.payload.assessmentId} at={at} />
  }
  const done = !!p.blocksDone[b.id]
  const g = gate(b, p, s)
  const mi = data.modules.findIndex((m) => m.unitIds.includes(u.id))
  const complete = () => {
    const e = api.completeBlock(u.id, b.id)
    fx(e)
    if (!e.unitCompleted && !e.courseCompleted) toast(s.blockDone)
  }
  return (
    <section className="pcard lp-stage" aria-labelledby="lp-stage-h">
      <div className="lp-stage-h">
        <span className="eyebrow">
          {s.unitEyebrow(mi + 1, ui + 1, data.unitOrder.length)} · {t(u.title)}
        </span>
        <div className="lp-stage-t">
          <h2 id="lp-stage-h" tabIndex={-1}>
            <Ic d={BLOCK_ICON[b.type]} size={22} />
            {t(b.payload.title)}
          </h2>
          <span className="tag mut">{s.blockType[b.type]}</span>
          <span className={`tag ${b.required ? 'warn' : 'mut'}`}>
            {b.required ? s.required : s.optional}
          </span>
        </div>
        <span className="cap lp-stage-n">{s.blockOf(bi + 1, u.blocks.length)}</span>
      </div>
      <div className="lp-stage-b">
        <Body b={b} done={done} />
      </div>
      <StepNav
        at={at}
        canNext={done}
        hint={done ? null : (g.hint ?? s.hintNext)}
        middle={
          done ? (
            <span className="tag ok">
              <Ic d={PATH.check} size={13} w={3} />
              {s.completed}
            </span>
          ) : g.auto ? null : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!g.ready}
              onClick={complete}
              aria-describedby={g.ready ? undefined : 'lp-hint'}
            >
              <Ic d={PATH.check} size={16} w={2.4} />
              {s.markComplete}
            </button>
          )
        }
      />
    </section>
  )
}
