// client: hand-built page (P16 learner course player). Mock data in the shape of the learner API.
//
// The course tree comes from the P59 editor's seed (read-only import), so editor and player show the
// same DCT World (C01): two modules, four units, 15 blocks, a pre-test, a unit check and a post-test.
// Answer keys stay in `keys`; they never reach the views, as on the server.
import { CATEGORIES, seedCourse } from '../P59-CourseEditor/mock'
import type {
  Assessment,
  Block,
  Course as EditorCourse,
  Question,
  UnitNode,
} from '../P59-CourseEditor/types'
import type {
  AnswerInput,
  AssessmentView,
  BlockView,
  CourseCard,
  CourseView,
  I18n,
  PlaylistItem,
  QuestionType,
  ResourceItem,
  SurveyQuestionView,
  UnitView,
} from './types'

const i = (en: string, ar: string): I18n => ({ en, ar })
const blob = (id: string) => `/_blob/${id}`

/** Local images the old player used for posters, so nothing is fetched from outside. */
const IMG = {
  C01: blob('fa500a874150b2a1769785936a6d7785'),
  C02: blob('d99ea09adede7395461223b429f24cf4'),
  team: blob('eb80e68b5f407df8f3c317956007a5a2'),
  home: blob('1309cd48586ad6e5374578ed63abc172'),
  ay: blob('880a72d5794fad0ac73793c03f37c852'),
  znm: blob('6a330c17598da2f1e81b82711e1c5e9a'),
  C04: blob('592272d2d94f43d123cbcdda07b02178'),
  C06: blob('cf69d2b8596f972f4af9fc63c0137303'),
  emp: blob('92c83a667e1befe5661dab8c7ebca349'),
}
const POSTERS = [IMG.home, IMG.C02, IMG.C06, IMG.team, IMG.ay, IMG.znm]

export interface QuestionKey {
  type: QuestionType
  points: number
  /** multiple_choice / true_false: the correct option ids */
  correct: string[]
  /** sorting: option ids in the right order */
  order: string[]
}

export interface PointsConfig {
  unit: number
  course: number
  assessmentPass: number
}

export interface CourseData {
  key: string
  course: CourseView['course']
  modules: { id: string; title: I18n; order: number; unitIds: string[] }[]
  units: Record<string, UnitView>
  unitOrder: string[]
  unitDuration: Record<string, number>
  assessments: Record<string, AssessmentView>
  keys: Record<string, Record<string, QuestionKey>>
  preId?: string
  postId?: string
  /** the `quiz_blocking` block's assessment, by unit */
  unitAssessment: Record<string, string>
  points: PointsConfig
  mandatoryOn: string[]
  next: { slug: string; title: I18n; meta: I18n }
  serial: string
}

/* ------------------------------------------------------------------ slug → course */

const SLUG_KEY: Record<string, string> = { 'dct-world': 'C01', 'museum-101': 'C02' }
let slugScan: Record<string, string> | null = null

/** The editor seed's course key for a URL slug. Unknown slugs fall back to Museum 101, as before. */
export function courseKeyForSlug(slug: string): string {
  const known = SLUG_KEY[slug]
  if (known) return known
  if (!slugScan) {
    slugScan = {}
    for (let n = 1; n <= 23; n++) {
      const k = `C${String(n).padStart(2, '0')}`
      slugScan[seedCourse(k).course.slug] = k
    }
  }
  return slugScan[slug] ?? 'C02'
}

/* ------------------------------------------------------------------ payload mapping */

const videoId = (v: string | undefined): string => {
  if (!v) return ''
  const m = v.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/)
  return m?.[1] ?? v
}

