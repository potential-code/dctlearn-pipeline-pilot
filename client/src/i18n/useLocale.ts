import { useContext } from 'react'
import { LocaleContext, type LocaleValue } from './LocaleProvider'

export function useLocale(): LocaleValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>')
  return ctx
}
