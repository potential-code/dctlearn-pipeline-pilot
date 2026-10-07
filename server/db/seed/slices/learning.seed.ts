import { randomUUID } from 'node:crypto'
import type { DbOrTx } from '@server/db/connection'
import { badgeAwards, badges, externalCertificates } from '@server/db/schema/achievements'
import { courseCertificates, courses, enrolments, pointsLedger } from '@server/db/schema/catalog'
import { files } from '@server/db/schema/files'
import {
  actionPlanAnswers,
  assessmentAttempts,
  assessmentQuestions,
  blockProgress,
  courseAssessments,
  courseBlocks,
  courseCertificateSettings,
  courseModules,
  courseUnits,
  type QuestionOption,
  scormPackages,
  unitProgress,
} from '@server/db/schema/learning'
import { and, eq } from 'drizzle-orm'
import { COURSES } from '../data'
import type { SeededCourses } from './catalog.seed'
import type { SeededUsers } from './identity.seed'
import type { SeededMicrosites } from './microsites.seed'

/**
 * SEED §2 course content and §4.4 learner progress, points and certificates.
 *
 * - C01 DCT World: the full showcase structure of §2.1 (2 modules, 4 units, every block kind,
 *   survey on U2, blocking final check on U4).
 * - C08: blocking quiz after unit 2 (pass 80 %, 1 attempt). C12: one survey unit. C13: last unit
 *   holds the competition action plan (3 questions). C18–C21: one unit (external certificate).
 * - Every other course: its unit count split over 1–2 modules of text + youtube, and a survey
 *   block on the last unit.
 * - Points: the ledger reflects history, so each learner gets the entries their progress earns
 *   at today's defaults plus one "migrated from the previous platform" entry (course-scoped, so
 *   it counts on the leaderboard) to reach the SEED total. Reem's C09 and Hamad's C18 were
 *   completed before points existed (no entries) so the employees leaderboard reads
 *   Saeed 280 · Reem 200 · Hamad 150 · Mona 40.
 */

const t = (en: string, ar: string) => ({ en, ar })
const lorem = (topic: string) =>
  t(
    `<p>${topic}: an introduction prepared by DCT Abu Dhabi for colleagues across the department.</p>`,
    `<p>${topic}: مقدمة أعدتها دائرة الثقافة والسياحة - أبوظبي للزملاء.</p>`,
  )

export type SeededCourseContent = {
  modules: string[]
  /** Units in learning order. */
  units: string[]
  /** Block ids per unit (same order as `units`). */
  blocks: string[][]
  assessments: Record<string, string>
  actionPlanBlock?: string
  scormBlock?: string
}
export type SeededLearning = {
  content: Record<string, SeededCourseContent>
  scormPackageId: string
  externalCertificates: Record<string, string>
  badges: string[]
}

type BlockSpec = { type: string; payload: Record<string, unknown>; required?: boolean }

async function addCourseContent(
  tx: DbOrTx,
  courseId: string,
  modules: {
    title: { en: string; ar: string }
    units: { title: { en: string; ar: string }; durationMin?: number; blocks: BlockSpec[] }[]
  }[],
): Promise<SeededCourseContent> {
  const out: SeededCourseContent = { modules: [], units: [], blocks: [], assessments: {} }
  for (const [mi, m] of modules.entries()) {
    const [mod] = await tx
      .insert(courseModules)
      .values({ courseId, title: m.title, order: mi + 1 })
      .returning({ id: courseModules.id })
    out.modules.push(mod!.id)
    for (const [ui, u] of m.units.entries()) {
      const [unit] = await tx
        .insert(courseUnits)
        .values({
          courseId,
          moduleId: mod!.id,
          title: u.title,
          order: ui + 1,
          durationMin: u.durationMin ?? null,
        })
        .returning({ id: courseUnits.id })
      out.units.push(unit!.id)
      const ids: string[] = []
      for (const [bi, b] of u.blocks.entries()) {
        const [block] = await tx
          .insert(courseBlocks)
          .values({
            courseId,
            unitId: unit!.id,
            type: b.type,
            payload: b.payload,
            required: b.required ?? true,
            order: bi + 1,
          })
          .returning({ id: courseBlocks.id })
        ids.push(block!.id)
        if (b.type === 'action_plan') out.actionPlanBlock = block!.id
        if (b.type === 'scorm') out.scormBlock = block!.id
      }
      out.blocks.push(ids)
    }
  }
  return out
}