const mmss = (s: string | undefined): number => {
  const m = (s ?? '').match(/(\d+):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : 360
}

const SURVEY_OPTIONS: I18n[][] = [
  [i('Not at all', 'لا أعرفها'), i('Somewhat', 'إلى حد ما'), i('Very', 'جيداً جداً')],
  [i('Culture', 'الثقافة'), i('Tourism', 'السياحة'), i('Both', 'كلاهما')],
]
const SCALE: I18n[] = [1, 2, 3, 4, 5].map((n) => i(String(n), String(n)))

function surveyQuestions(b: Block): SurveyQuestionView[] {
  return (b.payload.surveyQuestions ?? []).map((q, n) => {
    const opts =
      q.type === 'scale' ? SCALE : q.type === 'single' ? SURVEY_OPTIONS[n % 2] : undefined
    return {
      id: `${b.id}-q${n + 1}`,
      text: q.text,
      type: q.type === 'single' || q.type === 'scale' ? q.type : 'open',
      options: opts?.map((text, k) => ({ id: `${b.id}-q${n + 1}-o${k + 1}`, text })),
    }
  })
}

const RELATED: CourseCard[] = [
  {
    slug: 'museum-101',
    title: i('Museum 101', 'المتاحف 101'),
    imageUrl: IMG.C02,
    level: 'beginner',
    durationMin: 60,
  },
  {
    slug: 'cultural-heritage',
    title: i('Understanding Cultural Heritage', 'فهم التراث الثقافي'),
    imageUrl: IMG.C04,
    level: 'beginner',
    durationMin: 50,
  },
  {
    slug: 'conservation-exhibition',
    title: i('Conservation and Exhibition of Artefacts', 'صون القطع الأثرية وعرضها'),
    imageUrl: IMG.znm,
    level: 'intermediate',
    durationMin: 90,
  },
]

function mapBlock(b: Block, unitIndex: number, posterOffset: number): BlockView {
  const p = b.payload
  const base = { id: b.id, order: b.order, required: b.required }
  switch (b.type) {
    case 'youtube':
      return {
        ...base,
        type: 'youtube',
        payload: {
          title: p.title,
          videoId: videoId(p.videoUrl),
          posterUrl: POSTERS[(unitIndex + posterOffset) % POSTERS.length] as string,
          durationSec: unitIndex === 0 && b.order === 0 ? 180 : 480,
          mustWatch: !!p.mustWatch && b.required,
        },
      }
    case 'text':
      return {
        ...base,
        type: 'text',
        payload: { title: p.title, html: p.body ?? i('', '') },
      }
    case 'case_study':
      return {
        ...base,
        type: 'case_study',
        payload: { title: p.title, html: p.scenario ?? i('', ''), reflection: p.reflection },
      }
    case 'quotes':
      return {
        ...base,
        type: 'quotes',
        payload: {
          title: p.title,
          items: (p.quotes ?? []).map((q) => ({ text: q.text, author: q.author })),
        },
      }
    case 'audio':
      return {
        ...base,
        type: 'audio',
        payload: {
          title: p.title,
          url: '',
          durationSec: mmss(p.audioMeta),
          transcript: p.transcript,
        },
      }
    case 'resources': {
      const files = p.files ?? []
      const items: ResourceItem[] = files.map((f) => {
        const name = f.name.replace(/\.[a-z0-9]+$/i, '')
        return {
          title: files.length === 1 ? i(name, p.title.ar || name) : i(name, name),
          url: '#',
          type: f.ext === 'PDF' ? 'pdf' : 'template',
          ext: f.ext,
          size: f.size,
          color: f.color,
        }
      })
      return { ...base, type: 'resources', payload: { title: p.title, items } }
    }
    case 'scorm':
      return {
        ...base,
        type: 'scorm',
        payload: {
          title: p.title,
          launchUrl: `/scorm/${p.launchFile ?? 'index_lms.html'}`,
          version: (p.scormMeta ?? '').includes('2004') ? '2004' : '1.2',
          posterUrl: IMG.ay,
          completionRule: p.completionRule ?? 'completed',
        },
      }
    case 'youtube_playlist': {
      const posters = [IMG.C04, IMG.emp, IMG.znm]
      const items: PlaylistItem[] = (p.videos ?? []).map((v, n) => ({
        videoId: v.videoId,
        title: v.title,
        duration: v.duration,
        posterUrl: posters[n % posters.length] as string,
      }))
      return { ...base, type: 'youtube_playlist', payload: { title: p.title, items } }
    }
    case 'action_plan':
      return {
        ...base,
        type: 'action_plan',
        payload: {
          title: p.title,
          intro: p.intro,
          questions: (p.planQuestions ?? []).slice(0, 5).map((q, n) => ({
            no: n + 1,
            text: q.text,
            charLimit: q.limit,
          })),
          allowPdf: p.allowPdf !== false,
        },
      }
    case 'survey':
      return {
        ...base,
        type: 'survey',
        payload: { title: p.title, questions: surveyQuestions(b) },
      }
    case 'quiz_blocking':
      return {
        ...base,
        type: 'quiz_blocking',
        payload: { title: p.title, assessmentId: p.assessmentId ?? '' },
      }
  }
}

/* ------------------------------------------------------------------ assessments */

const DESC: Record<Assessment['kind'], I18n> = {
  pre: i(
    'A short check of what you already know. You do not need to pass it to start the modules.',
    'اختبار قصير لما تعرفه مسبقاً. لا يلزم أن تنجح فيه لتبدأ الوحدات.',
  ),
  post: i(
    'Pass the final check to complete the course and receive your certificate.',
    'اجتز الاختبار النهائي لتُكمل الدورة وتحصل على شهادتك.',
  ),
  unit: i('Pass this check to complete the unit.', 'اجتز هذا الاختبار لتُكمل الدرس.'),
}

function rotate<T>(arr: T[], by: number): T[] {
  const n = arr.length
  if (n < 2) return arr.slice()
  const k = ((by % n) + n) % n
  return [...arr.slice(k), ...arr.slice(0, k)]
}

function mapAssessment(a: Assessment): { view: AssessmentView; keys: Record<string, QuestionKey> } {
  const keys: Record<string, QuestionKey> = {}
  const questions = a.questions
    .slice()
    .sort((x, y) => x.order - y.order)
    .map((q: Question) => {
      keys[q.id] = {
        type: q.type,
        points: q.points,
        correct: q.options.filter((o) => o.correct).map((o) => o.id),
        order: q.options.map((o) => o.id),
      }
      const shown =
        q.type === 'sorting' ? rotate(q.options, Math.ceil(q.options.length / 2)) : q.options
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        options:
          q.type === 'open_text' ? undefined : shown.map((o) => ({ id: o.id, text: o.text })),
      }
    })
  const view: AssessmentView = {
    id: a.id,
    kind: a.kind,
    title: a.title,
    description: DESC[a.kind],
    type: a.type,
    passMark: a.passMark,
    attemptsAllowed: a.attemptsAllowed,
    timeLimitMin: a.timeLimitMin ?? undefined,
    showAnswers: a.showAnswers,
    questions,
  }
  return { view, keys }
}

