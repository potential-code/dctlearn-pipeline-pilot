import { beforeAll, describe, expect, test } from 'bun:test'
import { E } from '@server/db/seed/data'
import { getHubTab } from '@server/services/microsites/dashboard.service'
import { findMicrositeBySlug } from '@server/services/microsites/lookup.service'
import { CoursesTabResponse } from '@shared/schemas/learning'
import { expectDenied } from '../helpers/denials'
import { userByEmail } from '../helpers/fixtures'
import { app, freshLearning } from './helpers'

/**
 * P52 courses tab. The shared hub route (`microsites.routes.ts`) is declared without a
 * response schema or status, so `route()` answers 204 with no body for every tab — reported as
 * a shared change. Until it is fixed, the tab is exercised through `getHubTab`, the exact
 * service the route calls (enabled-tab check, query parsing, registered handler), and access
 * through the route itself.
 */

beforeAll(async () => {
  await freshLearning()
}, 120_000)

type Card = { slug: string; state: string; title: { en: string }; progressPct: number }

async function tab(email: string, slug: string, query: Record<string, string> = {}) {
  const u = await userByEmail(email)
  const viewer: Viewer = {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Viewer['role'],
    status: 'active',
    emailVerified: true,
    locale: 'en',
    image: null,
    sessionId: '',
    ip: '',
  }
  const m = (await findMicrositeBySlug(slug))!
  const { result, response } = await getHubTab(viewer, m, 'courses', query)
  return response.parse(result) as ReturnType<typeof CoursesTabResponse.parse>
}

describe('P52 courses tab', () => {
  test('Saeed (employees): 8 cards, categories, state filter, search, sort, paging', async () => {
    const all = await tab(E.saeed!, 'employees')
    CoursesTabResponse.parse(all)
    expect(all.items.total).toBe(8)
    expect(all.categories).toContain('All about DCT')
    expect(all.defaultFilter).toBeUndefined()
    const done = await tab(E.saeed!, 'employees', { state: 'completed' })
    expect(done.items.items.map((x) => x.title.en).sort()).toEqual(['DCT World', 'DCTLEARN'])
    const prog = await tab(E.saeed!, 'employees', { state: 'in_progress' })
    expect(prog.items.items).toHaveLength(1)
    expect(prog.items.items[0]).toMatchObject({ state: 'in_progress', progressPct: 60 })
    const q = await tab(E.saeed!, 'employees', { q: 'museum' })
    expect(q.items.items.map((x) => x.title.en)).toEqual(['Museum 101'])
    const cat = await tab(E.saeed!, 'employees', { category: 'All about DCT' })
    expect(cat.items.total).toBe(2)
    const sorted = await tab(E.saeed!, 'employees', { sort: 'title:asc', pageSize: '2', page: '1' })
    expect(sorted.items).toMatchObject({ page: 1, pageSize: 2, total: 8 })
    expect(sorted.items.items.map((x: Card) => x.title.en)).toEqual([
      'Creative Tourism: What is it?',
      'Data Protection for People and Performance',
    ])
    const garbage = await tab(E.saeed!, 'employees', { state: 'nope', page: '-3' })
    expect(garbage.items.page).toBe(1)
  })

  test('MuseoPro: defaultFilter "mandatory"; C17 shows as coming soon', async () => {
    const res = await tab(E.elise!, 'museopro')
    expect(res.defaultFilter).toBe('mandatory')
    const c17 = res.items.items.find((x) => x.title.en.startsWith('Written and Oral'))
    expect(c17?.state).toBe('coming_soon')
  })

  test('access through the route: non-member 403, other roles 403, signed out 401', async () => {
    await expectDenied(app, (c) => c.get('/api/microsites/employees/hub/courses'), {
      signedOut: null,
      nonMember: E.elise!,
      mentor: E.hessa!,
    })
  })
})
