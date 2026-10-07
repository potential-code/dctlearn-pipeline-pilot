import { aiEmbedHosts } from '@server/config/env'
import { type DbOrTx, db } from '@server/db/connection'
import { type AiEmbedRow, aiEmbedMicrosites, aiEmbeds } from '@server/db/schema/ai'
import { type Microsite, memberships, microsites } from '@server/db/schema/microsites'
import { recordAudit } from '@server/lib/audit'
import { now } from '@server/lib/clock'
import { conflict, featureOff, forbidden, notFound, validationFailed } from '@server/lib/errors'
import { paged, pageWindow } from '@server/lib/pagination'
import { micrositeIdsForSlugs } from '@server/services/events/audience'
import { urlForStored } from '@server/services/files.service'
import type { AdminAiQuery, AiEmbedInput } from '@shared/schemas/ai'
import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm'
import type { z } from 'zod'
import { signEmbedSession } from './session-token'

/**
 * AI coaches / tools (P23–P27), admin configuration (P61). Embeds are linked to microsites;
 * `requiresLogin` embeds need a viewer who may use one of those microsites with AI switched on.
 */

/** Hosts allowed for script / iframe URLs (`AI_EMBED_ALLOWED_HOSTS`); tests may override. */
export const embedHostPolicy = { hosts: aiEmbedHosts }

const liveEmbed = isNull(aiEmbeds.deletedAt)
const COACH_KINDS = new Set(['chat'])

type Kind = 'chat' | 'iframe' | 'voice'

async function findByKey(key: string, tx: DbOrTx = db) {
  const [row] = await tx
    .select()
    .from(aiEmbeds)
    .where(and(eq(aiEmbeds.key, key), liveEmbed))
  if (!row) throw notFound()
  return row
}

async function linkedMicrosites(embedIds: string[], tx: DbOrTx = db) {
  const map = new Map<string, Microsite[]>()
  if (embedIds.length === 0) return map
  const rows = await tx
    .select({ embedId: aiEmbedMicrosites.embedId, m: microsites })
    .from(aiEmbedMicrosites)
    .innerJoin(microsites, eq(microsites.id, aiEmbedMicrosites.micrositeId))
    .where(inArray(aiEmbedMicrosites.embedId, embedIds))
    .orderBy(asc(microsites.slug))
  for (const r of rows) map.set(r.embedId, [...(map.get(r.embedId) ?? []), r.m])
  return map
}

async function embedDto(e: AiEmbedRow, viewerId: string | null) {
  return {
    key: e.key,
    name: e.name,
    description: e.description,
    iconUrl: await urlForStored(e.iconUrl, viewerId),
    kind: e.kind as Kind,
    providerId: e.providerId,
    color: e.color,
    requiresLogin: e.requiresLogin,
    ...(e.scriptUrl ? { scriptUrl: e.scriptUrl } : {}),
    ...(e.iframeUrl ? { iframeUrl: e.iframeUrl } : {}),
  }
}

/* ------------------------------------------------------------------ access */

/**
 * `member(p)` for one of the embed's microsites when it requires login: admins always; sub
 * admins of a linked microsite; learners with a membership of a linked live microsite. Wrong
 * role or no link → 403; linked but AI off everywhere → 404 `feature_off`.
 */
async function assertCanUse(e: AiEmbedRow, viewer: Viewer) {
  if (viewer.role === 'admin') return
  const linked = (await linkedMicrosites([e.id])).get(e.id) ?? []
  let usable: Microsite[] = []
  if (viewer.role === 'sub_admin') {
    usable = linked.filter((m) => m.subAdminId === viewer.id && m.status !== 'archived')
  } else if (viewer.role === 'learner' && linked.length) {
    const mine = await db
      .select({ id: memberships.micrositeId })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, viewer.id),
          inArray(
            memberships.micrositeId,
            linked.map((m) => m.id),
          ),
        ),
      )
    const ids = new Set(mine.map((r) => r.id))
    usable = linked.filter((m) => ids.has(m.id) && m.status === 'live' && !m.landingOnly)
  }
  if (usable.length === 0) throw forbidden()
  if (!usable.some((m) => m.aiEnabled)) throw featureOff(404)
}

