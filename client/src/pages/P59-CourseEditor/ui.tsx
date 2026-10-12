// client: hand-built page (P59 course editor). Shared bits: icons, context, dialog shell, controls.
import {
  type CSSProperties,
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
  plus: 'M12 5v14M5 12h14',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash:
    'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
  chevron: 'M6 9l6 6 6-6',
  back: 'M19 12H5M12 19l-7-7 7-7',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  close: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  layers: 'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  clipboard:
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9zM9 12h6M9 16h6',
  checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  globe:
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
  image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  warn: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  play: 'M8 5v14l11-7z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
} as const

export const BLOCK_ICON: Record<BlockType, { d: string; c: string }> = {
  youtube: {
    c: '#D63539',
    d: 'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  },
  text: { c: '#3B2F92', d: 'M4 6h16M4 10h16M4 14h10M4 18h12' },
  case_study: { c: '#CD3151', d: 'M3 7h18v13H3zM8 7V4h8v3M3 12h18' },
  quotes: {
    c: '#E35E3C',
    d: 'M3 21c3 0 7-1 7-8V5H3v7h4c0 4-2 5-4 5zM14 21c3 0 7-1 7-8V5h-7v7h4c0 4-2 5-4 5z',
  },
  audio: {
    c: '#CD3151',
    d: 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z',
  },
  resources: {
    c: '#3B2F92',
    d: 'M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5',
  },
  scorm: { c: '#1D1650', d: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7 12 12l8.7-5M12 22V12' },
  youtube_playlist: { c: '#D63539', d: 'M3 6h12M3 12h12M3 18h8M17 14l5 3-5 3z' },
  action_plan: {
    c: '#BF2E32',
    d: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  survey: {
    c: '#15801A',
    d: 'M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4',
  },
  quiz_blocking: { c: '#1D1650', d: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M10 16l1.5 1.5L14 15' },
}
export const BLOCK_TYPES = Object.keys(BLOCK_ICON) as BlockType[]

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

/** Sets the --c custom property a CSS rule reads. */
export const cvar = (c: string): CSSProperties => ({ '--c': c }) as CSSProperties

export function Grip() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {[7, 12, 17].flatMap((y) =>
        [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />),
      )}
    </svg>
  )
}

/* -------------------------------------------------------------- context */

export interface Cb {
  s: Strings
  lang: 'en' | 'ar'
  ar: boolean
  /** Picks the current-language text of a bilingual value, falling back to the other one. */
  t: (v: I18n) => string
  toast: (msg: string) => void
  /** Where dialogs mount: inside the .ds.pt root so the page's design tokens apply. */
  portal: HTMLElement | null
}
const CbContext = createContext<Cb | null>(null)

export function useCb(): Cb {
  const c = useContext(CbContext)
  if (!c) throw new Error('useCb outside <CbProvider>')
  return c
}

export function CbProvider({
  lang,
  portal,
  children,
}: {
  lang: 'en' | 'ar'
  portal: HTMLElement | null
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
  const value = useMemo<Cb>(() => {
    const ar = lang === 'ar'
    return {
      s: STRINGS[lang],
      lang,
      ar,
      toast,
      portal,
      t: (v) => (ar ? v.ar || v.en : v.en || v.ar),
    }
  }, [lang, toast, portal])
  return (
    <CbContext.Provider value={value}>
      {children}
      <div className="cb-toast-region" role="status" aria-live="polite">
        {msg ? (
          <div className="toast">
            <Ic d={PATH.check} size={18} w={2.4} />
            <span>{msg}</span>
          </div>
        ) : null}
      </div>
    </CbContext.Provider>
  )
}

/* -------------------------------------------------------------- dialogs */

/**
 * Modal shell. role="dialog" aria-modal="true" is what client/src/app/DialogManager.tsx keys on:
 * focus trap, Escape and backdrop click (through the close button), scroll lock, focus return.
 */
export function Dialog({
  eyebrow,
  title,
  onClose,
  onSubmit,
  children,
  footer,
  wide,
}: {
  eyebrow: string
  title: string
  onClose: () => void
  onSubmit?: () => void
  children: ReactNode
  footer: ReactNode
  wide?: boolean
}) {
  const { s, portal } = useCb()
  const id = useId()
  return createPortal(
    <div className="ovl">
      <div
        className={`dlg ${wide ? 'wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="dh">
          <div className="cb-dh-t">
            <span className="eyebrow">{eyebrow}</span>
            <h2 id={id}>{title}</h2>
          </div>
          <button type="button" className="xbtn" onClick={onClose} aria-label={s.close}>
            <Ic d={PATH.close} size={20} w={2.2} />
          </button>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            // React bubbles events through portals: a nested dialog must not submit its parent.
            e.preventDefault()
            e.stopPropagation()
            onSubmit?.()
          }}
        >
          <div className="db">{children}</div>
          <div className="df">{footer}</div>
        </form>
      </div>
    </div>,
    portal ?? document.body,
  )
}

export function ConfirmDialog({
  eyebrow,
  title,
  body,
  list,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
  hideConfirm,
}: {
  eyebrow: string
  title: string
  body: string
  list?: string[]
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
  hideConfirm?: boolean
}) {
  const { s } = useCb()
  return (
    <Dialog
      eyebrow={eyebrow}
      title={title}
      onClose={onClose}
      onSubmit={hideConfirm ? undefined : onConfirm}
      footer={
        <>
          <button type="button" className="btn btn-line" onClick={onClose}>
            {s.cancel}
          </button>
          {hideConfirm ? null : (
            <button type="submit" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>
              {confirmLabel}
            </button>
          )}
        </>
      }
    >
      <p>{body}</p>
      {list?.map((x) => (
        <div key={x} className="cb-check">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#15801A"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{x}</span>
        </div>
      ))}
    </Dialog>
  )
}

/* ------------------------------------------------------------- controls */

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode
  hint?: string
  error?: string | false
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`field ${className ?? ''}`}>
      <label className="lbl" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="err" id={htmlFor ? `${htmlFor}-err` : undefined}>
          {error}
        </span>
      ) : hint ? (
        <span className="hint">{hint}</span>
      ) : null}
    </div>
  )
}

export function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string
  hint?: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="tgr">
      <div className="tx">
        <b id={id}>{label}</b>
        {hint ? <span className="cap">{hint}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        className={`tgl ${on ? 'on' : ''}`}
        onClick={() => onChange(!on)}
      />
    </div>
  )
}

export function Select<T extends string>({
  id,
  value,
  onChange,
  options,
}: {
  id?: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="iw sel">
      <select id={id} className="inp" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="chev">
        <Ic d={PATH.chevron} size={18} />
      </span>
    </div>
  )
}

export function LangTabs({
  value,
  onChange,
  label,
}: {
  value: 'en' | 'ar'
  onChange: (l: 'en' | 'ar') => void
  label: string
}) {
  return (
    <div className="cb-langtabs">
      <span className="lbl">{label}</span>
      <div className="seg lite" role="group" aria-label={label}>
        {(['en', 'ar'] as const).map((l) => (
          <button
            key={l}
            type="button"
            className={value === l ? 'is-on' : ''}
            aria-pressed={value === l}
            onClick={() => onChange(l)}
          >
            {l === 'en' ? 'English' : 'العربية'}
          </button>
        ))}
      </div>
    </div>
  )
}

export function IconBtn({
  d,
  label,
  onClick,
  danger,
  disabled,
}: {
  d: string
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`cb-ib ${danger ? 'del' : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Ic d={d} size={16} />
    </button>
  )
}