/** "Server-side" scoring: points earned over points available. Open answers earn full credit once written. */
export function scoreAttempt(
  keys: Record<string, QuestionKey>,
  answers: AnswerInput[],
): {
  scorePct: number
  right: Record<string, boolean>
  correct: Record<string, string[] | string>
} {
  let got = 0
  let all = 0
  const right: Record<string, boolean> = {}
  const correct: Record<string, string[] | string> = {}
  for (const [qid, k] of Object.entries(keys)) {
    all += k.points
    const a = answers.find((x) => x.questionId === qid)
    let ok = false
    if (k.type === 'open_text') {
      ok = (a?.text ?? '').trim().length >= 10
      correct[qid] = ''
    } else if (k.type === 'sorting') {
      ok = !!a?.order && a.order.join('|') === k.order.join('|')
      correct[qid] = k.order
    } else {
      const sel = a?.optionIds ?? []
      ok = sel.length === k.correct.length && sel.every((id) => k.correct.includes(id))
      correct[qid] = k.correct
    }
    right[qid] = ok
    if (ok) got += k.points
  }
  return { scorePct: all ? Math.round((got / all) * 100) : 100, right, correct }
}

/* ------------------------------------------------------------------ course data */

const UNIT_MIN = [10, 12, 13, 10]

const NEXT: Record<string, CourseData['next']> = {
  'dct-world': {
    slug: 'museum-101',
    title: i('Museum 101', 'المتاحف 101'),
    meta: i('The World of Museums · 60 min', 'عالم المتاحف · 60 دقيقة'),
  },
  'museum-101': {
    slug: 'cultural-heritage',
    title: i('Understanding Cultural Heritage', 'فهم التراث الثقافي'),
    meta: i('Cultural Heritage · 50 min', 'التراث الثقافي · 50 دقيقة'),
  },
}

