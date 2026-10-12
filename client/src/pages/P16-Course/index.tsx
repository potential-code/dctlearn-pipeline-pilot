// client: hand-built page (P16 learner course player). Replaces the generated artboard port
// (view.tsx / logic.js); rebuilt after the potential-template learning-module player:
// a course card on top, then the "Course content" menu beside the block or assessment.
//
// URLs (all under /{p}/learn/{course}): the bare course URL opens the player where the learner left off,
// /pre-test and /final-check open the assessments, /u2 the first unfinished block of unit 2, /u2/b3 one block,
// /complete the finish screen. `?state=fresh|u2|final|failed|complete` seeds the mock learner (demo only).
import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/shell/AppShell'
import { shellHelper } from '@/components/shell/shellHelper'
import { useLocale } from '@/i18n/useLocale'
import { AssessmentScreen } from './assessment'
import { BlockScreen } from './blocks'
import { CompleteView } from './complete'
import { PcContext } from './ctx'
import { CourseCard } from './header'
import { CourseMenu } from './menu'
import { courseData, courseKeyForSlug } from './mock'
import {
  defaultTarget,
  lockReason,
  type Parsed,
  parseUrl,
  targetHref,
  targetPath,
  unitAt,
  unitTarget,
} from './nav'
import { Notice } from './stage'
import { type Effects, openStore, type Preset, useLearner } from './store'
import { Dialog, Ic, LpProvider, PATH, useLp } from './ui'
import './style.css'

interface Props {
  site?: string
  course?: string
  unit?: string
  block?: string
  /** legacy artboard presets: outline, unit1..4, quiz, pass, fail, complete */
  screen?: string
  state?: string
}

const SITE_NAME: Record<string, [string, string]> = {
  employees: ['DCT Employees', 'موظفو الدائرة'],
  znm: ['Zayed National Museum', 'متحف زايد الوطني'],
  zu: ['ZU 24-Hour Challenge', 'تحدي جامعة زايد'],
  museopro: ['MuseoPro', 'ميوزيو برو'],
  nibras: ['Nibras — AI Champions', 'نبراس'],
}
const LEARNER: Record<string, [string, string, string, string, string]> = {
  employees: [
    'Saeed Al Hammadi',
    'سعيد الحمادي',
    'SA',
    'Specialist, DCT Culture',
    'أخصائي، قطاع الثقافة',
  ],
  znm: ['Yousef Al Zaabi', 'يوسف الزعابي', 'YZ', 'Gallery Host, ZNM', 'مضيف صالة عرض، المتحف'],
  zu: ['Ahmed Khan', 'أحمد خان', 'AK', 'ZU student', 'طالب في جامعة زايد'],
  museopro: ['Élise Martin', 'إليز مارتن', 'EM', 'Collections officer', 'مسؤولة مجموعات'],
  nibras: ['Hamad Al Mazrouei', 'حمد المزروعي', 'HM', 'Data analyst', 'محلل بيانات'],
}

const isPreset = (v: string | undefined): v is Preset =>
  !!v && /^(fresh|final|failed|passed|complete|u\d+)$/.test(v)

/** What the mock learner has done when the page is opened straight on a deep link. */
function impliedPreset(
  parsed: Parsed,
  screen: string | undefined,
): { preset: Preset; at?: { unit: number; block: number } } {
  if (parsed) {
    if ('unit' in parsed) return { preset: `u${parsed.unit + 1}` }
    const t = parsed.target
    if (t.kind === 'block')
      return { preset: `u${t.unit + 1}`, at: { unit: t.unit, block: t.block } }
    if (t.kind === 'post') return { preset: 'final' }
    if (t.kind === 'complete') return { preset: 'complete' }
    return { preset: 'fresh' }
  }
  const sc = screen ?? ''
  const u = sc.match(/^unit(\d+)$/)
  if (u) return { preset: `u${Number(u[1])}` }
  if (sc === 'quiz') return { preset: 'final' }
  if (sc === 'pass' || sc === 'complete') return { preset: 'complete' }
  if (sc === 'fail') return { preset: 'failed' }
  return { preset: 'fresh' }
}

export default function P16CoursePage(props: Props) {
  const site = props.site ?? 'employees'
  const slug = props.course ?? 'dct-world'
  const { lang, ar, dir, L } = useLocale()
  const [root, setRoot] = useState<HTMLElement | null>(null)
  const data0 = courseData(courseKeyForSlug(slug))
  const user = LEARNER[site] ?? (LEARNER.employees as NonNullable<(typeof LEARNER)[string]>)
  const siteName = SITE_NAME[site] ?? (SITE_NAME.employees as [string, string])
  const sh = shellHelper(ar, 'learner', 'hub_courses', site, [
    { label: L(siteName[0], siteName[1]), href: `/${site}/dashboard` },
    { label: L('Courses', 'الدورات'), href: `/${site}/hub/courses` },
    { label: ar ? data0.course.title.ar : data0.course.title.en },
  ])
  sh.userName = L(user[0], user[1])
  sh.initials = user[2]
  sh.userSub = L(user[3], user[4])
  return (
    <div className="pgs-P16-Course">
      <div className="ds pt proto" dir={dir} lang={lang} ref={setRoot}>
        <LpProvider lang={lang} portal={root} site={site} slug={slug}>
          <AppShell sh={sh}>
            <main className="pc lp-page" id="main">
              <Player
                {...props}
                site={site}
                course={slug}
                firstName={L(user[0], user[1]).split(' ')[0] ?? ''}
              />
            </main>
          </AppShell>
        </LpProvider>
      </div>
    </div>
  )
}

