import { env, features } from '@server/config/env'

/**
 * Machine-translation transport (adapted from the i18n template). The endpoint comes from
 * `TRANSLATION_API_URL` / `TRANSLATION_API_KEY`; when either is blank the feature is off and the
 * API answers 503 `feature_off`. Tests swap the transport with `setTranslationProvider`.
 *
 * Request: `{ texts, sourceLocale: "en", targetLocale: "ar" }`. Accepted responses:
 * `{ translations: string[] }`, `{ translations: [{ text }] }`, `{ data: string[] }`, `string[]`.
 * A failed or short response throws — source text is never stored as a translation.
 */
export interface TranslationProvider {
  translate(input: { texts: string[]; sourceLocale: 'en'; targetLocale: 'ar' }): Promise<string[]>
}

function extract(body: unknown): string[] | null {
  const list = Array.isArray(body)
    ? body
    : body && typeof body === 'object'
      ? ((body as { translations?: unknown }).translations ?? (body as { data?: unknown }).data)
      : null
  if (!Array.isArray(list)) return null
  const out: string[] = []
  for (const item of list) {
    if (typeof item === 'string') out.push(item)
    else if (
      item &&
      typeof item === 'object' &&
      typeof (item as { text?: unknown }).text === 'string'
    )
      out.push((item as { text: string }).text)
    else return null
  }
  return out
}

export const httpTranslationProvider: TranslationProvider = {
  async translate(input) {
    if (!env.TRANSLATION_API_URL || !env.TRANSLATION_API_KEY)
      throw new Error('Translation provider is not configured')
    const res = await fetch(env.TRANSLATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.TRANSLATION_API_KEY}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`Translation provider answered ${res.status}`)
    const out = extract(await res.json())
    if (!out || out.length !== input.texts.length)
      throw new Error('Translation provider returned an unexpected response')
    return out
  },
}

let provider: TranslationProvider = httpTranslationProvider

export function translationProvider() {
  return provider
}
export function setTranslationProvider(next: TranslationProvider | null) {
  provider = next ?? httpTranslationProvider
}
export function translationEnabled() {
  return features.translation
}
