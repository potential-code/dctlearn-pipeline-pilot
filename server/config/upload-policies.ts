/**
 * Upload limits of API-CONTRACT §0 per category. Types are checked by content (magic bytes),
 * never by extension or declared MIME alone.
 */
export const MB = 1024 * 1024

export type UploadPolicy = { maxBytes: number; mimes: readonly string[] }

export const UPLOAD_POLICIES = {
  image: { maxBytes: 5 * MB, mimes: ['image/png', 'image/jpeg', 'image/webp'] },
  pdf: { maxBytes: 10 * MB, mimes: ['application/pdf'] },
  /** External certificates: PDF or image. */
  certificate: {
    maxBytes: 10 * MB,
    mimes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
  },
  audio: { maxBytes: 50 * MB, mimes: ['audio/mpeg', 'audio/mp4'] },
  scorm: { maxBytes: 200 * MB, mimes: ['application/zip'] },
  csv: { maxBytes: 2 * MB, mimes: ['text/csv', 'text/plain'] },
  /** Admin uploads (P59): any of the above except CSV. */
  content: {
    maxBytes: 200 * MB,
    mimes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/pdf',
      'audio/mpeg',
      'audio/mp4',
      'application/zip',
    ],
  },
} as const satisfies Record<string, UploadPolicy>

export type UploadCategory = keyof typeof UPLOAD_POLICIES

/** Per-type caps inside the mixed `content` category. */
export function maxBytesFor(mime: string): number {
  if (mime.startsWith('image/')) return UPLOAD_POLICIES.image.maxBytes
  if (mime === 'application/pdf') return UPLOAD_POLICIES.pdf.maxBytes
  if (mime.startsWith('audio/')) return UPLOAD_POLICIES.audio.maxBytes
  if (mime === 'application/zip') return UPLOAD_POLICIES.scorm.maxBytes
  return UPLOAD_POLICIES.csv.maxBytes
}