const opt = (en: string, ar: string, correct = false): QuestionOption => ({
  id: randomUUID(),
  text: t(en, ar),
  correct,
})

async function addAssessment(
  tx: DbOrTx,
  input: {
    courseId: string
    unitId: string | null
    moduleId?: string | null
    title: { en: string; ar: string }
    type: 'survey' | 'quiz_blocking' | 'quiz_non_blocking'
    passMark: number
    attemptsAllowed: number
    isFinal?: boolean
    questions: {
      text: { en: string; ar: string }
      type: string
      options: QuestionOption[]
      points?: number
    }[]
  },
) {
  const [a] = await tx
    .insert(courseAssessments)
    .values({
      courseId: input.courseId,
      unitId: input.unitId,
      moduleId: input.moduleId ?? null,
      title: input.title,
      type: input.type,
      passMark: input.passMark,
      attemptsAllowed: input.attemptsAllowed,
      isFinal: input.isFinal ?? false,
    })
    .returning({ id: courseAssessments.id })
  for (const [i, q] of input.questions.entries())
    await tx.insert(assessmentQuestions).values({
      assessmentId: a!.id,
      version: 1,
      text: q.text,
      type: q.type,
      options: q.options,
      points: q.points ?? 1,
      order: i + 1,
    })
  return a!.id
}

const surveyBlock = (topic: string): BlockSpec => ({
  type: 'survey',
  required: false,
  payload: {
    questions: [
      {
        id: randomUUID(),
        text: t(`How useful was ${topic}?`, `ما مدى فائدة ${topic}؟`),
        type: 'multiple_choice',
        options: [
          { id: randomUUID(), text: t('Very useful', 'مفيد جداً') },
          { id: randomUUID(), text: t('Somewhat useful', 'مفيد إلى حد ما') },
          { id: randomUUID(), text: t('Not useful', 'غير مفيد') },
        ],
      },
      { id: randomUUID(), text: t('Anything we should add?', 'هل من إضافة؟'), type: 'open_text' },
    ],
  },
})

function genericModules(key: string, title: string, units: number) {
  const per = units >= 3 ? Math.ceil(units / 2) : units
  const mods: Parameters<typeof addCourseContent>[2] = []
  for (let n = 0; n < units; n++) {
    const mi = Math.floor(n / per)
    mods[mi] ??= { title: t(`Module ${mi + 1}`, `الوحدة ${mi + 1}`), units: [] }
    const blocks: BlockSpec[] = [
      { type: 'text', payload: { html: lorem(`${title} — part ${n + 1}`) } },
      {
        type: 'youtube',
        payload: { videoId: 'dQw4w9WgXcQ', title: t(`${title} ${n + 1}`, `${title} ${n + 1}`) },
      },
    ]
    if (n === units - 1) blocks.push(surveyBlock(title))
    mods[mi]!.units.push({
      title: t(`${key} · Lesson ${n + 1}`, `${key} · الدرس ${n + 1}`),
      durationMin: 10,
      blocks,
    })
  }
  return mods
}

