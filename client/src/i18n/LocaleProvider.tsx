import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

export type Lang = 'en' | 'ar'
const KEY = 'dct.lang'

export type LocaleValue = {
  lang: Lang
  ar: boolean
  dir: 'ltr' | 'rtl'
  setLang: (lang: Lang) => void
  toggle: () => void
  /** Picks the English or Arabic string, like the mockup's L(en, ar). */
  L: (en: string, ar: string) => string
}

export const LocaleContext = createContext<LocaleValue | null>(null)

function initialLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    if (q === 'en' || q === 'ar') return q
    const stored = window.localStorage.getItem(KEY)
    if (stored === 'en' || stored === 'ar') return stored
  } catch {
    // storage blocked: fall through to the default
  }
  return 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(KEY, next)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const value = useMemo<LocaleValue>(() => {
    const ar = lang === 'ar'
    return {
      lang,
      ar,
      dir: ar ? 'rtl' : 'ltr',
      setLang,
      toggle: () => setLang(ar ? 'en' : 'ar'),
      L: (en, a) => (ar ? a : en),
    }
  }, [lang, setLang])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
