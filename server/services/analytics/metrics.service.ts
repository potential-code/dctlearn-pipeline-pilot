import { db } from '@server/db/connection'
import {
  courseCertificates,
  courses,
  enrolments,
  micrositeCourses,
} from '@server/db/schema/catalog'
import { users } from '@server/db/schema/identity'
import { memberships, microsites } from '@server/db/schema/microsites'
import { ROLES, type Role } from '@shared/roles'
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm'
import { bucketSeries, type DateRange, growthPct } from './range'

/**
 * P45/P55 aggregates. Counts only — this is what the report cache stores and what the AI
 * insights provider is allowed to see. Scope `micrositeId` narrows everything to the members
 * of that microsite and its courses; without it the numbers are platform-wide.
 *
 * Definitions:
 * - totalUsers: platform → accounts not anonymised; microsite → members.
 * - newUsers / signups series: platform → accounts created; microsite → memberships created.
 * - activeUsers: signed in (platform), visited the microsite (microsite), or any course
 *   activity in scope within the range.
 * - completions / certificates: enrolments completed / certificates issued within the range.
 */
export type Aggregates = {
  kpis: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    completions: number
    certificates: number
    growthPct: number
  }
  series: {
    signups: { bucket: string; value: number }[]
    completions: { bucket: string; value: number }[]
  }
  byMicrosite: { slug: string; members: number; active: number; completions: number }[]
  byRole: { role: Role; count: number }[]
}

export type TopCourseRow = {
  courseId: string
  title: { en: string; ar: string }
  started: number
  completed: number
}

const inRange = (col: Parameters<typeof gte>[0], from: Date, to: Date) =>
  and(gte(col, from), lt(col, to))

const membersOf = (micrositeId: string) =>
  db
    .select({ id: memberships.userId })
    .from(memberships)
    .where(eq(memberships.micrositeId, micrositeId))

const coursesOf = (micrositeId: string) =>
  db
    .select({ id: micrositeCourses.courseId })
    .from(micrositeCourses)
    .where(eq(micrositeCourses.micrositeId, micrositeId))

/** Enrolment scope: members of the microsite, in its courses. */
const enrolmentScope = (micrositeId?: string) =>
  micrositeId
    ? and(
        inArray(enrolments.userId, membersOf(micrositeId)),
        inArray(enrolments.courseId, coursesOf(micrositeId)),
      )
    : undefined

async function signupInstants(range: DateRange, micrositeId?: string) {
  if (micrositeId) {
    const rows = await db
      .select({ at: memberships.createdAt })
      .from(memberships)
      .where(
        and(
          eq(memberships.micrositeId, micrositeId),
          inRange(memberships.createdAt, range.prevFrom, range.to),
        ),
      )
    return rows.map((r) => r.at)
  }
  const rows = await db
    .select({ at: users.createdAt })
    .from(users)
    .where(inRange(users.createdAt, range.prevFrom, range.to))
  return rows.map((r) => r.at)
}

async function completionInstants(range: DateRange, micrositeId?: string) {
  const rows = await db
    .select({ at: enrolments.completedAt })
    .from(enrolments)
    .where(and(inRange(enrolments.completedAt, range.from, range.to), enrolmentScope(micrositeId)))
  return rows.map((r) => r.at).filter((d): d is Date => d !== null)
}

async function certificateCount(range: DateRange, micrositeId?: string) {
  const [row] = await db
    .select({ n: count() })
    .from(courseCertificates)
    .where(
      and(
        inRange(courseCertificates.issuedAt, range.from, range.to),
        micrositeId
          ? and(
              inArray(courseCertificates.userId, membersOf(micrositeId)),
              inArray(courseCertificates.courseId, coursesOf(micrositeId)),
            )
          : undefined,
      ),
    )
  return row?.n ?? 0
}

async function totalUsers(range: DateRange, micrositeId?: string) {
  if (micrositeId) {
    const [row] = await db
      .select({ n: count() })
      .from(memberships)
      .where(and(eq(memberships.micrositeId, micrositeId), lt(memberships.createdAt, range.to)))
    return row?.n ?? 0
  }
  const [row] = await db
    .select({ n: count() })
    .from(users)
    .where(and(isNull(users.anonymisedAt), lt(users.createdAt, range.to)))
  return row?.n ?? 0
}

