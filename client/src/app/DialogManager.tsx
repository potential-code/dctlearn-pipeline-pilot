import { useEffect } from 'react'
import { lenis } from '@/lib/motion/SmoothScroll'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
const CLOSE_LABEL = /close|dismiss|إغلاق|اغلاق/i
const CLOSE_TEXT = /^(cancel|close|not now|keep|back|إلغاء|إغلاق|ليس الآن|رجوع)\b/i

const visible = (el: Element) => {
  const r = (el as HTMLElement).getBoundingClientRect()
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
}

/** The open modal on top, if any (the ported pages render dialogs as role=dialog aria-modal). */
function topDialog(): HTMLElement | null {
  const all = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')]
  return all.filter(visible).pop() ?? null
}

/** Finds the dialog's own close/cancel control so closing goes through the page's logic. */
function closeControl(d: HTMLElement): HTMLElement | null {
  const btns = [...d.querySelectorAll<HTMLElement>('button,a[href]')].filter(visible)
  return (
    btns.find((b) => CLOSE_LABEL.test(b.getAttribute('aria-label') ?? '')) ??
    btns.find((b) => CLOSE_TEXT.test((b.textContent ?? '').trim())) ??
    null
  )
}

/**
 * App-wide modal behaviour for every ported dialog: focus moves into the dialog, Tab stays
 * inside it, Escape and a click on the backdrop close it (through its own close button),
 * the page behind doesn't scroll, and focus returns to the trigger afterwards.
 */
export function DialogManager() {
  useEffect(() => {
    let open: HTMLElement | null = null
    let opener: HTMLElement | null = null

    const sync = () => {
      const d = topDialog()
      if (d === open) return
      if (d && !open) {
        opener = document.activeElement as HTMLElement | null
        document.documentElement.classList.add('dlg-open')
        lenis()?.stop()
      }
      if (!d && open) {
        document.documentElement.classList.remove('dlg-open')
        lenis()?.start()
        if (opener?.isConnected) opener.focus({ preventScroll: true })
        opener = null
      }
      open = d
      if (d && !d.contains(document.activeElement)) {
        const first = [...d.querySelectorAll<HTMLElement>(FOCUSABLE)].find(visible)
        if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '-1')
        ;(first ?? d).focus({ preventScroll: true })
      }
    }

    const onKey = (e: KeyboardEvent) => {
      const d = open
      if (!d) return
      if (e.key === 'Escape') {
        const c = closeControl(d)
        if (c) {
          e.preventDefault()
          c.click()
        }
        return
      }
      if (e.key !== 'Tab') return
      const items = [...d.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(visible)
      if (!items.length) {
        e.preventDefault()
        return
      }
      const first = items[0] as HTMLElement
      const last = items[items.length - 1] as HTMLElement
      const a = document.activeElement
      if (e.shiftKey && (a === first || !d.contains(a))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (a === last || !d.contains(a))) {
        e.preventDefault()
        first.focus()
      }
    }

    // Backdrop click: only when the press starts and ends on the overlay itself, and the page
    // didn't already handle it.
    let downOnBackdrop = false
    const isBackdrop = (t: EventTarget | null) => {
      const d = open
      return !!d && t instanceof HTMLElement && !d.contains(t) && t.contains(d)
    }
    const onDown = (e: MouseEvent) => {
      downOnBackdrop = isBackdrop(e.target)
    }
    const onClick = (e: MouseEvent) => {
      if (!downOnBackdrop || !isBackdrop(e.target)) return
      downOnBackdrop = false
      const d = open
      // Let the page's own backdrop handler run first; close only if the dialog is still up.
      requestAnimationFrame(() => {
        if (d?.isConnected && visible(d)) closeControl(d)?.click()
      })
    }

    const mo = new MutationObserver(() => requestAnimationFrame(sync))
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden'],
    })
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('click', onClick)
    sync()
    return () => {
      mo.disconnect()
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('click', onClick)
      document.documentElement.classList.remove('dlg-open')
    }
  }, [])
  return null
}
