/** KPI number count-up after navigation, ported from Prototype.dc.html countUp(). */
export function countUp() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const els = [...document.querySelectorAll<HTMLElement>('.pt .kpi .v')]
  els.forEach((v, i) => {
    const n = [...v.childNodes].find((x) =>
      x.nodeType === 1
        ? /^[\d.,]+$/.test((x.textContent ?? '').trim())
        : /^[\d.,]+$/.test((x.nodeValue ?? '').trim()),
    )
    if (!n) return
    const node = n.nodeType === 1 ? (n.firstChild ?? n) : n
    const raw = (node.nodeValue ?? node.textContent ?? '').trim()
    const target = Number.parseFloat(raw.replace(/,/g, ''))
    if (!Number.isFinite(target) || target === 0) return
    const dec = (raw.split('.')[1] ?? '').length
    const comma = raw.includes(',')
    const fmt = (x: number) => {
      let s = x.toFixed(dec)
      if (comma) {
        const p = s.split('.')
        p[0] = (p[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        s = p.join('.')
      }
      return s
    }
    const set = (val: string) => {
      if (node.nodeType === 3) node.nodeValue = val
      else node.textContent = val
    }
    const t0 = performance.now() + i * 90
    const dur = 1100
    const step = (now: number) => {
      if (!node.isConnected) return
      const p = Math.max(0, Math.min(1, (now - t0) / dur))
      const e = 1 - (1 - p) ** 3
      set(fmt(target * e))
      if (p < 1) requestAnimationFrame(step)
      else set(raw)
    }
    set(fmt(0))
    requestAnimationFrame(step)
  })
}
