// Forked from potential-template packages/core/src/uploads/file-signature.ts (+ m4a, zip).
/**
 * Content-based file type verification ("magic byte" sniffing).
 *
 * The client-supplied `Content-Type` is attacker-controlled. Combined with a
 * preserved original extension it allows stored XSS: upload `payload.html`
 * declared as `text/plain`, then have the static file server hand it back as
 * `text/html` on the application origin.
 *
 * These helpers inspect the bytes themselves and resolve a canonical
 * `(mime, ext)` pair from a closed allowlist. Callers store the file under
 * the verified extension and persist the verified MIME type — never the
 * declared one.
 */

/** A MIME type and extension resolved from a file's own bytes. */
export interface VerifiedFileType {
  /** Canonical MIME type. */
  mime: string
  /** Canonical extension, including the leading dot, e.g. `".png"`. */
  ext: string
}

/**
 * Closed allowlist of extensions that can ever be written to storage.
 * Nothing outside this set can be produced by `verifyFileType`, so the
 * served `Content-Type` is bounded by construction.
 */
export const ALLOWED_EXTENSIONS: readonly string[] = [
  '.jpg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.mp4',
  '.mov',
  '.webm',
  '.mp3',
  '.m4a',
  '.zip',
  '.wav',
  '.ogg',
]

/** Bytes read from the head of a file for signature matching. */
export const SNIFF_LENGTH = 4100

/** Declared MIME types that are text-based and therefore have no signature. */
const TEXT_DECLARED_MIMES: Record<string, VerifiedFileType> = {
  'text/plain': { mime: 'text/plain', ext: '.txt' },
  'text/csv': { mime: 'text/csv', ext: '.csv' },
}

/**
 * ZIP-container (OOXML) formats. The signature proves it is a ZIP;
 * distinguishing docx from xlsx would mean reading the archive directory, so
 * the declared type picks between them. Every outcome is an inert extension,
 * so a lie here has no security consequence.
 */
const ZIP_CONTAINER_MIMES: Record<string, VerifiedFileType> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: '.docx',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: '.xlsx',
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ext: '.pptx',
  },
}

/** Legacy OLE compound-file formats, disambiguated the same way. */
const OLE_CONTAINER_MIMES: Record<string, VerifiedFileType> = {
  'application/msword': { mime: 'application/msword', ext: '.doc' },
  'application/vnd.ms-excel': { mime: 'application/vnd.ms-excel', ext: '.xls' },
  'application/vnd.ms-powerpoint': {
    mime: 'application/vnd.ms-powerpoint',
    ext: '.ppt',
  },
}

function startsWith(buf: Uint8Array, bytes: number[], offset = 0): boolean {
  if (buf.length < offset + bytes.length) return false
  for (let i = 0; i < bytes.length; i++) {
    if (buf[offset + i] !== bytes[i]) return false
  }
  return true
}

function asciiAt(buf: Uint8Array, offset: number, length: number): string {
  if (buf.length < offset + length) return ''
  let out = ''
  for (let i = offset; i < offset + length; i++) {
    out += String.fromCharCode(buf[i] as number)
  }
  return out
}

/**
 * Resolves an ISO-BMFF (`ftyp`) container to mp4 or QuickTime from its major
 * brand, falling back to the declared type for an unfamiliar brand.
 */
function resolveIsoBmff(buf: Uint8Array, declaredMime: string): VerifiedFileType {
  const brand = asciiAt(buf, 8, 4)
  if (brand === 'M4A ' || brand === 'M4B ') return { mime: 'audio/mp4', ext: '.m4a' }
  if (brand === 'qt  ') return { mime: 'video/quicktime', ext: '.mov' }
  if (
    brand.startsWith('iso') ||
    brand.startsWith('mp4') ||
    brand === 'avc1' ||
    brand === 'M4V ' ||
    brand === 'dash'
  ) {
    return { mime: 'video/mp4', ext: '.mp4' }
  }
  return declaredMime === 'video/quicktime'
    ? { mime: 'video/quicktime', ext: '.mov' }
    : { mime: 'video/mp4', ext: '.mp4' }
}

/**
 * Matches a binary signature against the allowlist. Returns `null` when
 * nothing matches.
 */
