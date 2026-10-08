import { useEffect } from 'react'

const STRIPS = '.ptabs,[role="tablist"]'
const ACTIVE = '[aria-current="page"],[aria-current="true"],[aria-selected="true"],.on'

/** Marks overflowing tab strips (edge fade) and brings the active tab into view (mobile). */
function tidyStrips(root: ParentNode = document) {
  for (const strip of root.querySelectorAll<HTMLElement>(STRIPS)) {
    const over = strip.scrollWidth > strip.clientWidth + 2
    strip.classList.toggle('ovf', over && strip.classList.contains('ptabs'))
    if (!over) continue
    const cur = strip.querySelector<HTMLElement>(ACTIVE)
    if (!cur) continue
    const s = strip.getBoundingClientRect()
    const c = cur.getBoundingClientRect()
    if (c.left < s.left || c.right > s.right) {
      strip.scrollBy({ left: c.left + c.width / 2 - (s.left + s.width / 2), behavior: 'instant' })
    }
  }
}

/** Per-page document title from the page's main heading, e.g. "Sign in to DCT Learn · DCT Learn". */
function setTitle(pathname: string) {
  const h1 = [...document.querySelectorAll<HTMLElement>('h1')].find((h) => h.offsetParent !== null)
  const raw = (h1?.getAttribute('aria-label') || h1?.textContent || '').replace(/\s+/g, ' ').trim()
  document.title = pathname === '/' || !raw ? 'DCT Learn' : `${raw} · DCT Learn`
}

/** Page-level chrome that every route shares: document title and tab-strip behaviour. */
export function usePageChrome(pathname: string, lang: string) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the language changes the heading text
  useEffect(() => {
    const run = () => {
      setTitle(pathname)
      tidyStrips()
    }
    const t1 = window.setTimeout(run, 80)
    const t2 = window.setTimeout(run, 700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pathname, lang])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const strip = (e.target as Element | null)?.closest?.(STRIPS)
      if (strip) window.setTimeout(() => tidyStrips(strip.parentElement ?? document), 60)
    }
    const onResize = () => tidyStrips()
    document.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
    }
  }, [])
}
