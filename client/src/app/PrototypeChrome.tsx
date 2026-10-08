import { useRouterState } from '@tanstack/react-router'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useLocale } from '@/i18n/useLocale'
import { countUp } from '@/lib/countUp'
import { scrollTopNow } from '@/lib/motion/SmoothScroll'
import { DialogManager } from './DialogManager'
import { usePageChrome } from './pageChrome'

/** Which part of the app a path belongs to; same rule as Prototype.dc.html's go(). */
function area(path: string): string {
  const p = path.split('?')[0]?.split('/').filter(Boolean) ?? []
  const publicTop = [
    'login',
    'employee-registration',
    'reset-password',
    'set-password',
    'professionals',
    'students',
    'faq',
    '404',
    'ai',
  ]
  if (
    !p.length ||
    publicTop.includes(p[0] ?? '') ||
    p[1] === 'sign-in' ||
    p[1] === 'login' ||
    p[1] === 'invite' ||
    (p.length === 1 &&
      !['platforms', 'notifications', 'mentor', 'judge', 'admin'].includes(p[0] ?? ''))
  )
    return 'public'
  if (p[0] === 'mentor') return 'mentor'
  if (p[0] === 'judge') return 'judge'
  if (p[0] === 'admin') return 'admin'
  if (p[1] === 'admin') return `sub:${p[0]}`
  return 'learner'
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * The clickable prototype's frame: intro transition, "inner" navigation inside one portal,
 * scroll-to-top and KPI count-up after each navigation, and the floating "Switch account /
 * EN · ع" pill on every page except Home and Sign in.
 */
export function PrototypeChrome({ children }: { children: ReactNode }) {
  const { lang, setLang } = useLocale()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const prev = useRef(pathname)
  const [inner, setInner] = useState(false)
  const [tx, setTx] = useState(() => (reduced() ? '' : 'intro'))

  // The intro transition runs once, on first load: intro → out (1.1 s) → gone (1.8 s).
  // biome-ignore lint/correctness/useExhaustiveDependencies: timers are set once on mount
  useEffect(() => {
    if (!tx) return
    const t1 = setTimeout(() => setTx('out'), 1100)
    const t2 = setTimeout(() => setTx(''), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (prev.current === pathname) return
    const a = area(pathname)
    setInner(a === area(prev.current) && a !== 'public')
    prev.current = pathname
    scrollTopNow()
    const t = setTimeout(countUp, reduced() ? 0 : 350)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    const t = setTimeout(countUp, 350)
    return () => clearTimeout(t)
  }, [])

  usePageChrome(pathname, lang)
  const ar = lang === 'ar'
  const showSw = pathname !== '/' && pathname !== '/login'
  return (
    <div className={`proto-root ${inner ? 'inner' : ''} ${showSw ? 'has-sw' : ''}`}>
      <DialogManager />
      {children}
      <div className={`ptx ${tx}`} aria-hidden="true">
        <div className="pn" />
        <div className="shp">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      {showSw ? (
        <div className={`proto-sw ${ar ? 'l' : 'r'}`} role="group" aria-label="Prototype">
          <a href="/login" aria-label="Switch account">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            <span>{ar ? 'تبديل الحساب' : 'Switch account'}</span>
          </a>
          <span className="sep" />
          <button type="button" className={ar ? '' : 'on'} onClick={() => setLang('en')}>
            EN
          </button>
          <button type="button" className={ar ? 'on' : ''} onClick={() => setLang('ar')}>
            ع
          </button>
        </div>
      ) : null}
    </div>
  )
}