/** Users with any course activity in scope within the range. */
function courseActivity(
  range: DateRange,
  micrositeId: string | undefined,
  userCol: typeof users.id | typeof memberships.userId,
) {
  return sql`exists (select 1 from ${enrolments} where ${enrolments.userId} = ${userCol} and ${enrolments.lastActivityAt} >= ${range.from.toISOString()}::timestamptz and ${enrolments.lastActivityAt} < ${range.to.toISOString()}::timestamptz${
    micrositeId
      ? sql` and ${enrolments.courseId} in (select ${micrositeCourses.courseId} from ${micrositeCourses} where ${micrositeCourses.micrositeId} = ${micrositeId})`
      : sql``
  })`
}

async function activeUsers(range: DateRange, micrositeId?: string) {
  if (micrositeId) {
    const [row] = await db
      .select({ n: countDistinct(memberships.userId) })
      .from(memberships)
      .where(
        and(
          eq(memberships.micrositeId, micrositeId),
          or(
            inRange(memberships.lastVisitedAt, range.from, range.to),
            courseActivity(range, micrositeId, memberships.userId),
          ),
        ),
      )
    return row?.n ?? 0
  }
  const [row] = await db
    .select({ n: countDistinct(users.id) })
    .from(users)
    .where(
      and(
        isNull(users.anonymisedAt),
        or(
          inRange(users.lastLoginAt, range.from, range.to),
          courseActivity(range, undefined, users.id),
        ),
      ),
    )
  return row?.n ?? 0
}

async function byRole(micrositeId?: string) {
  const rows = await db
    .select({ role: users.role, n: count() })
    .from(users)
    .where(micrositeId ? inArray(users.id, membersOf(micrositeId)) : isNull(users.anonymisedAt))
    .groupBy(users.role)
  const counts = new Map(rows.map((r) => [r.role, r.n]))
  return ROLES.map((role) => ({ role, count: counts.get(role) ?? 0 })).filter((r) => r.count > 0)
}

async function micrositeRow(range: DateRange, m: { id: string; slug: string }) {
  const [members] = await db
    .select({ n: count() })
    .from(memberships)
    .where(eq(memberships.micrositeId, m.id))
  return {
    slug: m.slug,
    members: members?.n ?? 0,
    active: await activeUsers(range, m.id),
    completions: (await completionInstants(range, m.id)).length,
  }
}

export async function computeAggregates(
  range: DateRange,
  micrositeId?: string,
): Promise<Aggregates> {
  const signups = await signupInstants(range, micrositeId)
  const completions = await completionInstants(range, micrositeId)
  const newUsers = signups.filter((d) => d >= range.from).length
  const previous = signups.length - newUsers
  const sites = await db
    .select({ id: microsites.id, slug: microsites.slug })
    .from(microsites)
    .where(micrositeId ? eq(microsites.id, micrositeId) : undefined)
    .orderBy(asc(microsites.sortOrder), asc(microsites.slug))
  const byMicrosite = []
  for (const m of sites) byMicrosite.push(await micrositeRow(range, m))
  return {
    kpis: {
      totalUsers: await totalUsers(range, micrositeId),
      newUsers,
      activeUsers: await activeUsers(range, micrositeId),
      completions: completions.length,
      certificates: await certificateCount(range, micrositeId),
      growthPct: growthPct(newUsers, previous),
    },
    series: {
      signups: bucketSeries(signups, range),
      completions: bucketSeries(completions, range),
    },
    byMicrosite,
    byRole: await byRole(micrositeId),
  }
}

/**
 * P55 top courses of a microsite: members who started (any progress) and completed each of its
 * courses, all time (the range applies to the KPIs and series). Most completed first, max 10.
 */
export async function topCourses(micrositeId: string): Promise<TopCourseRow[]> {
  const started = sql<number>`count(*) filter (where ${enrolments.state} <> 'not_started')`.mapWith(
    Number,
  )
  const completed = sql<number>`count(*) filter (where ${enrolments.state} = 'completed')`.mapWith(
    Number,
  )
  const rows = await db
    .select({ courseId: courses.id, title: courses.title, started, completed })
    .from(micrositeCourses)
    .innerJoin(courses, eq(courses.id, micrositeCourses.courseId))
    .leftJoin(
      enrolments,
      and(eq(enrolments.courseId, courses.id), inArray(enrolments.userId, membersOf(micrositeId))),
    )
    .where(eq(micrositeCourses.micrositeId, micrositeId))
    .groupBy(courses.id, courses.title, micrositeCourses.sortOrder)
    .orderBy(desc(completed), desc(started), asc(micrositeCourses.sortOrder))
    .limit(10)
  return rows
}
