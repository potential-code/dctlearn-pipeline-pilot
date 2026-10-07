import { type DbOrTx, db } from '@server/db/connection'
import { forms } from '@server/db/schema/forms'
import { type LandingDoc, type Microsite, micrositeLandings } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { notFound, validationFailed } from '@server/lib/errors'
import { assertIfMatch } from '@server/lib/if-match'
import { sanitizeEmbed, sanitizeText } from '@server/lib/sanitize'
import { urlForStored } from '@server/services/files.service'
import type { LandingInput } from '@shared/schemas/microsites'
import { and, eq, isNull } from 'drizzle-orm'
import type { z } from 'zod'
import { toMicrositeRef } from './lookup.service'

/** Draft/published landing (P12, P35). Custom HTML, embed HTML and popup text are sanitised on save. */

const i18nPlain = (v: { en: string; ar: string }) => ({
  en: sanitizeText(v.en),
  ar: sanitizeText(v.ar),
})

export function sanitizeLanding(input: z.infer<typeof LandingInput>): LandingDoc {
  const { ifMatch: _ignored, ...doc } = input
  return {
    ...doc,
    popup: doc.popup
      ? { ...doc.popup, ...(doc.popup.text ? { text: i18nPlain(doc.popup.text) } : {}) }
      : undefined,
    section: {
      ...doc.section,
      ...(doc.section.customHtml !== undefined
        ? { customHtml: sanitizeEmbed(doc.section.customHtml) }
        : {}),
    },
    embed: doc.embed
      ? {
          ...doc.embed,
          ...(doc.embed.html !== undefined ? { html: sanitizeEmbed(doc.embed.html) } : {}),
        }
      : undefined,
  }
}

/** Resolves stored file ids to URLs and drops undefined keys (strict response). */
export async function toLandingDto(doc: LandingDoc, viewerId: string | null) {
  const u = (v: string | undefined) => urlForStored(v, viewerId)
  const out = JSON.parse(JSON.stringify(doc)) as LandingDoc
  out.hero.imageUrl = await u(out.hero.imageUrl)
  if (out.popup?.imageUrl) out.popup.imageUrl = await u(out.popup.imageUrl)
  if (out.section.partners) for (const p of out.section.partners) p.imageUrl = await u(p.imageUrl)
  if (out.section.social) out.section.social.logoUrl = await u(out.section.social.logoUrl)
  return out
}

export async function getLandingRow(micrositeId: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(micrositeLandings)
    .where(eq(micrositeLandings.micrositeId, micrositeId))
  return row ?? null
}

export const EMPTY_LANDING = (m: Microsite): LandingDoc => ({
  hero: { heading: m.name, subheading: m.subtitle, imageUrl: m.heroUrl },
  cta: {
    signedOut: { label: { en: 'Sign in', ar: 'تسجيل الدخول' }, url: `/${m.slug}/login` },
    signedIn: { label: { en: 'Go to dashboard', ar: 'لوحة التحكم' }, url: `/${m.slug}/dashboard` },
  },
  section: { kind: 'none' },
})

/** P12: live microsites only; published version only. */
export async function getPublicLanding(m: Microsite) {
  if (m.status !== 'live') throw notFound()
  const row = await getLandingRow(m.id)
  if (!row?.published) throw notFound()
  // Landing-only microsites collect interest through POST .../register-interest.
  const registerInterest = m.landingOnly ? { formId: 'register-interest' } : undefined
  if (row.published.embed?.formId) {
    const [form] = await db
      .select({ id: forms.id })
      .from(forms)
      .where(and(eq(forms.id, row.published.embed.formId), isNull(forms.deletedAt)))
    if (!form) row.published.embed = undefined
  }
  return {
    microsite: {
      ...(await toMicrositeRef(m)),
      signInMode: m.signInMode as 'open' | 'invite_only' | 'landing_only',
      landingOnly: m.landingOnly,
    },
    ...(await toLandingDto(row.published, null)),
    ...(registerInterest ? { registerInterest } : {}),
  }
}

/** P35 save draft (ifMatch on the landing's updatedAt). The published version stays live. */
export async function saveDraft(m: Microsite, input: z.infer<typeof LandingInput>, actor: Viewer) {
  if (input.embed?.kind === 'form' && !input.embed.formId)
    throw validationFailed({ 'embed.formId': 'Choose a form' })
  const doc = sanitizeLanding(input)
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(micrositeLandings)
      .where(eq(micrositeLandings.micrositeId, m.id))
      .for('update')
    if (row) {
      assertIfMatch(row.updatedAt, input.ifMatch)
      await tx
        .update(micrositeLandings)
        .set({ draft: doc })
        .where(eq(micrositeLandings.micrositeId, m.id))
    } else {
      await tx.insert(micrositeLandings).values({ micrositeId: m.id, draft: doc })
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'landing.save_draft',
      target: { type: 'microsite', id: m.id, label: m.slug },
      micrositeId: m.id,
      ip: actor.ip,
    })
  })
}

/** P35 publish: draft → published (audited). */
export async function publishLanding(m: Microsite, actor: Viewer) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(micrositeLandings)
      .where(eq(micrositeLandings.micrositeId, m.id))
      .for('update')
    const draft = row?.draft ?? EMPTY_LANDING(m)
    const at = now()
    if (row) {
      await tx
        .update(micrositeLandings)
        .set({ published: draft, publishedAt: at, publishedById: actor.id })
        .where(eq(micrositeLandings.micrositeId, m.id))
    } else {
      await tx.insert(micrositeLandings).values({
        micrositeId: m.id,
        draft,
        published: draft,
        publishedAt: at,
        publishedById: actor.id,
      })
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'landing.publish',
      target: { type: 'microsite', id: m.id, label: m.slug },
      micrositeId: m.id,
      ip: actor.ip,
    })
    return { publishedAt: at.toISOString() }
  })
}
