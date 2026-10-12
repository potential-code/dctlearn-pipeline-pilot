// client: hand-built page (P16 learner course player). Shared bits: icons, page context, toast, dialog shell.
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { STRINGS, type Strings } from './strings'
import type { BlockType, I18n } from './types'

/* ---------------------------------------------------------------- icons */

export const PATH = {
  check: 'M20 6 9 17l-5-5',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  chevron: 'M6 9l6 6 6-6',
  chevronEnd: 'M9 18l6-6-6-6',
  arrow: 'M5 12h14M12 5l7 7-7 7',
  arrowBack: 'M19 12H5M12 19l-7-7 7-7',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  play: 'M8 5v14l11-7z',
  pause: 'M6 4h4v16h-4zM14 4h4v16h-4z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  menu: 'M3 6h18M3 12h18M3 18h18',
  clipboard:
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9zM9 12h6M9 16h6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  target:
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  refresh: 'M1 4v6h6M3.5 15a9 9 0 1 0 2.1-9.4L1 10',
  alert: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01',
  xCircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6',
  checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
  close: 'M18 6 6 18M6 6l12 12',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  layers: 'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  award: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.2 13.9 7 23l5-3 5 3-1.2-9.1',
  warn: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
} as const

export const BLOCK_ICON: Record<BlockType, string> = {
  youtube: 'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  text: 'M4 6h16M4 10h16M4 14h10M4 18h12',
  case_study: 'M3 7h18v13H3zM8 7V4h8v3M3 12h18',
  quotes: 'M3 21c3 0 7-1 7-8V5H3v7h4c0 4-2 5-4 5zM14 21c3 0 7-1 7-8V5h-7v7h4c0 4-2 5-4 5z',
  audio: 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z',
  resources:
    'M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  scorm: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7 12 12l8.7-5M12 22V12',
  youtube_playlist: 'M3 6h12M3 12h12M3 18h8M17 14l5 3-5 3z',
  related_courses:
    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  action_plan: PATH.target,
  survey:
    'M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4',
  quiz_blocking: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M10 16l1.5 1.5L14 15',
}

export function Ic({
  d,
  size = 18,
  w = 2,
  className,
}: {
  d: string
  size?: number
  w?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={w === 0 ? 'currentColor' : 'none'}
      stroke={w === 0 ? 'none' : 'currentColor'}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      focusable="false"
    >
      <path d={d} />
    </svg>
  )
}

/* -------------------------------------------------------------- context */

export interface Lp {
  s: Strings
  lang: 'en' | 'ar'
  ar: boolean
  /** The current-language text of a bilingual value, falling back to the other one. */
  t: (v: I18n | undefined) => string
  toast: (msg: string) => void
  /** Where dialogs mount: inside the .ds.pt root so the page's design tokens apply. */
  portal: HTMLElement | null
  site: string
  slug: string
}
const LpContext = createContext<Lp | null>(null)

export function useLp(): Lp {
  const c = useContext(LpContext)
  if (!c) throw new Error('useLp outside <LpProvider>')
  return c
}

export function LpProvider({
  lang,
  portal,
  site,
  slug,
  children,
}: {
  lang: 'en' | 'ar'
  portal: HTMLElement | null
  site: string
  slug: string
  children: ReactNode
}) {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toast = useCallback((m: string) => {
    setMsg(m)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 3600)
  }, [])
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])
  const value = useMemo<Lp>(() => {
    const ar = lang === 'ar'
    return {
      s: STRINGS[lang],
      lang,
      ar,
      toast,
      portal,
      site,
      slug,
      t: (v) => (v ? (ar ? v.ar || v.en : v.en || v.ar) : ''),
    }
  }, [lang, toast, portal, site, slug])
  return (
    <LpContext.Provider value={value}>
      {children}
      <div className="lp-toast-region" role="status" aria-live="polite">
        {msg ? (
          <div className="toast">
            <Ic d={PATH.check} size={18} w={2.4} />
            <span>{msg}</span>
          </div>
        ) : null}
      </div>
    </LpContext.Provider>
  )
}

/* -------------------------------------------------------------- dialog */

/**
 * Modal shell. role="dialog" aria-modal="true" is what client/src/app/DialogManager.tsx keys on:
 * focus trap, Escape and backdrop click (through the close button), scroll lock, focus return.
 */
export function Dialog({
  eyebrow,
  title,
  onClose,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  onClose: () => void
  children: ReactNode
  footer: ReactNode
}) {
  const { s, portal } = useLp()
  const id = useId()
  return createPortal(
    <div className="ovl">
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="dh">
          <div className="lp-dh-t">
            <span className="eyebrow">{eyebrow}</span>
            <h2 id={id}>{title}</h2>
          </div>
          <button type="button" className="xbtn" onClick={onClose} aria-label={s.close}>
            <Ic d={PATH.close} size={20} w={2.2} />
          </button>
        </div>
        <div className="db">{children}</div>
        <div className="df">{footer}</div>
      </div>
    </div>,
    portal ?? document.body,
  )
}

/** mm:ss for the countdown. */
export const clock = (sec: number): string =>
  `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`
