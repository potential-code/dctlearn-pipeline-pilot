import { db } from '@server/db/connection'
import { badgeAwards, externalCertificates } from '@server/db/schema/achievements'
import { courseCertificates, courses, pointsLedger } from '@server/db/schema/catalog'
import { files } from '@server/db/schema/files'
import { users } from '@server/db/schema/identity'
import { type Microsite, memberships } from '@server/db/schema/microsites'
import { now } from '@server/lib/clock'
import { micrositeCourseIds } from '@server/services/catalog/course-card.service'
import { leaderboard } from '@server/services/catalog/points.service'
import { fileUrl, urlForStored } from '@server/services/files.service'
import { certificateRef, shareUrl } from '@server/services/learning/certificate.service'
import type { AchievementsResponse } from '@shared/schemas/achievements'
import { and, desc, eq, gte, inArray, isNull, or, sum } from 'drizzle-orm'
import type { z } from 'zod'
import { liveBadges } from './badges.service'

type Achievements = z.infer<typeof AchievementsResponse>

/**
 * P51 for one microsite: own points (that microsite's courses + course-less manual/badge
 * entries), last 20 ledger rows, badges, certificates, external certificates (only where the
 * microsite has external-certificate courses) and a leaderboard of its members counting points
 * earned in its courses — name and points only.
 */
export async function getAchievements(viewer: Viewer, m: Microsite): Promise<Achievements> {
  const courseIds = await micrositeCourseIds(m.id)
  const scope = and(
    eq(pointsLedger.userId, viewer.id),
    courseIds.length
      ? or(inArray(pointsLedger.courseId, courseIds), isNull(pointsLedger.courseId))
      : isNull(pointsLedger.courseId),
  )
  const today = now()
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const [total] = await db
    .select({ n: sum(pointsLedger.points) })
    .from(pointsLedger)
    .where(scope)
  const [month] = await db
    .select({ n: sum(pointsLedger.points) })
    .from(pointsLedger)
    .where(and(scope, gte(pointsLedger.at, monthStart)))
  const ledger = await db
    .select({ row: pointsLedger, courseTitle: courses.title })
    .from(pointsLedger)
    .leftJoin(courses, eq(courses.id, pointsLedger.courseId))
    .where(scope)
    .orderBy(desc(pointsLedger.at), desc(pointsLedger.createdAt))
    .limit(20)

  const badgeRows = await liveBadges()
  const awards = await db.select().from(badgeAwards).where(eq(badgeAwards.userId, viewer.id))
  const awarded = new Map(awards.map((a) => [a.badgeKey, a.awardedAt]))

  const certs = courseIds.length
    ? await db
        .select({ cert: courseCertificates, title: courses.title })
        .from(courseCertificates)
        .innerJoin(courses, eq(courses.id, courseCertificates.courseId))
        .where(
          and(
            eq(courseCertificates.userId, viewer.id),
            inArray(courseCertificates.courseId, courseIds),
          ),
        )
        .orderBy(desc(courseCertificates.issuedAt))
    : []

  const externalCourses = courseIds.length
    ? await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(inArray(courses.id, courseIds), eq(courses.externalCertificate, true)))
    : []
  let external: Achievements['externalCertificates']
  if (externalCourses.length) {
    const rows = await db
      .select({ ext: externalCertificates, title: courses.title, file: files })
      .from(externalCertificates)
      .innerJoin(courses, eq(courses.id, externalCertificates.courseId))
      .innerJoin(files, eq(files.id, externalCertificates.fileId))
      .where(
        and(
          eq(externalCertificates.userId, viewer.id),
          inArray(
            externalCertificates.courseId,
            externalCourses.map((c) => c.id),
          ),
        ),
      )
      .orderBy(desc(externalCertificates.uploadedAt))
    external = rows.map((r) => ({
      id: r.ext.id,
      courseId: r.ext.courseId,
      courseTitle: r.title,
      fileUrl: fileUrl(r.file, viewer.id),
      uploadedAt: r.ext.uploadedAt.toISOString(),
      status: r.ext.status as 'pending' | 'approved' | 'rejected',
    }))
  }

  return {
    points: { total: Number(total?.n ?? 0), thisMonth: Number(month?.n ?? 0) },
    ledger: ledger.map(({ row, courseTitle }) => ({
      at: row.at.toISOString(),
      points: row.points,
      reason: row.reason,
      ...(courseTitle ? { courseTitle } : {}),
    })),
    badges: await Promise.all(
      badgeRows.map(async (b) => {
        const at = awarded.get(b.key)
        return {
          key: b.key,
          name: b.name,
          description: b.description,
          imageUrl: await urlForStored(b.imageUrl, viewer.id),
          ...(at ? { earnedAt: at.toISOString() } : {}),
        }
      }),
    ),
    certificates: await Promise.all(
      certs.map(async ({ cert, title }) => {
        const ref = await certificateRef(cert, viewer.id)
        return {
          id: cert.id,
          courseTitle: title,
          serial: cert.serial,
          issuedAt: ref.issuedAt,
          pdfUrl: ref.pdfUrl,
          shareUrl: shareUrl(cert.serial),
        }
      }),
    ),
    ...(external ? { externalCertificates: external } : {}),
    leaderboard: await micrositeLeaderboard(viewer.id, m.id, courseIds),
  }
}

/** Members of the microsite (active learners), ranked by points in its courses. */
export async function micrositeLeaderboard(
  viewerId: string,
  micrositeId: string,
  courseIds: string[],
) {
  const members = await db
    .select({ id: users.id, name: users.name })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.micrositeId, micrositeId),
        eq(users.status, 'active'),
        eq(users.role, 'learner'),
        isNull(users.anonymisedAt),
      ),
    )
  const points = new Map(
    (
      await leaderboard(
        members.map((m) => m.id),
        courseIds,
      )
    ).map((r) => [r.userId, r.points]),
  )
  const ranked = members
    .map((m) => ({ ...m, points: points.get(m.id) ?? 0 }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  const meIdx = ranked.findIndex((r) => r.id === viewerId)
  return {
    me: {
      rank: meIdx >= 0 ? meIdx + 1 : ranked.length + 1,
      points: meIdx >= 0 ? ranked[meIdx]!.points : 0,
    },
    top: ranked.slice(0, 10).map((r, i) => ({
      rank: i + 1,
      name: r.name,
      points: r.points,
      isMe: r.id === viewerId,
    })),
  }
}
