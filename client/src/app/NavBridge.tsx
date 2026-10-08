import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

/**
 * Routes the mockup's own navigation through the router: plain <a href="/…"> clicks (the ported
 * markup keeps real hrefs) and the "dct-nav" events the page logic dispatches. Same behaviour as
 * the clickable prototype's click interceptor.
 */
export function NavBridge() {
  const router = useRouter()
  useEffect(() => {
    const go = (href: string) => {
      const to = href.replace(/^#/, '')
      if (to.startsWith('/')) router.navigate({ href: to })
    }
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const href = a.getAttribute('href') ?? ''
      if (!(href.startsWith('/') && !href.startsWith('//')) && !href.startsWith('#/')) return
      e.preventDefault()
      go(href)
    }
    const onNav = (e: Event) => {
      const d = (e as CustomEvent<unknown>).detail
      if (typeof d === 'string') go(d)
    }
    document.addEventListener('click', onClick)
    window.addEventListener('dct-nav', onNav)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('dct-nav', onNav)
    }
  }, [router])
  return null
}
