import sanitizeHtml from 'sanitize-html'

/**
 * HTML allow-list for every **Sanitise** field (rich text blocks, landing custom HTML, popups).
 * No scripts, no event handlers, no inline styles, https/mailto links only.
 */
const RICH: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'blockquote',
    'code',
    'pre',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'figure',
    'figcaption',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
    'span',
    'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['dir', 'lang'],
  },
  allowedSchemes: ['https', 'mailto'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
}

/** Embeds (SurveyMonkey etc.): iframes from https only, nothing executable. */
const EMBED: sanitizeHtml.IOptions = {
  ...RICH,
  allowedTags: [...(RICH.allowedTags as string[]), 'iframe'],
  allowedAttributes: {
    ...(RICH.allowedAttributes as Record<string, string[]>),
    iframe: ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'frameborder'],
  },
  allowedSchemesByTag: { img: ['https'], iframe: ['https'] },
}

export function sanitizeRich(html: string) {
  return sanitizeHtml(html, RICH)
}

export function sanitizeEmbed(html: string) {
  return sanitizeHtml(html, EMBED)
}

/** Plain text fields: no markup at all. */
export function sanitizeText(text: string) {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim()
}

export function sanitizeI18nRich(value: { en: string; ar: string }) {
  return { en: sanitizeRich(value.en), ar: sanitizeRich(value.ar) }
}
