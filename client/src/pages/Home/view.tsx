// client: hand-edited landing page (rebuilt from the Claude Design artboard Home). Do not regenerate.
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { arr as $arr, s as $s, sx as $sx } from '@/dc/runtime'
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { CountUp } from '@/lib/motion/CountUp'
import { introDelay } from '@/lib/motion/intro'
import { RevealText } from '@/lib/motion/RevealText'
import { Tilt } from '@/lib/motion/Tilt'

// biome-ignore lint/suspicious/noExplicitAny: values come from the ported, untyped mockup logic
type V = any

const Arrow = ({ size = 16, w = 2.2 }: { size?: number; w?: number }) => (
  <svg
    className="flip"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const Ext = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
)

const Ic = {
  level: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="14" width="4" height="7" rx="1" />
      <rect x="10" y="9" width="4" height="12" rx="1" />
      <rect x="17" y="4" width="4" height="17" rx="1" opacity=".35" />
    </svg>
  ),
  clock: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  units: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  ),
  pin: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  play: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="7 4 20 12 7 20" />
    </svg>
  ),
  hand: (
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
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10" />
      <path d="M12 10V4.5a1.5 1.5 0 0 1 3 0V10" />
      <path d="M15 10V6.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L3.6 15.9a1.6 1.6 0 0 1 2.4-2.1L9 16" />
    </svg>
  ),
}

/** Landing header: transparent over the hero, solid once scrolled, tracks the current section. */
function Header({ v }: { v: V }) {
  const [solid, setSolid] = useState(false)
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const ids: string[] = $arr(v.nav).map((n: V) => n.id)
  const idKey = ids.join(',')

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 24)
      const mid = window.innerHeight * 0.35
      let cur = ''
      for (const id of idKey.split(',')) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= mid) cur = id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [idKey])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])

  return (
    <header className={`lh ${solid || open ? 'solid' : ''}`}>
      <div className="wrap">
        <a href="/" className="logo-tile" aria-label="DCT Learn home">
          <img
            src="/_blob/b9eccf73abbba8b88c76e30f5d924545"
            alt="DCT Learn"
            style={{ height: '30px', width: 'auto' }}
          />
        </a>
        <nav className="lnav" aria-label="Main">
          {$arr(v.nav).map((n: V) => (
            <a
              key={n.id}
              href={n.href}
              className={active === n.id ? 'on' : ''}
              aria-current={active === n.id ? 'true' : undefined}
            >
              {n.l}
              {active === n.id ? (
                <motion.span
                  layoutId="lnav-dot"
                  className="ldot"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              ) : null}
            </a>
          ))}
        </nav>
        <div className="lacts">
          <button
            type="button"
            className="btn btn-glass btn-sm"
            onClick={v.toggleLang}
            aria-label="Switch language"
          >
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
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {v.langLabel}
          </button>
          <a href="/login" className="btn btn-primary btn-sm lsign">
            {v.t?.signIn}
          </a>
          <button
            type="button"
            className="lburger"
            aria-label={open ? v.t?.close : v.t?.menu}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className={open ? 'x' : ''} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open ? (
          <motion.nav
            className="lsheet"
            aria-label="Main"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {$arr(v.nav).map((n: V, i: number) => (
              <motion.a
                key={n.id}
                href={n.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                {n.l}
                <Arrow />
              </motion.a>
            ))}
            <a href="/login" className="btn btn-primary">
              {v.t?.signIn}
            </a>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

/** GSAP choreography for the landing: hero load, section reveals, How-it-works restart. */
function useLandingMotion(root: React.RefObject<HTMLDivElement | null>, v: V) {
  const vRef = useRef(v)
  vRef.current = v
  useGSAP(
    () => {
      const how = root.current?.querySelector('#how')
      if (how) {
        ScrollTrigger.create({
          trigger: how,
          start: 'top 65%',
          end: 'bottom 35%',
          onEnter: () => vRef.current.howEnter(),
          onEnterBack: () => vRef.current.howEnter(),
          onLeave: () => vRef.current.howLeave(),
          onLeaveBack: () => vRef.current.howLeave(),
        })
      }
      if (prefersReducedMotion()) return
      const d = introDelay()
      gsap.from('.hx .hx-in', {
        y: 26,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.09,
        delay: d + 0.45,
      })
      gsap.from('.hx .mosaic .tile', {
        opacity: 0,
        scale: 0.6,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.08,
        delay: d + 0.2,
        clearProps: 'scale,opacity',
      })
      gsap.to('.hx .hbg img', {
        yPercent: 12,
        scale: 1.06,
        ease: 'none',
        scrollTrigger: { trigger: '.hx', start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hx .copy', {
        y: -60,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: '.hx', start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hx .mosaic', {
        y: -110,
        ease: 'none',
        scrollTrigger: { trigger: '.hx', start: 'top top', end: 'bottom top', scrub: true },
      })
      // Section copy and cards rise in as they arrive, in small staggered batches.
      gsap.set('[data-rv]', { opacity: 0, y: 46 })
      ScrollTrigger.batch('[data-rv]', {
        start: 'top 90%',
        once: true,
        onEnter: (els) => {
          // Cards already scrolled past (a jump via the nav) appear at once; only the ones
          // on screen stagger in, so nothing queues behind off-screen siblings.
          const passed = els.filter((e) => e.getBoundingClientRect().bottom < 0)
          const shown = els.filter((e) => e.getBoundingClientRect().bottom >= 0)
          if (passed.length) gsap.set(passed, { opacity: 1, y: 0, overwrite: true })
          gsap.to(shown, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.09,
            overwrite: true,
          })
        },
      })
      gsap.utils.toArray<HTMLElement>('.eyebrow').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          x: -16,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      })
      gsap.utils.toArray<HTMLElement>('.pbg img').forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: img.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
      })
      // Layout settles as images load; keep trigger positions honest.
      const imgs = root.current?.querySelectorAll('img') ?? []
      let pending = 0
      const done = () => {
        pending -= 1
        if (pending === 0) ScrollTrigger.refresh()
      }
      for (const im of imgs) {
        if (!(im as HTMLImageElement).complete) {
          pending += 1
          im.addEventListener('load', done, { once: true })
        }
      }
    },
    { scope: root },
  )
}

