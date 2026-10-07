import type { DbOrTx } from '@server/db/connection'
import { formEntries, formMicrosites, forms } from '@server/db/schema/forms'
import {
  bookingFeedback,
  growLogs,
  menteeApplications,
  mentorAvailabilityRules,
  mentorBookings,
  mentoringSettings,
  mentorMatches,
  mentorMicrosites,
  mentorProfiles,
} from '@server/db/schema/mentoring'
import { MENTOR_CATEGORIES } from '@shared/schemas/mentoring'
import type { SeededCourses } from './catalog.seed'
import type { SeededUsers } from './identity.seed'
import type { SeededMicrosites } from './microsites.seed'

/**
 * SEED §4.2 mentors + trainer + availability and §5 Elevate mentoring: registration form,
 * Saeed's registration and match with Hessa, bookings B1–B3, B1 feedback and GROW log.
 */

type MentorSeed = {
  key: string
  title: string
  categories: string[]
  languages: string[]
  microsites: string[]
  kind: 'mentor' | 'trainer'
  courses?: string[]
  /** weekday (0 = Sunday), HH:MM–HH:MM in Asia/Dubai */
  availability: { weekdays: number[]; start: string; end: string } | null
  bio: { en: string; ar: string }
  photo: string
}

export const MENTORS: MentorSeed[] = [
  {
    key: 'hessa',
    title: 'Director, Museums Strategy',
    categories: ['Museums and Curation', 'Strategy and Planning'],
    languages: ['ar', 'en'],
    microsites: ['elevate'],
    kind: 'mentor',
    availability: { weekdays: [0, 1, 2, 3, 4], start: '10:00', end: '13:00' },
    bio: {
      en: 'Hessa leads museum strategy across Abu Dhabi’s cultural district. She mentors emerging leaders on turning collections into visitor stories.',
      ar: 'تقود حصة استراتيجية المتاحف في المنطقة الثقافية في أبوظبي. وترشد القادة الناشئين لتحويل المقتنيات إلى قصص للزوار.',
    },
    photo: 'people/mentor-1.jpg',
  },
  {
    key: 'rashid',
    title: 'Head of Visitor Experience',
    categories: ['Visitor Experience and Events', 'Tourism and International Operations'],
    languages: ['ar', 'en'],
    microsites: ['elevate'],
    kind: 'mentor',
    availability: { weekdays: [1, 3], start: '14:00', end: '17:00' },
    bio: {
      en: 'Rashid has designed visitor journeys for major events and sites. He helps mentees plan services that put the guest first.',
      ar: 'صمّم راشد رحلات الزوار لفعاليات ومواقع كبرى. ويساعد المتدربين على تخطيط خدمات تضع الضيف أولاً.',
    },
    photo: 'people/mentor-2.jpg',
  },
  {
    key: 'mariam',
    title: 'Senior Manager, People & Performance',
    categories: ['People and Performance', 'Marketing and Communications'],
    languages: ['en'],
    microsites: ['elevate', 'employees'],
    kind: 'mentor',
    availability: { weekdays: [2, 4], start: '09:00', end: '12:00' },
    bio: {
      en: 'Mariam builds performance and talent programmes at DCT. She coaches mentees on career conversations and personal branding.',
      ar: 'تبني مريم برامج الأداء والمواهب في الدائرة. وتدرّب المتدربين على حوارات المسار المهني والعلامة الشخصية.',
    },
    photo: 'people/mentor-3.jpg',
  },
  {
    key: 'jeanluc',
    title: 'Conservation Trainer, France Muséums',
    categories: ['Museums and Curation'],
    languages: ['en'],
    microsites: ['museopro'],
    kind: 'trainer',
    courses: ['C14', 'C15'],
    availability: null,
    bio: {
      en: 'Jean-Luc trains museum teams in preventive conservation. He leads the MuseoPro condition-report and exhibition modules.',
      ar: 'يدرّب جان لوك فرق المتاحف على الصون الوقائي. ويقود وحدات تقارير الحالة والعرض في ميوزيو برو.',
    },
    photo: 'people/mentor-4.jpg',
  },
]

export type SeededMentoring = {
  mentors: Record<string, string>
  registrationFormId: string
  bookings: Record<'B1' | 'B2' | 'B3', string>
  matchId: string
}

