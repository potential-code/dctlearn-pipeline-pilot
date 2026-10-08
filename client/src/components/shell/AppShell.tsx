import { useRouterState } from '@tanstack/react-router'
import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react'
import { useLocale } from '@/i18n/useLocale'
import { useSession } from '@/session/useSession'
import type { ShellVals } from './shellHelper'

/**
 * The signed-in app shell (sidebar, top bar, mobile sheet, user menu). Same DOM as the mockup's
 * "copy verbatim" shell so dct-ds.css and portal.css apply unchanged; the checkbox-driven mobile
 * sheet and the <details> user menu are React-controlled and close on navigation, outside
 * click and Escape, as the clickable prototype does.
 */
export function AppShell({ sh, children }: { sh: ShellVals | undefined; children: ReactNode }) {
  const { toggle } = useLocale()
  const { signOut } = useSession()
  const [navOpen, setNavOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDetailsElement>(null)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // biome-ignore lint/correctness/useExhaustiveDependencies: close both on every navigation
  useEffect(() => {
    setNavOpen(false)
    setMenuOpen(false)
  }, [pathname])

  // Mobile nav sheet: Escape closes it, focus moves into it, and the page behind doesn't scroll.
  useEffect(() => {
    if (!navOpen) return
    const sheet = document.getElementById('dct-sb')
    sheet?.querySelector<HTMLElement>('nav a')?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setNavOpen(false)
      document.querySelector<HTMLElement>('.topb .navbtn')?.focus()
    }
    document.documentElement.classList.add('nav-open')
    document.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('nav-open')
      document.removeEventListener('keydown', onKey)
    }
  }, [navOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuRef.current?.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  if (!sh) return <>{children}</>

  return (
    <div className="app">
      <input
        type="checkbox"
        id="dct-nav-cb"
        className="nav-cb"
        aria-hidden="true"
        tabIndex={-1}
        checked={navOpen}
        onChange={(e) => setNavOpen(e.currentTarget.checked)}
      />
      <aside className="sb" id="dct-sb" aria-label={sh.navLabel}>
        <div className="patD fade-b" aria-hidden="true" />
        <div className="brand">
          <a href="/" className="logo" aria-label="DCT Learn">
            <img src="/_blob/b9eccf73abbba8b88c76e30f5d924545" alt="DCT Learn" />
          </a>
        </div>
        {sh.hasSite ? (
          <a
            href="/platforms"
            className="msw"
            style={{ '--ac': sh.siteColor } as React.CSSProperties}
          >
            <span className="sw" aria-hidden="true" />
            <span className="t">
              <small>{sh.siteLabel}</small>
              <b>{sh.siteName}</b>
            </span>
            <svg
              className="flip"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        ) : null}
        <nav aria-label={sh.navLabel}>
          {sh.nav.map((n, i) => (
            <Fragment key={n.key || `g-${n.label}-${i}`}>
              {n.group ? <div className="ng">{n.label}</div> : null}
              {n.link ? (
                <a
                  href={n.href}
                  className={`ni ${n.cls}`}
                  aria-current={n.cur === 'page' ? 'page' : undefined}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={n.d} />
                  </svg>
                  <span>{n.label}</span>
                  {n.cnt ? <span className="cnt">{n.cnt}</span> : null}
                </a>
              ) : null}
            </Fragment>
          ))}
        </nav>
        <div className="foot">
          <span className="av">{sh.initials}</span>
          <span className="t">
            <b>{sh.userName}</b>
            <span>{sh.roleLabel}</span>
          </span>
        </div>
      </aside>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: the scrim is the checkbox-driven sheet backdrop, as in the mockup */}
      <label htmlFor="dct-nav-cb" className="sb-scrim" aria-hidden="true" />
      <div className="mainc">
        <header className="topb">
          <button
            type="button"
            className="navbtn"
            title={sh.menuAria}
            aria-label={sh.menuAria}
            aria-expanded={navOpen}
            aria-controls="dct-sb"
            onClick={() => setNavOpen((o) => !o)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
          <nav className="crumbs" aria-label="Breadcrumb">
            {sh.crumbs.map((c) => (
              <Fragment key={`${c.label}-${c.last}`}>
                {c.href ? (
                  <>
                    <a href={c.href}>{c.label}</a>
                    <span className="sep" aria-hidden="true" />
                  </>
                ) : null}
                {c.last ? <b aria-current="page">{c.label}</b> : null}
              </Fragment>
            ))}
          </nav>
          <div className="tools">
            <button type="button" className="tl" onClick={toggle} aria-label={sh.langAria}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
              </svg>
              {sh.langLabel}
            </button>
            <a href={sh.notifHref} className="tl" aria-label={sh.notifAria}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
              <span className="dot" />
            </a>
            <details
              className="me-d"
              ref={menuRef}
              open={menuOpen}
              onToggle={(e) => setMenuOpen(e.currentTarget.open)}
            >
              <summary className="me" aria-label={sh.meAria}>
                <span className="av">{sh.initials}</span>
                <span className="t">
                  <b>{sh.userName}</b>
                  <span>{sh.userSub}</span>
                </span>
                <svg
                  className="chev"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="me-m">
                <a href={sh.profileHref}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  </svg>
                  {sh.meProfile}
                </a>
                <a href={sh.notifHref}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                  {sh.notifAria}
                </a>
                <a href="/login" className="so" onClick={() => signOut()}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  {sh.meOut}
                </a>
              </div>
            </details>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