/**
 * GET /ai/embeds/{key}. `signIn` runs the `signed-in` checks (401 / 403) and is only called
 * when the embed requires login, so public embeds (voice hiring) stay public.
 */
export async function getEmbed(key: string, viewer: Viewer | null, signIn: () => Promise<Viewer>) {
  const e = await findByKey(key)
  if (e.requiresLogin) await assertCanUse(e, await signIn())
  return embedDto(e, viewer?.id ?? null)
}

export async function createEmbedSession(key: string, viewer: Viewer) {
  const e = await findByKey(key)
  if (e.requiresLogin) await assertCanUse(e, viewer)
  const { token, expiresAt } = signEmbedSession({
    userId: viewer.id,
    locale: viewer.locale,
    embedKey: e.key,
  })
  return { token, expiresAt: expiresAt.toISOString() }
}

/* ------------------------------------------------------------------ learner listings */

async function embedsFor(m: Microsite) {
  return db
    .select({ e: aiEmbeds })
    .from(aiEmbeds)
    .innerJoin(aiEmbedMicrosites, eq(aiEmbedMicrosites.embedId, aiEmbeds.id))
    .where(and(eq(aiEmbedMicrosites.micrositeId, m.id), liveEmbed))
    .orderBy(asc(aiEmbeds.createdAt), asc(aiEmbeds.key))
    .then((rows) => rows.map((r) => r.e))
}

/** P23: `{ coaches, tools }` for the microsite (route has requireFeature('ai')). */
export async function micrositeAi(m: Microsite, viewer: Viewer) {
  const rows = await embedsFor(m)
  const all = await Promise.all(rows.map((e) => embedDto(e, viewer.id)))
  return {
    coaches: all.filter((e) => COACH_KINDS.has(e.kind)),
    tools: all.filter((e) => !COACH_KINDS.has(e.kind)),
  }
}

/** Front-end page for an embed (SPEC routes, relative to the microsite). */
function pageUrl(e: AiEmbedRow) {
  if (e.kind === 'chat') return `/ai/coach/${e.key}`
  if (e.kind === 'voice') return '/ai/voice-hiring'
  return `/ai/tool/${e.key}`
}

/** P52 `ai_coaches` / `ai_tools`. AI switched off for the microsite → 404 `feature_off`. */
export async function hubAi(m: Microsite, viewer: Viewer, which: 'coaches' | 'tools') {
  if (!m.aiEnabled) throw featureOff(404)
  const rows = (await embedsFor(m)).filter((e) =>
    which === 'coaches' ? COACH_KINDS.has(e.kind) : !COACH_KINDS.has(e.kind),
  )
  const items = await Promise.all(
    rows.map(async (e) => ({
      key: e.key,
      name: e.name,
      description: e.description,
      iconUrl: await urlForStored(e.iconUrl, viewer.id),
      kind: e.kind as Kind,
      url: pageUrl(e),
    })),
  )
  return { items }
}

/* ------------------------------------------------------------------ P61 admin */

function assertAllowedHosts(input: AiEmbedInput) {
  const fields: Record<string, string> = {}
  for (const name of ['scriptUrl', 'iframeUrl'] as const) {
    const value = input[name]
    if (!value) continue
    const host = new URL(value).hostname.toLowerCase()
    if (!embedHostPolicy.hosts.includes(host)) fields[name] = 'This host is not allowed'
  }
  if (input.kind === 'iframe' && !input.iframeUrl) fields.iframeUrl = 'Required for an iframe tool'
  if (Object.keys(fields).length) throw validationFailed(fields)
}