export function matchBinarySignature(
  buf: Uint8Array,
  declaredMime: string,
): VerifiedFileType | null {
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: '.png' }
  }
  if (startsWith(buf, [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', ext: '.jpg' }
  }
  if (asciiAt(buf, 0, 4) === 'GIF8') {
    return { mime: 'image/gif', ext: '.gif' }
  }
  if (asciiAt(buf, 0, 4) === 'RIFF') {
    const form = asciiAt(buf, 8, 4)
    if (form === 'WEBP') return { mime: 'image/webp', ext: '.webp' }
    if (form === 'WAVE') return { mime: 'audio/wav', ext: '.wav' }
    return null
  }
  if (asciiAt(buf, 0, 5) === '%PDF-') {
    return { mime: 'application/pdf', ext: '.pdf' }
  }
  if (
    startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(buf, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(buf, [0x50, 0x4b, 0x07, 0x08])
  ) {
    if (declaredMime === 'application/zip' || declaredMime === 'application/x-zip-compressed') {
      return { mime: 'application/zip', ext: '.zip' }
    }
    return ZIP_CONTAINER_MIMES[declaredMime] ?? null
  }
  if (startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return OLE_CONTAINER_MIMES[declaredMime] ?? null
  }
  if (asciiAt(buf, 4, 4) === 'ftyp') {
    return resolveIsoBmff(buf, declaredMime)
  }
  if (asciiAt(buf, 0, 4) === 'OggS') {
    return { mime: 'audio/ogg', ext: '.ogg' }
  }
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { mime: 'video/webm', ext: '.webm' }
  }
  if (asciiAt(buf, 0, 3) === 'ID3') {
    return { mime: 'audio/mpeg', ext: '.mp3' }
  }
  if (buf.length >= 2 && buf[0] === 0xff && ((buf[1] as number) & 0xe0) === 0xe0) {
    return { mime: 'audio/mpeg', ext: '.mp3' }
  }
  return null
}

/**
 * Patterns that make an SVG an active-content document rather than an image.
 *
 * SVG is XML rendered in the origin that serves it, so a `<script>` or an
 * inline event handler inside one is a stored-XSS payload. There is no
 * signature to check, so the document is scanned and rejected outright when
 * it contains anything scriptable or externally referencing.
 */
export const SVG_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /<\s*script/i,
  /<\s*foreignobject/i,
  /<\s*iframe/i,
  /<\s*embed/i,
  /<\s*object/i,
  /<!ENTITY/i,
  /<\s*!\s*DOCTYPE[^>]*\[/i,
  /\bon[a-z]+\s*=/i,
  /javascript\s*:/i,
  /<\s*use[^>]+href\s*=\s*["']?\s*http/i,
]

/** True when the buffer is an SVG document with no active content. */
function resolveSvg(buf: Uint8Array): VerifiedFileType | null {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buf)
  if (!/<\s*svg[\s>]/i.test(text)) return null
  for (const pattern of SVG_FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) return null
  }
  return { mime: 'image/svg+xml', ext: '.svg' }
}

/** True when the buffer contains no control bytes that betray binary data. */
function looksLikeText(buf: Uint8Array): boolean {
  for (const byte of buf) {
    if (byte === 0) return false
    if (byte < 0x09) return false
    if (byte > 0x0d && byte < 0x20 && byte !== 0x1b) return false
  }
  return true
}

/**
 * Resolves the canonical type of a file from its own bytes.
 *
 * `declaredMime` is consulted only to disambiguate container formats
 * (OOXML/OLE/ISO-BMFF) and to pick between text subtypes — never to widen
 * what is accepted.
 *
 * @param bytes The head of the file; `SNIFF_LENGTH` bytes is enough for
 * binary formats, but SVG and text must be passed in full to be scanned.
 * @param declaredMime The client-supplied `Content-Type`.
 * @returns The verified type, or `null` when the content is not on the
 * allowlist — in which case the upload must be rejected.
 */
export function verifyFileType(bytes: Uint8Array, declaredMime: string): VerifiedFileType | null {
  const binary = matchBinarySignature(bytes, declaredMime)
  if (binary) return binary

  if (declaredMime === 'image/svg+xml' || /^\s*<[?s]/.test(asciiAt(bytes, 0, 8))) {
    const svg = resolveSvg(bytes)
    if (svg) return svg
  }

  const text = TEXT_DECLARED_MIMES[declaredMime]
  if (text && looksLikeText(bytes)) return text

  return null
}
