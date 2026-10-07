import { env } from '@server/config/env'
import { closeDb, db } from '@server/db/connection'
import { users } from '@server/db/schema/identity'
import { SEED_TODAY, setNow } from '@server/lib/clock'
import { count } from 'drizzle-orm'
import { uploadBrandPack } from './assets'
import { COURSES } from './data'
import { seedCourses } from './slices/catalog.seed'
import { seedIdentity } from './slices/identity.seed'
import { seedMicrosites } from './slices/microsites.seed'

/**
 * Development seed = docs/SEED.md, with the brand pack uploaded to storage. Refuses to run in
 * production or on a database that already has users (use `bun run db:reset`).
 * Area slices (learning, content, mentoring, competition, platform) run after the base.
 */
async function main() {
  if (env.NODE_ENV === 'production' || env.NODE_ENV === 'staging') {
    console.error('Refusing to seed a deployed environment.')
    process.exit(1)
  }
  const [existing] = await db.select({ n: count() }).from(users)
  if ((existing?.n ?? 0) > 0) {
    console.error('Database already has users. Run `bun run db:reset` for a clean seed.')
    process.exit(1)
  }
  setNow(SEED_TODAY)
  await db.transaction(async (tx) => {
    const assets = await uploadBrandPack(tx)
    const cardImages = Object.fromEntries(
      COURSES.map((c) => [c.key, assets[`cards/${c.key}`] ?? '']),
    )
    const people = await seedIdentity(tx)
    const courses = await seedCourses(tx, cardImages)
    const microsites = await seedMicrosites(tx, people, courses, assets)
    for (const step of AREA_SLICES) await step({ tx, people, courses, microsites, assets })
    console.log(
      `Seeded ${Object.keys(people).length} people, ${Object.keys(courses).length} courses, ${Object.keys(microsites).length} microsites, ${Object.keys(assets).length / 2} assets.`,
    )
  })
}

export type SeedContext = {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
  people: Awaited<ReturnType<typeof seedIdentity>>
  courses: Awaited<ReturnType<typeof seedCourses>>
  microsites: Awaited<ReturnType<typeof seedMicrosites>>
  assets: Record<string, string>
}

/** Area slices, in dependency order (filled at merge). */
const AREA_SLICES: ((ctx: SeedContext) => Promise<unknown>)[] = []

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
    process.exit(process.exitCode ?? 0)
  })
