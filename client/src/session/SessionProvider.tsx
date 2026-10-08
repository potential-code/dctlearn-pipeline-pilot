import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { type Account, accountFor } from '@/mock/accounts'

const KEY = 'dct.session'

export type SessionValue = {
  account: Account | null
  signIn: (email: string) => Account
  signOut: () => void
}

export const SessionContext = createContext<SessionValue | null>(null)

/** Reads the stored session synchronously, for route guards that run outside React. */
export function readSession(): Account | null {
  try {
    const email = window.localStorage.getItem(KEY)
    return email ? accountFor(email) : null
  } catch {
    return null
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(readSession)

  const signIn = useCallback((email: string) => {
    const a = accountFor(email)
    try {
      window.localStorage.setItem(KEY, a.email)
    } catch {
      // ignore
    }
    setAccount(a)
    return a
  }, [])

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      // ignore
    }
    setAccount(null)
  }, [])

  // The ported sign-in screens announce a successful sign-in with this event.
  useEffect(() => {
    const onSignIn = (e: Event) => {
      const email = (e as CustomEvent<string>).detail
      if (typeof email === 'string' && email) signIn(email)
    }
    window.addEventListener('dct-signin', onSignIn)
    return () => window.removeEventListener('dct-signin', onSignIn)
  }, [signIn])

  const value = useMemo(() => ({ account, signIn, signOut }), [account, signIn, signOut])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