export default function View({ v }: { v: V }) {
  const root = useRef<HTMLDivElement>(null)
  useLandingMotion(root, v)
  const ev = $arr(v.events)
  const evMain = ev[0]
  const evRest = ev.slice(1)
  const courses = $arr(v.courses)
  const big = courses[0]
  const rest = courses.slice(1)

  return (
    <div className="pgs-Home" ref={root}>
      <div className={`ds hm gs ${$s(v.protoCls)}`} dir={v.dir} lang={v.lang}>
        <a className="skip" href="#main">
          {v.t?.skip}
        </a>
        <Header v={v} />
        <section className="hx" id="top" onMouseMove={v.heroMove} onMouseLeave={v.heroLeave}>
          <div className="hbg" aria-hidden="true">
            <img src="/_blob/eb80e68b5f407df8f3c317956007a5a2" alt="" />
          </div>
          <div className="wrap inner">
            <div className="copy">
              <a href="/elevate" className="kick hx-in">
                <b>{v.t?.kNew}</b>
                <span>{v.t?.kicker}</span>
                <Arrow size={14} w={2.4} />
              </a>
              <RevealText
                as="h1"
                text={v.t?.h1}
                hl={v.t?.hlWords}
                on="load"
                delay={introDelay() + 0.15}
                stagger={0.08}
              />
              <p className="sub hx-in">{v.t?.sub}</p>
              <div className="cta-row hx-in">
                <a href="/login" className="btn btn-primary btn-hero">
                  {v.t?.signIn}
                  <Arrow size={18} w={2.4} />
                </a>
                <a href="#programmes" className="btn btn-line-w">
                  {v.t?.explore}
                </a>
              </div>
              <div className="hfacts hx-in">
                <div>
                  <b>9</b>
                  <span>{v.t?.hf1}</span>
                </div>
                <div>
                  <b>23</b>
                  <span>{v.t?.hf2}</span>
                </div>
                <div>
                  <b>EN · ع</b>
                  <span>{v.t?.hf3}</span>
                </div>
              </div>
            </div>
            <div className="mosaic" aria-hidden="true">
              <div className="tile t-a">
                {$arr(v.tA).map((m: V, i: number) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed image rotation
                  <img key={i} src={m?.src} className={$s(m?.cls)} alt="" />
                ))}
              </div>
              <div className="tile s-q1" />
              <div className="tile t-b">
                {$arr(v.tB).map((m: V, i: number) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed image rotation
                  <img key={i} src={m?.src} className={$s(m?.cls)} alt="" />
                ))}
              </div>
              <div className="tile s-d1">
                <i />
              </div>
              <div className="tile t-c">
                {$arr(v.tC).map((m: V, i: number) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed image rotation
                  <img key={i} src={m?.src} className={$s(m?.cls)} alt="" />
                ))}
              </div>
              <div className="tile s-c1" />
              <div className="tile t-d">
                {$arr(v.tD).map((m: V, i: number) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed image rotation
                  <img key={i} src={m?.src} className={$s(m?.cls)} alt="" />
                ))}
              </div>
              <div className="tile s-q2" />
              <div className="tile s-q3" />
            </div>
          </div>
          <a href="#stats" className="hscroll" aria-label="Scroll">
            <i />
          </a>
        </section>
        <main id="main">
          <section className="stats pat pd pa" id="stats">
            <svg
              className="motif"
              viewBox="0 0 180 180"
              style={{ top: '0', insetInlineEnd: '0' }}
              aria-hidden="true"
            >
              <path className="m" d="M0 60 A60 60 0 0 1 60 0 V60 Z" fill="#1D1650" />
              <rect
                className="m d"
                x="81"
                y="9"
                width="42"
                height="42"
                transform="rotate(45 102 30)"
              />
              <path className="m" d="M120 0 H180 V60 A60 60 0 0 1 120 0 Z" fill="#F77860" />
              <rect
                className="m"
                x="9"
                y="81"
                width="42"
                height="42"
                fill="#E3DCD3"
                transform="rotate(45 30 102)"
              />
              <path className="m" d="M0 120 H60 A60 60 0 0 1 0 180 Z" fill="#CD3151" />
            </svg>
            <div className="wrap">
              <div className="head">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span className="eyebrow">{v.t?.statsEy}</span>
                  <RevealText text={v.t?.statsTitle} />
                </div>
                <p className="hsub" data-rv="">
                  {v.t?.statsSub}
                </p>
              </div>
              <div className="srow">
                {[v.s0, v.s1, v.s2, v.s3].map((s: V, i: number) => (
                  <div className="sc" data-rv="" key={s?.ix}>
                    <div className="ix">
                      <span>{s?.ix}</span>
                      <span>{s?.tag}</span>
                    </div>
                    {i === 0 ? (
                      <div className="ph p-prog" aria-hidden="true">
                        {$arr(v.progImgs).map((m: V) => (
                          <img key={m?.i} src={m?.src} alt="" />
                        ))}
                      </div>
                    ) : null}
                    {i === 1 ? (
                      <div className="ph p-course" aria-hidden="true">
                        {$arr(v.courseImgs).map((m: V) => (
                          <span
                            key={m?.i}
                            className="cv"
                            style={$sx({ '--i': `${$s(m?.i)}`, '--r': `${$s(m?.r)}` })}
                          >
                            <img src={m?.src} alt="" />
                          </span>
                        ))}
                        <span className="lng">EN · ع</span>
                      </div>
                    ) : null}
                    {i === 2 ? (
                      <div className="ph p-mentor" aria-hidden="true">
                        <img src="/_blob/9842ff4b5522772462642e07bfb6d8c1" alt="" />
                      </div>
                    ) : null}
                    {i === 3 ? (
                      <div className="ph p-cert" aria-hidden="true">
                        <span
                          className="c1"
                          style={{
                            backgroundImage: 'url(/_blob/a08dcc0e73027985e0c330d26c246a01)',
                          }}
                        />
                        <span
                          className="c2"
                          style={{
                            backgroundImage: 'url(/_blob/bb705401394f18f4059a3d2fb23a902e)',
                          }}
                        />
                      </div>
                    ) : null}
                    <div className="v">
                      <CountUp to={s?.n ?? 0} locale={s?.loc} />
                      <small>{s?.plus}</small>
                    </div>
                    <div className="lb">{s?.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="sec prog pat pb" id="programmes">
            <svg
              className="motif sm"
              viewBox="0 0 180 180"
              style={{ top: '40px', insetInlineEnd: '40px' }}
              aria-hidden="true"
            >
              <path className="m" d="M0 60 A60 60 0 0 1 60 0 V60 Z" fill="#3B2F92" />
              <rect
                className="m d"
                x="81"
                y="9"
                width="42"
                height="42"
                transform="rotate(45 102 30)"
              />
              <path className="m" d="M120 0 H180 V60 A60 60 0 0 1 120 0 Z" fill="#F77860" />
              <rect
                className="m"
                x="9"
                y="81"
                width="42"
                height="42"
                fill="#E3DCD3"
                transform="rotate(45 30 102)"
              />
              <path className="m" d="M0 120 H60 A60 60 0 0 1 0 180 Z" fill="#EE3E43" />
            </svg>
            <div className="wrap">
              <div className="sh">
                <div className="l">
                  <span className="eyebrow">{v.t?.progEy}</span>
                  <RevealText text={v.t?.progTitle} />
                  <p className="lead" data-rv="">
                    {v.t?.progSub}
                  </p>
                </div>
                <div className="pctl" data-rv="">
                  <span className="cnt">
                    <b>{v.pIdx}</b>
                    {' / '}
                    {v.pTot}
                  </span>
                  <button type="button" className="arrb" aria-label={v.t?.prev} onClick={v.prevP}>
                    <svg
                      className="flip"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>
                  <button type="button" className="arrb" aria-label={v.t?.next} onClick={v.nextP}>
                    <Arrow size={20} w={2} />
                  </button>
                </div>
              </div>
              <div className="acc-hint" data-rv="">
                <span className="hand">{Ic.hand}</span>
                <span className="on-hover">{v.t?.hoverHint}</span>
                <span className="on-touch">{v.t?.tapHint}</span>
                <span className="dots" aria-hidden="true">
                  {$arr(v.panels).map((p: V, i: number) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: one dot per panel
                    <i key={i} className={$s(p?.cls)} />
                  ))}
                </span>
              </div>
              <div className="acc" role="list" data-rv="" onMouseLeave={v.panelReset}>
                {$arr(v.panels).map((p: V, p$i: number) => (
                  <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed panel list
                    key={p$i}
                    type="button"
                    className={`pn ${$s(p?.cls)}`}
                    role="listitem"
                    aria-expanded={p?.exp}
                    aria-label={p?.name}
                    onClick={p?.pick}
                    onMouseEnter={p?.pick}
                    onFocus={p?.pick}
                  >
                    <img src={p?.img} alt="" /> <span className="shade" />
                    <span className="acc-bar" style={{ background: `${$s(p?.accent)}` }} />
                    <span className="nm">{p?.n}</span>
                    <span className="peek" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                    </span>
                    <span className="mode">
                      <span className="dia" style={{ color: `${$s(p?.accent)}` }} />
                      {p?.mode}
                    </span>
                    <span className="vlabel">{p?.name}</span>
                    <span className="body">
                      <span className="eyebrow" style={{ color: '#fff', opacity: '.85' }}>
                        {p?.n}
                        {' · '}
                        {p?.sub}
                      </span>
                      <h3>{p?.name}</h3> <p>{p?.desc}</p>
                      <span className="tags">
                        {$arr(p?.tags).map((g: V) => (
                          <span key={g}>
                            <span className="dia" style={{ color: `${$s(p?.accent)}` }} />
                            {g}
                          </span>
                        ))}
                      </span>
                      <span
                        className="ulink"
                        style={{ marginTop: '6px', alignSelf: 'flex-start', color: '#fff' }}
                      >
                        {p?.cta}
                        <Arrow />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className={`sec how pat pd pa ${$s(v.howCls)}`} id="how">
            <svg
              className="motif sm"
              viewBox="0 0 180 180"
              style={{ top: '0', insetInlineEnd: '0' }}
              aria-hidden="true"
            >
              <path className="m" d="M0 60 A60 60 0 0 1 60 0 V60 Z" fill="#EE3E43" />
              <rect
                className="m d"
                x="81"
                y="9"
                width="42"
                height="42"
                transform="rotate(45 102 30)"
              />
              <path className="m" d="M120 0 H180 V60 A60 60 0 0 1 120 0 Z" fill="#F77860" />
              <rect
                className="m"
                x="9"
                y="81"
                width="42"
                height="42"
                fill="#E3DCD3"
                transform="rotate(45 30 102)"
              />
              <path className="m" d="M0 120 H60 A60 60 0 0 1 0 180 Z" fill="#CD3151" />
            </svg>
            <div className="wrap">
              <div className="sh">
                <div className="l">
                  <span className="eyebrow">{v.t?.howEy}</span>
                  <RevealText text={v.t?.howTitle} />
                </div>
                <p className="hsub" data-rv="">
                  {v.t?.howSub}
                </p>
              </div>
              <div className="tabs4" role="tablist" aria-label={v.t?.howEy}>
                {$arr(v.steps).map((s: V, s$i: number) => (
                  <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: four fixed steps
                    key={s$i}
                    type="button"
                    role="tab"
                    className={`tb ${$s(s?.cls)}`}
                    aria-selected={s?.on}
                    onClick={s?.pick}
                    data-rv=""
                  >
                    <span className="pbar">
                      {s?.active ? <i key={v.howRun} onAnimationEnd={v.nextStep} /> : null}
                    </span>
                    <span className="n">{s?.n}</span>
                    <span className="tt">{s?.t}</span>
                  </button>
                ))}
              </div>
              <div className="stagew" onMouseEnter={v.pauseHow} onMouseLeave={v.resumeHow}>
                <div className="dpanel" role="tabpanel">
                  {$arr(v.curStep).map((c: V) => (
                    <Fragment key={c?.k}>
                      <span className="eyebrow" style={{ color: '#FFB4AC' }}>
                        {c?.k}
                      </span>
                      <h3>{c?.t}</h3> <p>{c?.b}</p>
                      <ul>
                        {$arr(c?.l).map((x: V) => (
                          <li key={x}>
                            <span className="dia" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    </Fragment>
                  ))}
                </div>
                <div onMouseMove={v.tiltB} onMouseLeave={v.untiltB} aria-hidden="true" data-rv="">
                  <div className="bmock">
                    <div className="bbar">
                      <i />
                      <i />
                      <i />
                      <span className="url">{v.url}</span>
                    </div>
                    <div className="bscr">
                      {' '}
                      <div
                        className={`bv ${$s(v.bv0)}`}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
                      >
                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                          <img
                            src="/_blob/a39ca3b3c0fdaf9dcd07000a3da4c090"
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: '0',
                              background: 'rgba(29,22,80,.45)',
                            }}
                          />
                        </div>{' '}
                        <div
                          style={{
                            padding: '36px 30px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            background: '#fff',
                          }}
                        >
                          <img
                            src="/_blob/b9eccf73abbba8b88c76e30f5d924545"
                            alt=""
                            style={{ height: '26px', width: 'auto', alignSelf: 'flex-start' }}
                          />{' '}
                          <strong style={{ fontSize: '1.375rem', marginTop: '6px' }}>
                            {v.t?.ph0t}
                          </strong>{' '}
                          <span className="cap">{v.t?.ph0s}</span>{' '}
                          <div
                            style={{
                              height: '44px',
                              border: '2px solid #D63539',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 12px',
                              fontSize: '.875rem',
                            }}
                            dir="ltr"
                          >
                            saeed.h@dctabudhabi.ae
                            <span className="caret" />
                          </div>{' '}
                          <div
                            style={{
                              height: '44px',
                              border: '2px solid var(--line)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 12px',
                              letterSpacing: '.3em',
                            }}
                            dir="ltr"
                          >
                            ••••••••••
                          </div>{' '}
                          <div
                            style={{
                              height: '46px',
                              borderRadius: '10px',
                              background: '#D63539',
                              color: '#fff',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: '600',
                              fontSize: '.9375rem',
                            }}
                          >
                            {v.t?.signIn}
                          </div>
                        </div>
                      </div>{' '}
                      <div
                        className={`bv ${$s(v.bv1)}`}
                        style={{
                          padding: '26px 28px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '18px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <strong style={{ fontSize: '1.25rem' }}>{v.t?.ph1t}</strong>
                          <span className="cap">Saeed Al Hammadi</span>
                        </div>{' '}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3,1fr)',
                            gap: '14px',
                          }}
                        >
                          {$arr(v.hubs).map((h, h$i) => (
                            <Fragment key={h$i}>
                              <div className="hubc" style={{}}>
                                <img src={h?.img} alt="" />
                                <div className="b">
                                  <strong style={{ fontSize: '.875rem' }}>{h?.n}</strong>
                                  <div className="bar6">
                                    <i
                                      style={{ width: `${$s(h?.p)}`, background: `${$s(h?.c)}` }}
                                    />
                                  </div>
                                  <span className="cap">{h?.pl}</span>
                                </div>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </div>{' '}
                      <div
                        className={`bv ${$s(v.bv2)}`}
                        style={{ display: 'grid', gridTemplateColumns: '200px 1fr' }}
                      >
                        <div
                          style={{
                            background: '#fff',
                            borderInlineEnd: '1px solid var(--line)',
                            padding: '18px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <span className="cap" style={{ fontWeight: '700', marginBottom: '6px' }}>
                            DCT World
                          </span>{' '}
                          {$arr(v.outline).map((o, o$i) => (
                            <Fragment key={o$i}>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  alignItems: 'center',
                                  fontSize: '.8125rem',
                                  padding: '8px',
                                }}
                              >
                                <span
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    flex: 'none',
                                  }}
                                />
                                {o?.t}
                              </div>
                            </Fragment>
                          ))}
                        </div>{' '}
                        <div
                          style={{
                            padding: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          <div
                            style={{ height: '230px', position: 'relative', overflow: 'hidden' }}
                          >
                            <img
                              src="/_blob/fa500a874150b2a1769785936a6d7785"
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: '0',
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              <span
                                style={{
                                  width: '58px',
                                  height: '58px',
                                  borderRadius: '50%',
                                  background: '#fff',
                                  display: 'grid',
                                  placeItems: 'center',
                                  boxShadow: '0 10px 30px rgba(0,0,0,.35)',
                                }}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#D63539">
                                  <polygon points="7 4 20 12 7 20" />
                                </svg>
                              </span>
                            </div>
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '0',
                                insetInline: '0',
                                height: '4px',
                                background: 'rgba(255,255,255,.4)',
                              }}
                            >
                              <i
                                style={{
                                  display: 'block',
                                  height: '100%',
                                  width: '62%',
                                  background: '#D63539',
                                }}
                              />
                            </div>
                          </div>{' '}
                          <span className="cap">{v.t?.ph2u}</span>
                          <strong style={{ fontSize: '1.125rem' }}>{v.t?.ph2t}</strong>
                        </div>
                      </div>{' '}
                      <div
                        className={`bv ${$s(v.bv3)}`}
                        style={{ display: 'grid', placeItems: 'center', background: '#F1EDE8' }}
                      >
                        <div
                          style={{
                            width: '520px',
                            maxWidth: '88%',
                            aspectRatio: '1.414',
                            background:
                              '#fff url(/_blob/470b14c6b2877a4912c03c8b902044b2) center/cover',
                            boxShadow: '0 24px 50px -20px rgba(0,0,0,.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingBottom: '24px',
                            textAlign: 'center',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              background: '#fff',
                              padding: '10px 22px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              alignItems: 'center',
                            }}
                          >
                            <strong style={{ fontSize: '1.25rem', color: '#1D1650' }}>
                              Saeed Al Hammadi
                            </strong>
                            <span className="cap">DCT World · 06 Oct 2026</span>
                          </div>{' '}
                          <span
                            style={{
                              position: 'absolute',
                              top: '16px',
                              insetInlineEnd: '16px',
                              background: '#2FBF71',
                              color: '#fff',
                              fontSize: '.6875rem',
                              fontWeight: '800',
                              padding: '4px 10px',
                              textTransform: 'uppercase',
                              letterSpacing: '.08em',
                            }}
                          >
                            {'+50 '}
                            {v.t?.pts}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="sec courses" id="courses">
            <div className="cblob b1" aria-hidden="true" />
            <div className="cblob b2" aria-hidden="true" />
            <div className="wrap">
              <div className="sh">
                <div className="l">
                  <span className="eyebrow">{v.t?.cEy}</span>
                  <RevealText text={v.t?.cTitle} />
                  <p className="lead" data-rv="">
                    {v.t?.cSub}
                  </p>
                </div>
                <a href="/login" className="pill-link" data-rv="">
                  {v.t?.cAll}
                  <span className="pa">
                    <Arrow />
                  </span>
                </a>
              </div>
              <div className="cgrid2">
                {big ? (
                  <div data-rv="" className="cbig-w">
                    <Tilt href="/login" className="cbig" max={4}>
                      <span className="pbg">
                        <img src={big.img} alt="" />
                      </span>
                      <span className="cbig-ov" />
                      {big.mand ? <span className="sticker">{v.t?.mandatory}</span> : null}
                      <span className="cbig-b">
                        <span className="chip">
                          <span className="dia" style={{ color: '#F7C337' }} />
                          {big.cat}
                        </span>
                        <h3>{big.title}</h3>
                        <span className="desc">{big.desc}</span>
                        <span className="cmeta glass">
                          <span>
                            {Ic.level}
                            {big.level}
                          </span>
                          <span>
                            {Ic.clock}
                            {big.min}
                          </span>
                          <span>
                            {Ic.units}
                            {big.units}
                          </span>
                        </span>
                        <span className="cbig-f">
                          <span className="btn btn-primary cgo">
                            {Ic.play}
                            {v.t?.startC}
                          </span>
                          <span className="hub">
                            <i style={{ background: big.hc }} />
                            {big.where}
                          </span>
                        </span>
                      </span>
                    </Tilt>
                  </div>
                ) : null}
                {rest.map((c: V) => (
                  <div data-rv="" key={c.title} className="ccw">
                    <Tilt href="/login" className="ccard2">
                      <span className="cm">
                        <img src={c.img} alt="" />
                        <span className="chip glass">{c.cat}</span>
                        {c.mand ? <span className="sticker sm">{v.t?.mandatory}</span> : null}
                        <span className="play">{Ic.play}</span>
                      </span>
                      <span className="cb">
                        <h3>{c.title}</h3>
                        <span className="cmeta">
                          <span>
                            {Ic.level}
                            {c.level}
                          </span>
                          <span>
                            {Ic.clock}
                            {c.min}
                          </span>
                          <span>
                            {Ic.units}
                            {c.units}
                          </span>
                        </span>
                        <span className="cf">
                          <span className="hub">
                            <i style={{ background: c.hc }} />
                            {c.where}
                          </span>
                          <span className="go">
                            <Arrow />
                          </span>
                        </span>
                      </span>
                    </Tilt>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="sec aud pat pa" id="audience">
            <div className="wrap">
              <div className="sh">
                <div className="l">
                  <span className="eyebrow">{v.t?.audEy}</span>
                  <RevealText text={v.t?.audTitle} />
                </div>
              </div>
              <div className="aud2">
                <a href="/professionals" className="ac a1" data-rv="">
                  <img src="/_blob/92c83a667e1befe5661dab8c7ebca349" alt="" />
                  <span
                    className="ov"
                    style={{
                      background:
                        'linear-gradient(180deg,rgba(191,46,50,.1) 20%,rgba(191,46,50,.95))',
                    }}
                  />
                  <span className="lab">
                    <span className="dia" style={{ color: '#F7C337' }} />
                    {v.t?.empChip}
                  </span>
                  <h3>{v.t?.empT}</h3>
                  <p>{v.t?.empB}</p>
                  <ul>
                    {$arr(v.t?.empL).map((x: V) => (
                      <li key={x}>
                        <span className="dia" style={{ color: '#F7C337' }} />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <span className="ulink">
                    {v.t?.empCta}
                    <Arrow w={2.4} />
                  </span>
                </a>
                <a href="/students" className="ac a2" data-rv="">
                  <img src="/_blob/40780df486810d248ab2ca9a23d58dcb" alt="" />
                  <span
                    className="ov"
                    style={{
                      background:
                        'linear-gradient(180deg,rgba(45,36,112,.1) 20%,rgba(45,36,112,.95))',
                    }}
                  />
                  <span className="lab">
                    <span className="dia" style={{ color: '#F77860' }} />
                    {v.t?.stuChip}
                  </span>
                  <h3>{v.t?.stuT}</h3>
                  <p>{v.t?.stuB}</p>
                  <ul>
                    {$arr(v.t?.stuL).map((x: V) => (
                      <li key={x}>
                        <span className="dia" style={{ color: '#F77860' }} />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <span className="ulink">
                    {v.t?.stuCta}
                    <Arrow w={2.4} />
                  </span>
                </a>
              </div>
            </div>
          </section>

          <section className="sec ev2" id="events">
            <div className="evglow" aria-hidden="true" />
            <div className="wrap">
              <div className="sh">
                <div className="l">
                  <span className="eyebrow">{v.t?.evEy}</span>
                  <RevealText text={v.t?.evTitle} />
                </div>
                <p className="hsub" data-rv="">
                  {v.t?.evSub}
                </p>
              </div>
              <div className="evlay">
                {evMain ? (
                  <div data-rv="">
                    <Tilt href="/login" className={`evf ${$s(evMain.cls)}`} max={3}>
                      <span className="pbg">
                        <img src={evMain.img} alt="" />
                      </span>
                      <span className="evf-ov" />
                      <span className="evf-top">
                        {evMain.live ? <span className="livep">{v.t?.liveNow}</span> : null}
                        <span className="chip glass">
                          <span className="dia" style={{ color: '#F7C337' }} />
                          {evMain.cat}
                        </span>
                      </span>
                      <span className="evf-b">
                        <span className="dbig">
                          <b>{evMain.day}</b>
                          <span>{evMain.mon}</span>
                        </span>
                        <h3>{evMain.title}</h3>
                        <span className="desc">{evMain.desc}</span>
                        <span className="evmeta">
                          <span>
                            {Ic.clock}
                            {evMain.time}
                          </span>
                          <span>
                            {Ic.pin}
                            {evMain.where}
                          </span>
                        </span>
                        <span className="btn btn-white cgo">
                          {evMain.cta}
                          <Arrow />
                        </span>
                      </span>
                    </Tilt>
                  </div>
                ) : null}
                <div className="evlist">
                  <span className="evl-h" data-rv="">
                    {v.t?.upNext}
                  </span>
                  {evRest.map((e: V) => (
                    <a href="/login" className="evr" key={e.title} data-rv="">
                      <span className="evd">
                        <b>{e.day}</b>
                        <span>{e.mon}</span>
                      </span>
                      <span className="evi">
                        <img src={e.img} alt="" />
                      </span>
                      <span className="evt">
                        <span className="chip">{e.cat}</span>
                        <h3>{e.title}</h3>
                        <span className="evmeta">
                          <span>
                            {Ic.clock}
                            {e.time}
                          </span>
                          <span>
                            {Ic.pin}
                            {e.where}
                          </span>
                        </span>
                      </span>
                      <span className="go">
                        <Arrow />
                      </span>
                    </a>
                  ))}
                  <a href="/login" className="evall" data-rv="">
                    {v.t?.allEv}
                    <Arrow />
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="sec partners pat pa" id="partners">
            <div className="wrap">
              <div className="sh">
                <div className="l">
                  <span className="eyebrow">{v.t?.partEy}</span>
                  <RevealText text={v.t?.partTitle} />
                </div>
                <p className="lead" style={{ maxWidth: '40ch' }} data-rv="">
                  {v.t?.partSub}
                </p>
              </div>
              <div className="plogos">
                {$arr(v.partners).map((p: V) => (
                  <motion.div
                    key={p?.n}
                    className="plogo"
                    data-rv=""
                    title={p?.n}
                    whileHover={{ y: -6, scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <img src={p?.src} alt={p?.n} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="sec pat pb" style={{ background: '#fff', paddingTop: '24px' }}>
            <div className="wrap">
              <div className="sh">
                <div className="l">
                  <span className="eyebrow">{v.t?.affEy}</span>
                  <RevealText text={v.t?.affTitle} />
                </div>
                <p className="lead" style={{ maxWidth: '36ch' }} data-rv="">
                  {v.t?.affSub}
                </p>
              </div>
              <div className="mp">
                <a
                  href="https://vxacademy.example"
                  target="_blank"
                  rel="noopener"
                  className="mpc vx"
                  data-rv=""
                >
                  <div className="grid-d" /> <span className="eyebrow">{v.t?.vxEy}</span>
                  <h3>VX Academy</h3> <p>{v.t?.vx}</p>
                  <div className="cats">
                    {$arr(v.t?.vxL).map((x: V) => (
                      <span key={x}>
                        <span className="dia" style={{ color: '#F7C337' }} />
                        {x}
                      </span>
                    ))}
                  </div>
                  <span className="ulink">
                    {v.t?.visit}
                    {' VX Academy'}
                    <Ext />
                  </span>
                  <div className="prev" aria-hidden="true">
                    <span className="pl">{v.t?.preview}</span>
                    <div className="bbar">
                      <i />
                      <i />
                      <i />
                      <span className="url">vxacademy.ae</span>
                    </div>
                    <div className="phero">
                      <img src="/_blob/3e5eadfa4450ed50cc8f8900fdc8e3e3" alt="" />
                      <div className="tx">
                        <b>{v.t?.vxH}</b>
                        <i />
                      </div>
                    </div>
                    <div className="thumbs">
                      {[
                        '6a330c17598da2f1e81b82711e1c5e9a',
                        'd99ea09adede7395461223b429f24cf4',
                        'cf69d2b8596f972f4af9fc63c0137303',
                      ].map((id) => (
                        <div key={id}>
                          <img src={`/_blob/${id}`} alt="" />
                          <s />
                          <s />
                        </div>
                      ))}
                    </div>
                  </div>
                </a>
                <a
                  href="https://adtg.example"
                  target="_blank"
                  rel="noopener"
                  className="mpc ad"
                  data-rv=""
                >
                  <div className="grid-l" /> <span className="eyebrow">{v.t?.adEy}</span>
                  <h3>{v.t?.adtg}</h3> <p>{v.t?.adtgB}</p>
                  <div className="cats">
                    {$arr(v.t?.adL).map((x: V) => (
                      <span key={x}>
                        <span className="dia" style={{ color: '#D63539' }} />
                        {x}
                      </span>
                    ))}
                  </div>
                  <span className="ulink">
                    {v.t?.visit} {v.t?.adShort}
                    <Ext />
                  </span>
                  <div className="prev" aria-hidden="true">
                    <span className="pl">{v.t?.preview}</span>
                    <div className="bbar">
                      <i />
                      <i />
                      <i />
                      <span className="url">tourguide.abudhabi</span>
                    </div>
                    <div className="phero">
                      <img src="/_blob/a39ca3b3c0fdaf9dcd07000a3da4c090" alt="" />
                      <div className="tx">
                        <b>{v.t?.adH}</b>
                        <i />
                      </div>
                    </div>
                    <div className="thumbs">
                      {[
                        '40780df486810d248ab2ca9a23d58dcb',
                        'd01461a3f6ad3ced258aac4713f94408',
                        '592272d2d94f43d123cbcdda07b02178',
                      ].map((id) => (
                        <div key={id}>
                          <img src={`/_blob/${id}`} alt="" />
                          <s />
                          <s />
                        </div>
                      ))}
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </section>

          <section className="sec faqs pat pa" id="faq">
            <div className="wrap">
              <div className="fq-grid">
                <div className="fq-side">
                  <span className="eyebrow">{v.t?.faqEy}</span>
                  <RevealText className="big2" text={v.t?.faqTitle} />
                  <p className="lead" data-rv="">
                    {v.t?.faqSub}
                  </p>
                  <label className="srch" data-rv="">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1D1650"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="search"
                      placeholder={v.t?.fqPh}
                      aria-label={v.t?.fqPh}
                      onChange={v.onFq}
                    />
                  </label>
                  <div className="tpills" role="group" aria-label={v.t?.faqEy} data-rv="">
                    {$arr(v.fcats).map((c: V) => (
                      <button
                        key={c?.l}
                        type="button"
                        className={`tp ${$s(c?.cls)}`}
                        aria-pressed={c?.on}
                        onClick={c?.pick}
                      >
                        {c?.l}
                      </button>
                    ))}
                  </div>
                  <div className="help" data-rv="">
                    <svg
                      className="motif sm"
                      viewBox="0 0 180 180"
                      style={{ bottom: '-50px', insetInlineEnd: '-40px', opacity: '.9' }}
                      aria-hidden="true"
                    >
                      <path className="m" d="M0 60 A60 60 0 0 1 60 0 V60 Z" fill="#EE3E43" />
                      <rect
                        className="m d"
                        x="81"
                        y="9"
                        width="42"
                        height="42"
                        transform="rotate(45 102 30)"
                      />
                      <path className="m" d="M120 0 H180 V60 A60 60 0 0 1 120 0 Z" fill="#F77860" />
                      <rect
                        className="m"
                        x="9"
                        y="81"
                        width="42"
                        height="42"
                        fill="#E3DCD3"
                        transform="rotate(45 30 102)"
                      />
                      <path className="m" d="M0 120 H60 A60 60 0 0 1 0 180 Z" fill="#CD3151" />
                    </svg>
                    <b>{v.t?.helpT}</b>
                    <p>{v.t?.helpB}</p>
                    <a href="mailto:learn@dctabudhabi.ae" className="ulink">
                      learn@dctabudhabi.ae
                    </a>
                  </div>
                </div>
                <div className="fql">
                  {$arr(v.faqs).map((q: V) => (
                    <div className={`fi ${$s(q?.cls)}`} key={q?.q} data-rv="">
                      <button type="button" aria-expanded={q?.exp} onClick={q?.pick}>
                        <span className="no">{q?.n}</span>
                        <span className="qq">{q?.q}</span>
                        <span className="pm" aria-hidden="true" />
                      </button>
                      <div className="ans">
                        <div>
                          <p>{q?.a}</p>
                          <span className="tg">
                            <span className="dia" style={{ color: '#D63539' }} />
                            {q?.cat}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {v.noFaq ? (
                    <div className="empty">
                      <span className="dia" style={{ color: '#D63539' }} />
                      {v.t?.fqNone}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="fwrap">
            <div className="wrap">
              <div className="fcta" data-rv="">
                <div className="lines" />
                <svg
                  className="motif sm"
                  viewBox="0 0 180 180"
                  style={{ top: '0', insetInlineEnd: '0', width: '180px', height: '180px' }}
                  aria-hidden="true"
                >
                  <path className="m" d="M0 60 A60 60 0 0 1 60 0 V60 Z" fill="#1D1650" />
                  <rect
                    className="m d"
                    x="81"
                    y="9"
                    width="42"
                    height="42"
                    transform="rotate(45 102 30)"
                  />
                  <path className="m" d="M120 0 H180 V60 A60 60 0 0 1 120 0 Z" fill="#F77860" />
                  <rect
                    className="m"
                    x="9"
                    y="81"
                    width="42"
                    height="42"
                    fill="#E3DCD3"
                    transform="rotate(45 30 102)"
                  />
                  <path className="m" d="M0 120 H60 A60 60 0 0 1 0 180 Z" fill="#fff" />
                </svg>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    maxWidth: '640px',
                  }}
                >
                  <span className="eyebrow">{v.t?.fEy}</span>
                  <RevealText text={v.t?.fTitle} />
                  <p
                    style={{
                      color: 'rgba(255,255,255,.92)',
                      fontSize: '1.0625rem',
                      maxWidth: '48ch',
                    }}
                  >
                    {v.t?.fSub}
                  </p>
                  <div className="cta-row" style={{ marginTop: '10px' }}>
                    <a href="/login" className="btn btn-white">
                      {v.t?.signIn}
                    </a>
                    <a href="/employee-registration" className="btn btn-line-w">
                      {v.t?.register}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer className="ftr pat pd pa">
          <div className="wrap">
            <div className="cols">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <a
                  href="#top"
                  className="logo-tile"
                  style={{ alignSelf: 'flex-start' }}
                  aria-label="DCT Learn"
                >
                  <img
                    src="/_blob/b9eccf73abbba8b88c76e30f5d924545"
                    alt="DCT Learn"
                    style={{ height: '36px', width: 'auto' }}
                  />
                </a>
                <p
                  style={{ color: 'rgba(255,255,255,.78)', fontSize: '.9375rem', maxWidth: '36ch' }}
                >
                  {v.t?.ftrBlurb}
                </p>
              </div>
              <div>
                <h4>{v.t?.ftrPage}</h4>
                <ul>
                  {$arr(v.nav).map((n: V) => (
                    <li key={n.id}>
                      <a href={n.href}>{n.l}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>{v.t?.ftrExplore}</h4>
                <ul>
                  <li>
                    <a href="/professionals">{v.t?.navEmp}</a>
                  </li>
                  <li>
                    <a href="/students">{v.t?.navStu}</a>
                  </li>
                  <li>
                    <a href="/faq">{v.t?.navFaq}</a>
                  </li>
                  <li>
                    <a href="#partners">{v.t?.navPart}</a>
                  </li>
                </ul>
              </div>
              <div>
                <h4>{v.t?.ftrAccount}</h4>
                <ul>
                  <li>
                    <a href="/login">{v.t?.signIn}</a>
                  </li>
                  <li>
                    <a href="/employee-registration">{v.t?.register}</a>
                  </li>
                  <li>
                    <a href="/reset-password">{v.t?.forgot}</a>
                  </li>
                </ul>
              </div>
              <div>
                <h4>{v.t?.ftrContact}</h4>
                <ul>
                  <li>
                    <a href="mailto:learn@dctabudhabi.ae">learn@dctabudhabi.ae</a>
                  </li>
                  <li>
                    <a href="/faq">{v.t?.privacy}</a>
                  </li>
                  <li>
                    <a href="/faq">{v.t?.access}</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="base">
              <span>
                {'© 2026 '}
                {v.t?.copyright}
              </span>
              <span>
                {v.t?.powered}{' '}
                <a href="https://www.potential.com" target="_blank" rel="noopener" className="pwr">
                  potential.com
                </a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