const cache = new Map<string, CourseData>()

export function courseData(key: string): CourseData {
  const hit = cache.get(key)
  if (hit) return hit
  const tree = seedCourse(key)
  const c: EditorCourse = tree.course
  const units: Record<string, UnitView> = {}
  const unitOrder: string[] = []
  const unitDuration: Record<string, number> = {}
  const unitAssessment: Record<string, string> = {}
  const modules = tree.modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      unitIds: m.units
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((u: UnitNode) => {
          const idx = unitOrder.length
          unitOrder.push(u.id)
          unitDuration[u.id] = c.id === 'C01' ? (UNIT_MIN[idx] ?? 12) : 12
          const blocks = u.blocks
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((b) => mapBlock(b, idx, c.id === 'C01' ? 0 : 1))
          // The related-courses block exists in the contract but not in the editor yet: add one.
          if (c.id === 'C01' && idx === 2) {
            blocks.push({
              id: `${u.id}-related`,
              type: 'related_courses',
              order: blocks.length,
              required: false,
              payload: { title: i('Keep exploring', 'واصل الاستكشاف'), items: RELATED },
            })
          }
          for (const b of blocks) {
            if (b.type === 'quiz_blocking') unitAssessment[u.id] = b.payload.assessmentId
          }
          units[u.id] = { id: u.id, moduleId: m.id, title: u.title, order: u.order, blocks }
          return u.id
        }),
    }))
  const assessments: Record<string, AssessmentView> = {}
  const keys: Record<string, Record<string, QuestionKey>> = {}
  let preId: string | undefined
  let postId: string | undefined
  for (const a of tree.assessments) {
    const m = mapAssessment(a)
    assessments[a.id] = m.view
    keys[a.id] = m.keys
    if (a.kind === 'pre') preId = a.id
    if (a.kind === 'post') postId = a.id
  }
  const slug = c.slug
  const data: CourseData = {
    key,
    course: {
      id: c.id,
      slug,
      title: c.title,
      description: c.description,
      imageUrl: c.imageUrl,
      level: c.level,
      durationMin: c.durationMin,
      categories: c.categories.map((id) => CATEGORIES[id] ?? i(id, id)),
      isMandatory: false,
      certificateEnabled: c.certificateEnabled,
      progressPct: 0,
      state: 'not_started',
      enrolledAt: '2026-09-28',
    },
    modules,
    units,
    unitOrder,
    unitDuration,
    assessments,
    keys,
    preId,
    postId,
    unitAssessment,
    points: {
      unit: c.pointsConfig.unit,
      course: c.pointsConfig.course,
      assessmentPass: c.pointsConfig.assessmentPass,
    },
    mandatoryOn: c.microsites.filter((m) => m.mandatory).map((m) => m.id),
    next: NEXT[slug] ?? {
      slug: 'museum-101',
      title: i('Museum 101', 'المتاحف 101'),
      meta: i('The World of Museums · 60 min', 'عالم المتاحف · 60 دقيقة'),
    },
    serial: `DCT-2026-${c.id}-000213`,
  }
  cache.set(key, data)
  return data
}