async function seedC01(tx: DbOrTx, courseId: string, scormPackageId: string) {
  const content = await addCourseContent(tx, courseId, [
    {
      title: t('Welcome to DCT', 'مرحباً بكم في الدائرة'),
      units: [
        {
          title: t('Who we are', 'من نحن'),
          durationMin: 10,
          blocks: [
            {
              type: 'youtube',
              payload: { videoId: 'dQw4w9WgXcQ', title: t('Welcome to DCT', 'مرحباً بكم') },
            },
            { type: 'text', payload: { html: lorem('Who we are') } },
            {
              type: 'case_study',
              payload: { html: lorem('Case study: Louvre Abu Dhabi opening') },
            },
            {
              type: 'quotes',
              payload: {
                items: [
                  {
                    text: t('Culture is the soul of a nation.', 'الثقافة روح الأمة.'),
                    author: 'DCT',
                  },
                  { text: t('We welcome the world to Abu Dhabi.', 'نرحب بالعالم في أبوظبي.') },
                ],
              },
            },
          ],
        },
        {
          title: t('Our sectors', 'قطاعاتنا'),
          durationMin: 12,
          blocks: [
            {
              type: 'audio',
              payload: {
                url: 'audio/dct-flow-sectors.mp3',
                title: t('DCT Flow — Our sectors', 'تدفق الدائرة — قطاعاتنا'),
                transcript: t('<p>Six minutes on our sectors.</p>', '<p>ست دقائق عن قطاعاتنا.</p>'),
              },
            },
            { type: 'text', payload: { html: lorem('Our sectors') } },
            {
              type: 'resources',
              payload: {
                items: [
                  {
                    title: t('Sector map', 'خريطة القطاعات'),
                    url: 'https://dct.gov.ae/sector-map.pdf',
                    type: 'pdf',
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      title: t('Culture & Tourism', 'الثقافة والسياحة'),
      units: [
        {
          title: t("Abu Dhabi's cultural sites", 'المواقع الثقافية في أبوظبي'),
          durationMin: 12,
          blocks: [
            { type: 'scorm', payload: { packageId: scormPackageId } },
            { type: 'text', payload: { html: lorem('Cultural sites') } },
            {
              type: 'youtube_playlist',
              payload: {
                items: [
                  { videoId: 'dQw4w9WgXcQ', title: 'Qasr Al Hosn' },
                  { videoId: 'oHg5SJYRHA0', title: 'Al Ain Oasis' },
                  { videoId: 'xvFZjo5PgG0', title: 'Saadiyat Cultural District' },
                ],
              },
            },
          ],
        },
        {
          title: t('Your role in the visitor journey', 'دورك في رحلة الزائر'),
          durationMin: 11,
          blocks: [
            { type: 'text', payload: { html: lorem('The visitor journey') } },
            {
              type: 'action_plan',
              payload: {
                title: t('My action plan', 'خطة عملي'),
                questions: [
                  [
                    1,
                    'In 3 years, on the professional side, I want to have done…',
                    'خلال 3 سنوات، على الصعيد المهني، أريد أن أكون قد…',
                  ],
                  [
                    2,
                    'In 3 years, on the personal side, I want to have done…',
                    'خلال 3 سنوات، على الصعيد الشخصي، أريد أن أكون قد…',
                  ],
                  [3, 'The skills I need to build are…', 'المهارات التي أحتاج إلى بنائها هي…'],
                  [4, 'The people who can help me are…', 'الأشخاص الذين يمكنهم مساعدتي هم…'],
                  [5, 'My first step this month is…', 'خطوتي الأولى هذا الشهر هي…'],
                ].map(([no, en, ar]) => ({ no, text: t(String(en), String(ar)), charLimit: 500 })),
              },
            },
            {
              type: 'resources',
              payload: {
                items: [
                  {
                    title: t('Action plan template', 'نموذج خطة العمل'),
                    url: 'https://dct.gov.ae/action-plan.docx',
                    type: 'template',
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ])
  content.assessments.survey = await addAssessment(tx, {
    courseId,
    unitId: content.units[1]!,
    title: t('Our sectors — quick survey', 'استبيان قصير'),
    type: 'survey',
    passMark: 0,
    attemptsAllowed: 1,
    questions: [
      {
        text: t('Which sector interests you most?', 'أي قطاع يهمك أكثر؟'),
        type: 'multiple_choice',
        options: [opt('Culture', 'الثقافة'), opt('Tourism', 'السياحة'), opt('Heritage', 'التراث')],
      },
      {
        text: t('Was the audio clear?', 'هل كان التسجيل واضحاً؟'),
        type: 'true_false',
        options: [opt('True', 'صح'), opt('False', 'خطأ')],
      },
      {
        text: t('What would you like to learn next?', 'ماذا تود أن تتعلم بعد ذلك؟'),
        type: 'open_text',
        options: [],
      },
    ],
  })
  content.assessments.final = await addAssessment(tx, {
    courseId,
    unitId: content.units[3]!,
    title: t('DCT World final check', 'الاختبار النهائي'),
    type: 'quiz_blocking',
    passMark: 70,
    attemptsAllowed: 2,
    isFinal: true,
    questions: [
      {
        text: t('What does DCT stand for?', 'ماذا يعني DCT؟'),
        type: 'multiple_choice',
        options: [
          opt('Department of Culture and Tourism', 'دائرة الثقافة والسياحة', true),
          opt('Digital Culture Team', 'فريق الثقافة الرقمية'),
          opt('Destination Centre for Travel', 'مركز الوجهات'),
        ],
      },
      {
        text: t('Which is a DCT cultural site?', 'أي مما يلي موقع ثقافي؟'),
        type: 'multiple_choice',
        options: [
          opt('Qasr Al Hosn', 'قصر الحصن', true),
          opt('Burj Khalifa', 'برج خليفة'),
          opt('Dubai Mall', 'دبي مول'),
        ],
      },
      {
        text: t('Which island hosts the Cultural District?', 'أي جزيرة تضم المنطقة الثقافية؟'),
        type: 'multiple_choice',
        options: [opt('Yas', 'ياس'), opt('Saadiyat', 'السعديات', true), opt('Reem', 'الريم')],
      },
      {
        text: t('Visitors are at the heart of our work.', 'الزوار في صميم عملنا.'),
        type: 'true_false',
        options: [opt('True', 'صح', true), opt('False', 'خطأ')],
      },
      {
        text: t('Name the emirate DCT serves.', 'اذكر الإمارة التي تخدمها الدائرة.'),
        type: 'open_text',
        options: [opt('Abu Dhabi', 'أبوظبي', true)],
      },
    ],
  })
  return content
}

export async function seedLearning(
  tx: DbOrTx,
  users: SeededUsers,
  seededCourses: SeededCourses,
  _microsites: SeededMicrosites,
): Promise<SeededLearning> {
  const id = (key: string) => seededCourses[key]!.id

  // SCORM package placeholder for C01 U3 (unpacked files come from seed/assets/scorm in dev).
  const [zip] = await tx
    .insert(files)
    .values({
      key: 'scorm/seed/cultural-sites.zip',
      category: 'content',
      contentType: 'application/zip',
      size: 0,
      originalName: 'cultural-sites.zip',
    })
    .returning({ id: files.id })
  await tx.insert(scormPackages).values({
    id: zip!.id,
    status: 'ready',
    version: '1.2',
    launchPath: 'index.html',
    fileCount: 1,
  })

  const content: Record<string, SeededCourseContent> = {}
  for (const c of COURSES) {
    const courseId = id(c.key)
    if (c.key === 'C01') content.C01 = await seedC01(tx, courseId, zip!.id)
    else if (c.key === 'C12')
      content.C12 = await addCourseContent(tx, courseId, [
        {
          title: t('Assessment', 'التقييم'),
          units: [
            {
              title: t('Knowledge check', 'تقييم المعرفة'),
              durationMin: 15,
              blocks: [{ ...surveyBlock(c.title.en), required: true }],
            },
          ],
        },
      ])
    else if (c.cert === 'external')
      content[c.key] = await addCourseContent(tx, courseId, [
        {
          title: t('Programme', 'البرنامج'),
          units: [
            {
              title: t('Complete the external course', 'أكمل الدورة الخارجية'),
              blocks: [
                {
                  type: 'text',
                  payload: {
                    html: lorem(
                      `${c.title.en} — take the course with our partner, then upload your certificate`,
                    ),
                  },
                },
              ],
            },
          ],
        },
      ])
    else
      content[c.key] = await addCourseContent(
        tx,
        courseId,
        genericModules(c.key, c.title.en, c.units),
      )

    if (c.key === 'C13') {
      const last = content.C13!.units.length - 1
      const [b] = await tx
        .insert(courseBlocks)
        .values({
          courseId,
          unitId: content.C13!.units[last]!,
          type: 'action_plan',
          order: 10,
          payload: {
            title: t('Your pitch', 'عرضك'),
            questions: [
              { no: 1, text: t('Name and tagline', 'الاسم والشعار'), charLimit: 500 },
              { no: 2, text: t('Short description', 'وصف قصير'), charLimit: 500 },
              {
                no: 3,
                text: t('Why will it grab attention?', 'لماذا سيجذب الانتباه؟'),
                charLimit: 500,
              },
            ],
          },
        })
        .returning({ id: courseBlocks.id })
      content.C13!.blocks[last]!.push(b!.id)
      content.C13!.actionPlanBlock = b!.id
    }
    if (c.key === 'C08')
      content.C08!.assessments.quiz = await addAssessment(tx, {
        courseId,
        unitId: content.C08!.units[1]!,
        title: t('Data protection check', 'اختبار حماية البيانات'),
        type: 'quiz_blocking',
        passMark: 80,
        attemptsAllowed: 1,
        questions: [
          {
            text: t(
              'Personal data may be shared freely inside DCT.',
              'يمكن مشاركة البيانات الشخصية بحرية.',
            ),
            type: 'true_false',
            options: [opt('True', 'صح'), opt('False', 'خطأ', true)],
          },
          {
            text: t('Who is the data owner?', 'من مالك البيانات؟'),
            type: 'multiple_choice',
            options: [
              opt('The person the data is about', 'صاحب البيانات', true),
              opt('IT', 'تقنية المعلومات'),
            ],
          },
        ],
      })
  }

  await tx.insert(courseCertificateSettings).values({
    courseId: id('C01'),
    backgroundUrl: '',
    logoUrl: '',
    signatureName: 'Aisha Al Marzouqi',
    signatureTitle: 'DCT Learn Programme Lead',
  })

  /* ---------------------------------------------------------------- §4.4 progress */

  const userId = (key: string) => users[key]!.id
  let clock = Date.parse('2026-09-01T07:00:00Z')
  const tick = (cap = '2026-10-05T12:00:00Z') => {
    clock = Math.min(clock + 26 * 3600 * 1000, Date.parse(cap))
    return new Date(clock)
  }

  const finished = new Set<string>()
  async function progress(
    learner: string,
    key: string,
    opts: {
      units: number
      complete?: boolean
      points?: boolean
      pct?: number
      certificate?: boolean
    },
  ) {
    const uid = userId(learner)
    const courseId = id(key)
    const cnt = content[key]!
    const [course] = await tx.select().from(courses).where(eq(courses.id, courseId))
    const done = cnt.units.slice(0, opts.units)
    let last = new Date('2026-09-01T07:00:00Z')
    for (const [i, unitId] of done.entries()) {
      last = tick()
      await tx.insert(unitProgress).values({ userId: uid, courseId, unitId, completedAt: last })
      for (const blockId of cnt.blocks[i]!)
        await tx
          .insert(blockProgress)
          .values({ userId: uid, courseId, unitId, blockId, completedAt: last })
      if (opts.points !== false)
        await tx.insert(pointsLedger).values({
          userId: uid,
          courseId,
          sourceType: 'unit',
          sourceId: unitId,
          points: 10,
          reason: t('Completed a unit', 'أكمل وحدة'),
          at: last,
        })
    }
    const startedAt = new Date('2026-08-20T07:00:00Z')
    if (opts.complete) {
      if (cnt.assessments.final) {
        await tx.insert(assessmentAttempts).values({
          assessmentId: cnt.assessments.final,
          version: 1,
          userId: uid,
          answers: [],
          scorePct: 100,
          passed: true,
          createdAt: last,
        })
        if (opts.points !== false)
          await tx.insert(pointsLedger).values({
            userId: uid,
            courseId,
            sourceType: 'assessment',
            sourceId: cnt.assessments.final,
            points: 20,
            reason: t('Passed DCT World final check', 'اجتاز الاختبار النهائي'),
            at: last,
          })
      }
      if (opts.points !== false)
        await tx.insert(pointsLedger).values({
          userId: uid,
          courseId,
          sourceType: 'course',
          sourceId: courseId,
          points: 50,
          reason: t(`Completed ${course!.title.en}`, `أكمل ${course!.title.ar}`),
          at: last,
        })
    }
    const next = cnt.units[opts.units]
    const [e] = await tx
      .update(enrolments)
      .set({
        progressPct: opts.complete
          ? 100
          : (opts.pct ?? Math.round((done.length / cnt.units.length) * 100)),
        state: opts.complete
          ? 'completed'
          : done.length || opts.pct
            ? 'in_progress'
            : 'not_started',
        nextUnitId: opts.complete ? null : (next ?? null),
        startedAt: done.length || opts.complete ? startedAt : null,
        completedAt: opts.complete ? last : null,
        lastActivityAt: done.length ? last : null,
      })
      .where(and(eq(enrolments.userId, uid), eq(enrolments.courseId, courseId)))
      .returning()
    if (opts.complete) finished.add(learner)
    if (opts.complete && (opts.certificate ?? course!.certificateEnabled))
      await tx.insert(courseCertificates).values({
        enrolmentId: e!.id,
        userId: uid,
        courseId,
        serial: `DCT-2026-${key}${learner.slice(0, 3).toUpperCase()}01`,
        learnerName: users[learner]!.name,
        issuedAt: last,
      })
  }
  const migrated = async (learner: string, key: string, points: number) =>
    tx.insert(pointsLedger).values({
      userId: userId(learner),
      courseId: id(key),
      sourceType: 'manual',
      sourceId: `migrated-${learner}`,
      points,
      reason: t('Points migrated from the previous platform', 'نقاط منقولة من المنصة السابقة'),
      at: new Date('2026-08-01T08:00:00Z'),
    })

  // Saeed: C01 100 % (cert), C03 100 % (cert), C02 60 % — 280 pts.
  await progress('saeed', 'C01', { units: 4, complete: true })
  await progress('saeed', 'C03', { units: 2, complete: true })
  clock = Date.parse('2026-10-01T07:00:00Z')
  await progress('saeed', 'C02', { units: 3 })
  await migrated('saeed', 'C01', 70)
  // Mona: C01 25 %, C08 0 % — 40 pts.
  clock = Date.parse('2026-09-10T07:00:00Z')
  await progress('mona', 'C01', { units: 1 })
  await migrated('mona', 'C01', 30)
  // Yousef: C09 100 %, C10 100 %, C11 40 %, C12 done — 310 pts, 2 certificates.
  clock = Date.parse('2026-09-02T07:00:00Z')
  await progress('yousef', 'C09', { units: 3, complete: true })
  await progress('yousef', 'C10', { units: 3, complete: true })
  await progress('yousef', 'C11', { units: 1, pct: 40 })
  await progress('yousef', 'C12', { units: 1, complete: true })
  await migrated('yousef', 'C09', 80)
  // Reem: C09 100 % (before points existed), C01 100 % — 200 pts.
  clock = Date.parse('2026-08-05T07:00:00Z')
  await progress('reem', 'C09', { units: 3, complete: true, points: false })
  clock = Date.parse('2026-09-05T07:00:00Z')
  await progress('reem', 'C01', { units: 4, complete: true })
  await migrated('reem', 'C01', 90)
  // Ahmed: C13 100 %, action plan submitted (locked) — 130 pts.
  clock = Date.parse('2026-09-16T07:00:00Z')
  await progress('ahmed', 'C13', { units: 4, complete: true })
  await migrated('ahmed', 'C13', 40)
  await tx.insert(actionPlanAnswers).values({
    userId: userId('ahmed'),
    blockId: content.C13!.actionPlanBlock!,
    answers: {
      '1': 'Heritage Hunt — find the story behind every stone',
      '2': 'A city-wide scavenger trail linking ten heritage sites through short stories.',
      '3': 'It turns sightseeing into a game students share with friends.',
    },
    lockedAt: new Date('2026-09-30T10:00:00Z'),
  })
  // Sara: C13 75 %, action plan draft — 90 pts.
  clock = Date.parse('2026-09-18T07:00:00Z')
  await progress('sara', 'C13', { units: 3 })
  await migrated('sara', 'C13', 60)
  await tx.insert(actionPlanAnswers).values({
    userId: userId('sara'),
    blockId: content.C13!.actionPlanBlock!,
    answers: { '1': 'Souq Stories' },
  })
  // Élise: C14 100 %, C15 30 % — 140 pts.
  clock = Date.parse('2026-09-03T07:00:00Z')
  await progress('elise', 'C14', { units: 3, complete: true })
  await progress('elise', 'C15', { units: 1, pct: 30 })
  await migrated('elise', 'C14', 50)
  // Hamad: C18 approved external certificate (before points existed), C19 pending, C01 100 % — 150 pts.
  clock = Date.parse('2026-09-08T07:00:00Z')
  await progress('hamad', 'C01', { units: 4, complete: true })
  await migrated('hamad', 'C01', 40)
  await progress('hamad', 'C18', { units: 0, complete: true, points: false, certificate: false })

  const nibras = _microsites.nibras!.id
  const certFile = async (name: string) =>
    (
      await tx
        .insert(files)
        .values({
          key: `certificate/seed/${name}.pdf`,
          category: 'certificate',
          contentType: 'application/pdf',
          size: 0,
          originalName: `${name}.pdf`,
          ownerId: userId('hamad'),
        })
        .returning({ id: files.id })
    )[0]!.id
  const [c18] = await tx
    .insert(externalCertificates)
    .values({
      userId: userId('hamad'),
      courseId: id('C18'),
      micrositeId: nibras,
      fileId: await certFile('hamad-c18'),
      status: 'approved',
      uploadedAt: new Date('2026-09-12T08:00:00Z'),
      decidedAt: new Date('2026-09-14T08:00:00Z'),
      decidedById: userId('aisha'),
    })
    .returning({ id: externalCertificates.id })
  const [c19] = await tx
    .insert(externalCertificates)
    .values({
      userId: userId('hamad'),
      courseId: id('C19'),
      micrositeId: nibras,
      fileId: await certFile('hamad-c19'),
      status: 'pending',
      uploadedAt: new Date('2026-10-04T08:00:00Z'),
    })
    .returning({ id: externalCertificates.id })

  /* ---------------------------------------------------------------- badges */

  await tx.insert(badges).values([
    {
      key: 'first-course',
      name: t('First course', 'الدورة الأولى'),
      description: t('Completed your first course', 'أكملت دورتك الأولى'),
      imageUrl: '',
      rule: 'courses_completed',
      threshold: 1,
    },
    {
      key: 'points-250',
      name: t('Rising star', 'نجم صاعد'),
      description: t('Earned 250 points', 'جمعت 250 نقطة'),
      imageUrl: '',
      rule: 'points_total',
      threshold: 250,
    },
    {
      key: 'streak-7',
      name: t('Seven-day streak', 'سبعة أيام متتالية'),
      description: t('Learned seven days in a row', 'تعلمت سبعة أيام متتالية'),
      imageUrl: '',
      rule: 'streak_days',
      threshold: 7,
    },
    {
      key: 'dct-champion',
      name: t('DCT Champion', 'بطل الدائرة'),
      description: t('Recognised by the DCT Learn team', 'تقدير من فريق DCT Learn'),
      imageUrl: '',
      rule: 'manual',
      threshold: null,
    },
  ])
  for (const learner of finished)
    await tx.insert(badgeAwards).values({
      userId: userId(learner),
      badgeKey: 'first-course',
      awardedAt: new Date('2026-09-20T08:00:00Z'),
    })
  for (const learner of ['saeed', 'yousef'])
    await tx.insert(badgeAwards).values({
      userId: userId(learner),
      badgeKey: 'points-250',
      awardedAt: new Date('2026-10-03T08:00:00Z'),
    })

  return {
    content,
    scormPackageId: zip!.id,
    externalCertificates: { hamadC18: c18!.id, hamadC19: c19!.id },
    badges: ['first-course', 'points-250', 'streak-7', 'dct-champion'],
  }
}