function Player({
  site,
  course,
  unit,
  block,
  screen,
  state,
  firstName,
}: Props & { site: string; course: string; firstName: string }) {
  const { s, t, toast } = useLp()
  const router = useRouter()
  const data0 = courseData(courseKeyForSlug(course))
  const parsed = parseUrl(data0, unit, block)
  const imp = impliedPreset(parsed, screen)
  const store = openStore(course, isPreset(state) ? state : undefined, imp.preset, imp.at)
  const { data, p, api } = useLearner(store)

  const resume = defaultTarget(data, p)
  const notFound = !!unit && !parsed
  const target = notFound
    ? null
    : !unit
      ? resume
      : parsed && 'unit' in parsed
        ? unitTarget(data, p, parsed.unit)
        : parsed && 'target' in parsed
          ? parsed.target
          : null
  const reason = target ? lockReason(data, p, target) : null
  const here = target ? targetPath(target) : ''

  // The course URL and a bare unit URL settle on the canonical /u2/b3 form.
  const canonical =
    target && (!unit || (parsed && 'unit' in parsed)) ? targetHref(site, course, target) : null
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the URL decides
  useEffect(() => {
    if (canonical) router.navigate({ href: canonical, replace: true })
  }, [unit, block])

  const fx = useCallback(
    (e: Effects) => {
      if (e.courseCompleted) toast(s.pointsCourse(e.points))
      else if (e.unitCompleted) toast(s.pointsUnit(data.points.unit))
    },
    [toast, s, data.points.unit],
  )

  /* leaving a running assessment asks first */
  const guard = useRef(false)
  const setGuard = useCallback((on: boolean) => {
    guard.current = on
  }, [])
  const [leave, setLeave] = useState<string | null>(null)
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (guard.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])
  const onClickCapture = (e: React.MouseEvent) => {
    if (!guard.current) return
    const a = (e.target as Element).closest?.('a')
    const href = a?.getAttribute('href') ?? ''
    if (!a || a.target === '_blank' || !href.startsWith('/') || href.startsWith('//')) return
    e.preventDefault()
    e.stopPropagation()
    setLeave(href)
  }

  /* menu drawer on phones; moving anywhere closes it, and focus follows the new content */
  const [menuOpen, setMenuOpen] = useState(false)
  const first = useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the place changes
  useEffect(() => {
    setMenuOpen(false)
    if (first.current) {
      first.current = false
      return
    }
    const h = document.getElementById('lp-stage-h')
    h?.focus({ preventScroll: true })
    const top = document.getElementById('lp-content')?.getBoundingClientRect().top ?? 0
    if (top < 0) document.getElementById('lp-content')?.scrollIntoView({ block: 'start' })
  }, [here])

  const now =
    target?.kind === 'pre' && data.preId
      ? t(data.assessments[data.preId]?.title)
      : target?.kind === 'post' && data.postId
        ? t(data.assessments[data.postId]?.title)
        : target?.kind === 'block'
          ? t(unitAt(data, target.unit)?.blocks[target.block]?.payload.title)
          : ''

  let stage: React.ReactNode
  if (notFound) stage = <Notice title={s.notFoundH} body="" />
  else if (!target) stage = null
  else if (reason) stage = <Notice title={s.lockH} reason={reason} />
  else if (target.kind === 'pre' && data.preId)
    stage = <AssessmentScreen key="pre" id={data.preId} at={target} />
  else if (target.kind === 'post' && data.postId)
    stage = <AssessmentScreen key="post" id={data.postId} at={target} />
  else if (target.kind === 'complete') stage = <CompleteView name={firstName} />
  else if (target.kind === 'block')
    stage = <BlockScreen key={here} ui={target.unit} bi={target.block} />

  return (
    <PcContext.Provider
      value={{
        data,
        p,
        api,
        target,
        resume,
        hrefOf: (x) => targetHref(site, course, x),
        fx,
        setGuard,
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: captures link clicks to guard a running attempt */}
      <div className="lp" onClickCapture={onClickCapture}>
        <CourseCard />
        <div className="lp-grid">
          <button
            type="button"
            className="lp-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="lp-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Ic d={PATH.menu} size={18} />
            <span className="lp-menu-bt">
              <b>{s.menuToggle}</b>
              {now ? (
                <span className="cap">
                  {s.menuCurrent} {now}
                </span>
              ) : null}
            </span>
            <Ic d={PATH.chevron} size={16} className={`lp-chev ${menuOpen ? 'up' : ''}`} />
          </button>
          <CourseMenu open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
          <div className="lp-content" id="lp-content">
            {stage}
          </div>
        </div>
      </div>
      {leave ? (
        <Dialog
          eyebrow={s.leaveEyebrow}
          title={s.leaveH}
          onClose={() => setLeave(null)}
          footer={
            <>
              <button type="button" className="btn btn-line" onClick={() => setLeave(null)}>
                {s.leaveStay}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const to = leave
                  guard.current = false
                  setLeave(null)
                  window.dispatchEvent(new CustomEvent('dct-nav', { detail: to }))
                }}
              >
                {s.leaveGo}
              </button>
            </>
          }
        >
          <p>{s.leaveP}</p>
        </Dialog>
      ) : null}
    </PcContext.Provider>
  )
}