export async function seedMentoring(
  tx: DbOrTx,
  base: { users: SeededUsers; microsites: SeededMicrosites; courses: SeededCourses },
  assets: Record<string, string> = {},
): Promise<SeededMentoring> {
  const mentors: Record<string, string> = {}
  for (const m of MENTORS) {
    const user = base.users[m.key]
    if (!user) continue
    const [p] = await tx
      .insert(mentorProfiles)
      .values({
        userId: user.id,
        title: m.title,
        bio: m.bio,
        categories: m.categories,
        languages: m.languages,
        photo: assets[m.photo] ?? '',
        kind: m.kind,
        courseIds: (m.courses ?? []).map((k) => base.courses[k]?.id).filter((x) => !!x) as string[],
        bookingEnabled: m.kind === 'mentor',
        timezone: 'Asia/Dubai',
      })
      .returning()
    mentors[m.key] = p!.id
    for (const slug of m.microsites) {
      const ms = base.microsites[slug]
      if (ms) await tx.insert(mentorMicrosites).values({ mentorId: p!.id, micrositeId: ms.id })
    }
    if (m.availability) {
      await tx.insert(mentorAvailabilityRules).values(
        m.availability.weekdays.map((weekday) => ({
          mentorId: p!.id,
          weekday,
          startTime: m.availability!.start,
          endTime: m.availability!.end,
        })),
      )
    }
  }

  const elevate = base.microsites.elevate!
  const employees = base.microsites.employees!
  const [form] = await tx
    .insert(forms)
    .values({
      title: { en: 'Elevate mentee registration', ar: 'التسجيل كمتدرب في إرتقاء' },
      kind: 'registration',
      status: 'published',
      oneEntryPerUser: true,
      fields: [
        {
          key: 'goals',
          label: { en: 'What do you want to achieve?', ar: 'ما الذي تريد تحقيقه؟' },
          type: 'text',
          required: true,
          maxLength: 500,
        },
        {
          key: 'yearsAtDct',
          label: { en: 'Years at DCT', ar: 'سنوات العمل في الدائرة' },
          type: 'select',
          required: true,
          options: ['0-1', '1-3', '3-5', '5+'].map((v) => ({ value: v, label: { en: v, ar: v } })),
        },
        {
          key: 'preferredAreas',
          label: { en: 'Preferred mentoring areas', ar: 'مجالات الإرشاد المفضلة' },
          type: 'multiselect',
          required: true,
          options: MENTOR_CATEGORIES.map((c) => ({ value: c, label: { en: c, ar: c } })),
        },
        {
          key: 'language',
          label: { en: 'Session language', ar: 'لغة الجلسات' },
          type: 'radio',
          required: true,
          options: [
            { value: 'en', label: { en: 'English', ar: 'الإنجليزية' } },
            { value: 'ar', label: { en: 'Arabic', ar: 'العربية' } },
            { value: 'both', label: { en: 'Both', ar: 'كلاهما' } },
          ],
        },
      ],
    })
    .returning()
  await tx.insert(formMicrosites).values({ formId: form!.id, micrositeId: elevate.id })
  await tx
    .insert(mentoringSettings)
    .values({ micrositeId: elevate.id, registrationFormId: form!.id })

  const saeed = base.users.saeed!
  const reem = base.users.reem!
  const answers = {
    goals: 'Lead a small exhibition project by Q2 2027',
    yearsAtDct: '1-3',
    preferredAreas: ['Museums and Curation', 'Strategy and Planning'],
    language: 'both',
  }
  await tx.insert(formEntries).values({
    formId: form!.id,
    userId: saeed.id,
    micrositeId: elevate.id,
    answers,
    submittedAt: new Date('2026-09-20T08:00:00Z'),
  })
  const [app] = await tx
    .insert(menteeApplications)
    .values({
      menteeId: saeed.id,
      mentorId: mentors.hessa!,
      micrositeId: elevate.id,
      status: 'accepted',
      answers,
      matchScore: 0.87,
      source: 'ai',
      decidedAt: new Date('2026-09-21T08:00:00Z'),
    })
    .returning()
  const [match] = await tx
    .insert(mentorMatches)
    .values({
      menteeId: saeed.id,
      mentorId: mentors.hessa!,
      micrositeId: elevate.id,
      applicationId: app!.id,
      source: 'ai',
      matchScore: 0.87,
      matchedAt: new Date('2026-09-21T08:00:00Z'),
    })
    .returning()

  const at = (iso: string) => new Date(iso)
  const [b1] = await tx
    .insert(mentorBookings)
    .values({
      mentorId: mentors.hessa!,
      menteeId: saeed.id,
      micrositeId: elevate.id,
      startsAt: at('2026-09-28T07:00:00Z'),
      endsAt: at('2026-09-28T08:00:00Z'),
      status: 'completed',
      confirmedAt: at('2026-09-22T08:00:00Z'),
      completedAt: at('2026-09-28T08:05:00Z'),
      reminder24hSentAt: at('2026-09-27T07:00:00Z'),
      reminder1hSentAt: at('2026-09-28T06:00:00Z'),
    })
    .returning()
  const [b2] = await tx
    .insert(mentorBookings)
    .values({
      mentorId: mentors.hessa!,
      menteeId: saeed.id,
      micrositeId: elevate.id,
      startsAt: at('2026-10-12T07:00:00Z'),
      endsAt: at('2026-10-12T08:00:00Z'),
      status: 'confirmed',
      confirmedAt: at('2026-09-29T08:00:00Z'),
    })
    .returning()
  const [b3] = await tx
    .insert(mentorBookings)
    .values({
      mentorId: mentors.mariam!,
      menteeId: reem.id,
      micrositeId: employees.id,
      startsAt: at('2026-10-02T06:00:00Z'),
      endsAt: at('2026-10-02T07:00:00Z'),
      status: 'cancelled',
      cancelledAt: at('2026-09-30T10:00:00Z'),
      cancelledById: base.users.mariam!.id,
      cancelReason: 'travel',
    })
    .returning()

  await tx.insert(bookingFeedback).values({
    bookingId: b1!.id,
    authorId: saeed.id,
    side: 'mentee',
    rating: 5,
    attendance: 'attended',
  })
  await tx.insert(growLogs).values({
    bookingId: b1!.id,
    mentorId: mentors.hessa!,
    menteeId: saeed.id,
    sessionNo: 1,
    sessionDate: '2026-09-28',
    goal: 'Lead a small exhibition project by Q2 2027',
    reality: 'Strong content skills, limited budget experience',
    options: 'Shadow the finance lead; take C16',
    wayForward: 'Enrol in C16 this week; draft a one-page project brief before session 2',
    createdAt: at('2026-09-28T09:00:00Z'),
  })

  return {
    mentors,
    registrationFormId: form!.id,
    bookings: { B1: b1!.id, B2: b2!.id, B3: b3!.id },
    matchId: match!.id,
  }
}
