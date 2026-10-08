import { type CSSProperties, useEffect, useLayoutEffect, useReducer, useRef } from 'react'
import { useLocale } from '@/i18n/useLocale'

// biome-ignore lint/suspicious/noExplicitAny: ported mockup logic is untyped
type AnyRecord = Record<string, any>

/**
 * Minimal stand-in for the Claude Design runtime's DCLogic base class, so each artboard's logic
 * class runs unchanged: props, state, setState (merging), forceUpdate and React-style
 * lifecycle hooks. `setState({ locale })` is routed to the app-wide locale instead of page state.
 */
export class DCLogic {
  props: AnyRecord
  state: AnyRecord = {}
  _force?: () => void
  _mounted = false
  _setLocale?: (lang: 'en' | 'ar') => void

  constructor(props: AnyRecord) {
    this.props = props
  }

  setState(patch: AnyRecord | ((s: AnyRecord, p: AnyRecord) => AnyRecord | null), cb?: () => void) {
    const next = typeof patch === 'function' ? patch(this.state, this.props) : patch
    if (!next) return
    let rest = next
    if ('locale' in next) {
      const { locale, ...others } = next
      if (locale === 'en' || locale === 'ar') this._setLocale?.(locale)
      rest = others
    }
    this.state = { ...this.state, ...rest }
    if (this._mounted) this._force?.()
    if (cb) queueMicrotask(cb)
  }

  forceUpdate() {
    if (this._mounted) this._force?.()
  }

  componentDidMount?(): void
  componentWillUnmount?(): void
  componentDidUpdate?(prevProps: AnyRecord, prevState: AnyRecord): void
  renderVals?(): AnyRecord
}

type LogicClass = new (props: AnyRecord) => DCLogic

/** Runs a ported DCLogic class inside a function component and returns its renderVals(). */
export function useDC(Logic: LogicClass, props: AnyRecord): AnyRecord {
  const { lang, setLang } = useLocale()
  const [, force] = useReducer((x: number) => x + 1, 0)
  const ref = useRef<DCLogic | null>(null)
  const fullProps = { ...props, locale: lang, proto: true }
  if (!ref.current) ref.current = new Logic(fullProps)
  const inst = ref.current
  const prev = useRef<{ props: AnyRecord; state: AnyRecord } | null>(null)
  inst.props = fullProps
  inst._force = force
  inst._setLocale = setLang

  useLayoutEffect(() => {
    inst._mounted = true
    inst.componentDidMount?.()
    return () => {
      inst._mounted = false
      inst.componentWillUnmount?.()
    }
  }, [inst])

  useEffect(() => {
    if (prev.current && inst.componentDidUpdate)
      inst.componentDidUpdate(prev.current.props, prev.current.state)
    prev.current = { props: inst.props, state: inst.state }
  })

  return inst.renderVals?.() ?? {}
}

/** String form of a hole value the way the mockup runtime prints it. */
export function s(x: unknown): string {
  return x === undefined || x === null || x === false ? '' : String(x)
}

/** Iterable form of a list hole. */
// biome-ignore lint/suspicious/noExplicitAny: list items come from the untyped mockup logic
export function arr(x: unknown): any[] {
  return Array.isArray(x) ? x : []
}

/** Inline style with CSS custom properties (--ac, --c …), typed for React. */
export function sx(o: Record<string, string>): CSSProperties {
  return o as CSSProperties
}

export function noop() {}
