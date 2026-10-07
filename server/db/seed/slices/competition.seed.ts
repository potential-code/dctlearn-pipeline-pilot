import type { DbOrTx } from '@server/db/connection'
import { enrolments } from '@server/db/schema/catalog'
import {
  competitionAssignments,
  competitionCriteria,
  competitionJudges,
  competitionRounds,
  competitionScores,
  competitionSubmissions,
} from '@server/db/schema/competition'
import { invitations } from '@server/db/schema/identity'
import { generateToken, hashToken } from '@server/utils/tokens'
import { and, eq } from 'drizzle-orm'
import type { SeededCourses } from './catalog.seed'
import type { SeededUsers } from './identity.seed'
import type { SeededMicrosites } from './microsites.seed'

/**
 * SEED §6 (ZU 24-Hour Challenge): round R1 in judging on C13, rubric 15/25/20/40, judges Noura
 * (active) and Daniel (invited, pending), L5 Ahmed submitted and scored by Noura (72.0),
 * L6 Sara in progress; assignments L5 → Noura + Daniel, L6 → Noura.
 *
 * `pitchBlockId` is the C13 action-plan block id from the learning slice (null when the
 * learning content is not seeded, e.g. tests with a fake ActionPlanReader).
 */
export const DANIEL_EMAIL = 'daniel.o@example.com'

export const RUBRIC = [
  {
    en: 'Name/tagline captures the essence',
    ar: 'الاسم/الشعار يعبّر عن الجوهر',
    weightPct: 15,
  },
  {
    en: 'Short description communicates the key message',
    ar: 'الوصف المختصر يوصل الرسالة الأساسية',
    weightPct: 25,
  },
  { en: 'Creativity and originality', ar: 'الإبداع والأصالة', weightPct: 20 },
  {
    en: 'Will it grab attention and drive participation',
    ar: 'هل سيجذب الانتباه ويحفّز المشاركة',
    weightPct: 40,
  },
]

/**
 * Noura's marks for Ahmed. SEED lists "7, 8, 7, 7 → 72.0", but against 15/25/20/40 that order
 * gives 72.5; 72.0 needs the 8 on "Creativity" (20 %), so the stated total is kept.
 */
export const NOURA_AHMED_SCORES = [7, 7, 8, 7]

export async function seedCompetition(
  tx: DbOrTx,
  seeded: { users: SeededUsers; courses: SeededCourses; microsites: SeededMicrosites },
  opts: { pitchBlockId?: string | null; setProgress?: boolean } = {},
) {
  const zu = seeded.microsites.zu!
  const c13 = seeded.courses.C13!
  const { noura, ahmed, sara, aisha } = seeded.users
  if (!noura || !ahmed || !sara || !aisha) throw new Error('competition seed needs base users')

  if (opts.setProgress ?? true) {
    // SEED §4.4: Ahmed C13 100 %, Sara C13 75 % (enrolments exist from the zu membership).
    await tx
      .update(enrolments)
      .set({
        progressPct: 100,
        state: 'completed',
        startedAt: new Date('2026-09-16T08:00:00Z'),
        completedAt: new Date('2026-09-29T12:00:00Z'),
      })
      .where(and(eq(enrolments.userId, ahmed.id), eq(enrolments.courseId, c13.id)))
    await tx
      .update(enrolments)
      .set({ progressPct: 75, state: 'in_progress', startedAt: new Date('2026-09-18T08:00:00Z') })
      .where(and(eq(enrolments.userId, sara.id), eq(enrolments.courseId, c13.id)))
  }

  const [round] = await tx
    .insert(competitionRounds)
    .values({
      micrositeId: zu.id,
      name: { en: '24-Hour Challenge 2026', ar: 'تحدي 24 ساعة 2026' },
      description: {
        en: 'Pitch a cultural-heritage experience in 24 hours. Complete the course, then submit your pitch.',
        ar: 'قدّم فكرة تجربة للتراث الثقافي خلال 24 ساعة. أكمل الدورة ثم قدّم عرضك.',
      },
      status: 'judging',
      opensAt: new Date('2026-09-15T00:00:00Z'),
      closesAt: new Date('2026-10-20T20:00:00Z'),
      courseId: c13.id,
      eligibilityMinProgressPct: 80,
      openedAt: new Date('2026-09-15T00:00:00Z'),
      judgingAt: new Date('2026-10-01T08:00:00Z'),
    })
    .returning()
  const r1 = round!

  const criteria = await tx
    .insert(competitionCriteria)
    .values(
      RUBRIC.map((c, i) => ({
        roundId: r1.id,
        question: { en: c.en, ar: c.ar },
        weightPct: c.weightPct,
        sortOrder: i,
      })),
    )
    .returning()
  criteria.sort((a, b) => a.sortOrder - b.sortOrder)

  // Judges: Noura on the roster; Daniel invited 2026-10-03 (pending).
  const [danielInvite] = await tx
    .insert(invitations)
    .values({
      email: DANIEL_EMAIL,
      role: 'judge',
      micrositeId: zu.id,
      tokenHash: hashToken(generateToken()),
      invitedById: aisha.id,
      createdAt: new Date('2026-10-03T08:00:00Z'),
      expiresAt: new Date('2026-10-17T08:00:00Z'),
    })
    .returning()
  const judges = await tx
    .insert(competitionJudges)
    .values([
      { micrositeId: zu.id, email: noura.email, userId: noura.id },
      { micrositeId: zu.id, email: DANIEL_EMAIL, invitationId: danielInvite!.id },
    ])
    .returning()
  const nouraJudge = judges.find((j) => j.email === noura.email)!
  const danielJudge = judges.find((j) => j.email === DANIEL_EMAIL)!

  const blockId = opts.pitchBlockId ?? null
  const subs = await tx
    .insert(competitionSubmissions)
    .values([
      {
        roundId: r1.id,
        userId: ahmed.id,
        status: 'submitted',
        blockId,
        submittedAt: new Date('2026-09-30T10:00:00Z'),
      },
      { roundId: r1.id, userId: sara.id, status: 'in_progress', blockId },
    ])
    .returning()
  const ahmedSub = subs.find((s) => s.userId === ahmed.id)!
  const saraSub = subs.find((s) => s.userId === sara.id)!

  await tx.insert(competitionAssignments).values([
    { submissionId: ahmedSub.id, judgeId: nouraJudge.id },
    { submissionId: ahmedSub.id, judgeId: danielJudge.id },
    { submissionId: saraSub.id, judgeId: nouraJudge.id },
  ])

  await tx.insert(competitionScores).values(
    criteria.map((c, i) => ({
      judgeId: noura.id,
      submissionId: ahmedSub.id,
      criterionId: c.id,
      score: NOURA_AHMED_SCORES[i] ?? 7,
    })),
  )

  return {
    roundId: r1.id,
    criterionIds: criteria.map((c) => c.id),
    submissions: { ahmed: ahmedSub.id, sara: saraSub.id },
    judges: { noura: nouraJudge.id, daniel: danielJudge.id },
    danielInvitationId: danielInvite!.id,
  }
}

export type SeededCompetition = Awaited<ReturnType<typeof seedCompetition>>