async function adminDto(e: AiEmbedRow, slugs: string[], viewerId: string) {
  return { ...(await embedDto(e, viewerId)), microsites: slugs }
}

async function adminByKey(key: string, viewerId: string) {
  const e = await findByKey(key)
  const linked = (await linkedMicrosites([e.id])).get(e.id) ?? []
  return adminDto(
    e,
    linked.map((m) => m.slug),
    viewerId,
  )
}

export async function listAdminEmbeds(query: z.infer<typeof AdminAiQuery>, viewer: Viewer) {
  const where = and(liveEmbed, query.kind ? eq(aiEmbeds.kind, query.kind) : undefined)
  const [total] = await db.select({ n: count() }).from(aiEmbeds).where(where)
  const rows = await db
    .select()
    .from(aiEmbeds)
    .where(where)
    .orderBy(asc(aiEmbeds.key))
    .limit(pageWindow(query).limit)
    .offset(pageWindow(query).offset)
  const linked = await linkedMicrosites(rows.map((r) => r.id))
  const items = await Promise.all(
    rows.map((r) =>
      adminDto(
        r,
        (linked.get(r.id) ?? []).map((m) => m.slug),
        viewer.id,
      ),
    ),
  )
  return paged(items, total?.n ?? 0, query)
}

function values(input: AiEmbedInput) {
  return {
    name: input.name,
    description: input.description,
    iconUrl: input.iconUrl,
    kind: input.kind,
    providerId: input.providerId,
    color: input.color,
    scriptUrl: input.scriptUrl || null,
    iframeUrl: input.iframeUrl || null,
    requiresLogin: input.requiresLogin,
  }
}

async function setMicrosites(tx: DbOrTx, embedId: string, slugs: string[]) {
  const ids = await micrositeIdsForSlugs(slugs, 'microsites', tx)
  await tx.delete(aiEmbedMicrosites).where(eq(aiEmbedMicrosites.embedId, embedId))
  if (ids.length)
    await tx.insert(aiEmbedMicrosites).values(ids.map((micrositeId) => ({ embedId, micrositeId })))
}

export async function createEmbed(input: AiEmbedInput & { key: string }, viewer: Viewer) {
  assertAllowedHosts(input)
  await db.transaction(async (tx) => {
    const [taken] = await tx
      .select({ id: aiEmbeds.id })
      .from(aiEmbeds)
      .where(and(eq(aiEmbeds.key, input.key), liveEmbed))
    if (taken) throw conflict('An embed with this key already exists')
    const [row] = await tx
      .insert(aiEmbeds)
      .values({ key: input.key, ...values(input) })
      .returning()
    await setMicrosites(tx, row!.id, input.microsites)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'ai_embed.create',
      target: { type: 'ai_embed', id: row!.id, label: input.key },
      ip: viewer.ip,
    })
  })
  return adminByKey(input.key, viewer.id)
}

export async function updateEmbed(key: string, input: AiEmbedInput, viewer: Viewer) {
  assertAllowedHosts(input)
  await db.transaction(async (tx) => {
    const e = await findByKey(key, tx)
    await tx.update(aiEmbeds).set(values(input)).where(eq(aiEmbeds.id, e.id))
    await setMicrosites(tx, e.id, input.microsites)
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'ai_embed.update',
      target: { type: 'ai_embed', id: e.id, label: key },
      ip: viewer.ip,
    })
  })
  return adminByKey(key, viewer.id)
}

/** Soft delete (§9.2); the key becomes free again. */
export async function deleteEmbed(key: string, viewer: Viewer) {
  await db.transaction(async (tx) => {
    const e = await findByKey(key, tx)
    await tx.update(aiEmbeds).set({ deletedAt: now() }).where(eq(aiEmbeds.id, e.id))
    await recordAudit(tx, {
      actorId: viewer.id,
      action: 'ai_embed.delete',
      target: { type: 'ai_embed', id: e.id, label: key },
      ip: viewer.ip,
    })
  })
}
