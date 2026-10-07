import type { DbOrTx } from '@server/db/connection'
import { aiEmbedMicrosites, aiEmbeds } from '@server/db/schema/ai'
import { eventAudiences, events } from '@server/db/schema/events'
import { type FormField, formEntries, formMicrosites, forms } from '@server/db/schema/forms'
import { resources } from '@server/db/schema/resources'
import { storeGenerated } from '@server/services/files.service'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import type { SeededUsers } from './identity.seed'
import type { SeededMicrosites } from './microsites.seed'

/**
 * SEED §5 (mentee registration form fields), §7 events, §8 resources, §9 AI embeds, plus one
 * P14 dashboard survey. Times are UTC against the fixed today 2026-10-06 09:00.
 */

type I18n = { en: string; ar: string }
const t = (en: string, ar: string): I18n => ({ en, ar })

export const MENTOR_CATEGORIES = [
  'Strategy and Planning',
  'Culture and Heritage',
  'Museums and Curation',
  'Marketing and Communications',
  'People and Performance',
  'Finance and Revenue',
  'Visitor Experience and Events',
  'Libraries and Publishing',
  'Tourism and International Operations',
  'Legal and Governance',
  'Sustainability',
  'Business Excellence and Quality',
  'Youth and Community Engagement',
  'Research',
]

const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export const MENTEE_REGISTRATION_FIELDS: FormField[] = [
  {
    key: 'goals',
    label: t('What do you want to achieve with a mentor?', 'ما الذي تريد تحقيقه مع المرشد؟'),
    type: 'text',
    required: true,
    maxLength: 500,
  },
  {
    key: 'yearsAtDct',
    label: t('Years at DCT', 'سنوات العمل في الدائرة'),
    type: 'select',
    required: true,
    options: [
      { value: '0-2', label: t('0–2 years', '0–2 سنوات') },
      { value: '3-5', label: t('3–5 years', '3–5 سنوات') },
      { value: '6-10', label: t('6–10 years', '6–10 سنوات') },
      { value: '10+', label: t('More than 10 years', 'أكثر من 10 سنوات') },
    ],
  },
  {
    key: 'preferredAreas',
    label: t('Preferred areas', 'المجالات المفضلة'),
    type: 'multiselect',
    required: true,
    options: MENTOR_CATEGORIES.map((c) => ({ value: slugOf(c), label: t(c, '') })),
  },
  {
    key: 'language',
    label: t('Preferred language', 'اللغة المفضلة'),
    type: 'radio',
    required: true,
    options: [
      { value: 'en', label: t('English', 'الإنجليزية') },
      { value: 'ar', label: t('Arabic', 'العربية') },
      { value: 'both', label: t('Both', 'كلتاهما') },
    ],
  },
]

async function placeholderPdf(title: string) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  page.drawText(title, { x: 50, y: 780, size: 20, font })
  page.drawText('DCT Learn seed document.', { x: 50, y: 750, size: 12, font })
  return doc.save()
}

export type SeededContent = {
  forms: { menteeRegistration: string; onboardingPulse: string }
  events: Record<'kickoff' | 'safety' | 'masterclass', string>
  resources: Record<'codeOfConduct' | 'glossary' | 'ticketingFaq' | 'sharepoint', string>
  aiEmbeds: Record<string, string>
}

export async function seedContent(
  tx: DbOrTx,
  users: SeededUsers,
  m: SeededMicrosites,
): Promise<SeededContent> {
  const ms = (slug: string) => {
    const site = m[slug]
    if (!site) throw new Error(`Seed microsite ${slug} missing`)
    return site.id
  }
  const user = (key: string) => {
    const u = users[key]
    if (!u) throw new Error(`Seed person ${key} missing`)
    return u.id
  }

  /* §5 mentee registration (L1 = Saeed completed on 2026-09-20) + one dashboard survey */
  const [registration] = await tx
    .insert(forms)
    .values({
      title: t('Elevate mentee registration', 'تسجيل المتدربين في برنامج إرتقاء'),
      kind: 'registration',
      fields: MENTEE_REGISTRATION_FIELDS,
      status: 'published',
      oneEntryPerUser: true,
    })
    .returning()
  await tx.insert(formMicrosites).values({ formId: registration!.id, micrositeId: ms('elevate') })
  await tx.insert(formEntries).values({
    formId: registration!.id,
    userId: user('saeed'),
    micrositeId: ms('elevate'),
    answers: {
      goals: 'Lead a small exhibition project by Q2 2027',
      yearsAtDct: '3-5',
      preferredAreas: ['museums-and-curation', 'culture-and-heritage'],
      language: 'both',
    },
    submittedAt: new Date('2026-09-20T08:00:00Z'),
  })

  const [pulse] = await tx
    .insert(forms)
    .values({
      title: t('Onboarding pulse survey', 'استبيان التهيئة'),
      kind: 'survey',
      fields: [
        {
          key: 'rating',
          label: t('How useful is DCT Learn so far?', 'ما مدى فائدة المنصة حتى الآن؟'),
          type: 'radio',
          required: true,
          options: ['1', '2', '3', '4', '5'].map((v) => ({ value: v, label: t(v, v) })),
        },
        {
          key: 'comments',
          label: t('Anything we should improve?', 'ما الذي يمكننا تحسينه؟'),
          type: 'textarea',
          required: false,
          maxLength: 2000,
        },
      ],
      status: 'published',
      oneEntryPerUser: true,
      showOnDashboard: true,
      dueAt: new Date('2026-10-20T20:00:00Z'),
    })
    .returning()
  await tx.insert(formMicrosites).values({ formId: pulse!.id, micrositeId: ms('employees') })

  /* §7 events. The ZNM briefing is shifted to 08:30–09:30 so it is live at the fixed 09:00. */
  const eventRows = [
    {
      key: 'kickoff' as const,
      title: t('Mentoring Kick-off Session', 'الجلسة الافتتاحية للإرشاد'),
      category: 'Sessions',
      startsAt: '2026-10-08T06:00:00Z',
      endsAt: '2026-10-08T07:00:00Z',
      zoomUrl: 'https://zoom.example/kickoff',
      audience: ['elevate'],
    },
    {
      key: 'safety' as const,
      title: t('Museum Safety Briefing', 'إحاطة السلامة في المتحف'),
      category: 'Assessments',
      startsAt: '2026-10-06T08:30:00Z',
      endsAt: '2026-10-06T09:30:00Z',
      venue: 'Zayed National Museum, Saadiyat',
      audience: ['znm'],
    },
    {
      key: 'masterclass' as const,
      title: t('Creative Economy Masterclass', 'ورشة الاقتصاد الإبداعي'),
      category: 'Workshops',
      startsAt: '2026-09-10T07:00:00Z',
      endsAt: '2026-09-10T09:00:00Z',
      recordingUrl: 'https://video.example/masterclass',
      audience: ['employees'],
    },
  ]
  const eventIds = {} as SeededContent['events']
  for (const e of eventRows) {
    const [row] = await tx
      .insert(events)
      .values({
        title: e.title,
        description: t(`${e.title.en}.`, e.title.ar),
        category: e.category,
        venue: e.venue ?? null,
        startsAt: new Date(e.startsAt),
        endsAt: new Date(e.endsAt),
        timezone: 'Asia/Dubai',
        zoomUrl: e.zoomUrl ?? null,
        recordingUrl: e.recordingUrl ?? null,
        recordingPublished: Boolean(e.recordingUrl),
        createdById: user('aisha'),
      })
      .returning()
    eventIds[e.key] = row!.id
    await tx
      .insert(eventAudiences)
      .values(e.audience.map((slug) => ({ eventId: row!.id, micrositeId: ms(slug) })))
  }

  /* §8 resources */
  const pdf = await storeGenerated(
    await placeholderPdf('ZNM Visitor Code of Conduct'),
    {
      category: 'pdf',
      contentType: 'application/pdf',
      ext: '.pdf',
      ownerId: user('khalid'),
      name: 'znm-visitor-code-of-conduct.pdf',
    },
    tx,
  )
  const reviewed = new Date('2026-10-01T08:00:00Z')
  const resourceRows = [
    {
      key: 'codeOfConduct' as const,
      micrositeId: ms('znm'),
      title: t('ZNM Visitor Code of Conduct', 'مدونة سلوك زوار المتحف'),
      type: 'pdf',
      url: null,
      fileId: pdf.id,
      status: 'approved',
      submittedById: user('khalid'),
      submittedAt: new Date('2026-09-28T08:00:00Z'),
      reviewedById: user('aisha'),
      reviewedAt: reviewed,
    },
    {
      key: 'glossary' as const,
      micrositeId: ms('museopro'),
      title: t('Museum Glossary (ICOM)', 'مسرد المتاحف (إيكوم)'),
      type: 'link',
      url: 'https://icom.museum/en/resources/standards-guidelines/museum-definition/',
      fileId: null,
      status: 'approved',
      submittedById: user('camille'),
      submittedAt: new Date('2026-09-25T08:00:00Z'),
      reviewedById: user('aisha'),
      reviewedAt: reviewed,
    },
    {
      key: 'ticketingFaq' as const,
      micrositeId: ms('znm'),
      title: t('Ticketing FAQ sheet', 'الأسئلة الشائعة عن التذاكر'),
      type: 'link',
      url: 'https://znm.example/ticketing-faq',
      fileId: null,
      status: 'pending',
      submittedById: user('khalid'),
      submittedAt: new Date('2026-10-05T10:00:00Z'),
    },
    {
      key: 'sharepoint' as const,
      micrositeId: ms('employees'),
      title: t('Internal SharePoint link', 'رابط SharePoint الداخلي'),
      type: 'link',
      url: 'https://dctabudhabi.sharepoint.com/sites/learning',
      fileId: null,
      status: 'rejected',
      reviewNote: 'Use a public https link; SharePoint needs login',
      submittedById: user('omar'),
      submittedAt: new Date('2026-10-02T08:00:00Z'),
      reviewedById: user('aisha'),
      reviewedAt: new Date('2026-10-03T08:00:00Z'),
    },
  ]
  const resourceIds = {} as SeededContent['resources']
  for (const { key, ...r } of resourceRows) {
    const [row] = await tx.insert(resources).values(r).returning()
    resourceIds[key] = row!.id
  }

  /* §9 AI embeds */
  const embedRows = [
    {
      key: 'culture-bot',
      name: t('Abu Dhabi Culture Bot', 'روبوت ثقافة أبوظبي'),
      description: t('Ask about Abu Dhabi culture and heritage.', 'اسأل عن ثقافة أبوظبي وتراثها.'),
      kind: 'chat',
      providerId: 'bot_culture_demo',
      color: '#A39089',
      microsites: ['employees'],
      requiresLogin: true,
    },
    {
      key: 'career-coach',
      name: t('Career Coach', 'مدرب المسار المهني'),
      description: t('Plan your next career step.', 'خطط لخطوتك المهنية التالية.'),
      kind: 'chat',
      providerId: 'bot_career_demo',
      color: '#CE3F3F',
      microsites: ['employees', 'elevate'],
      requiresLogin: true,
    },
    {
      key: 'lesson-planner',
      name: t('AI Lesson Planner', 'مخطط الدروس الذكي'),
      description: t('Draft a lesson or course outline.', 'أنشئ مسودة درس أو مخطط دورة.'),
      kind: 'iframe',
      providerId: 'tool_lesson_demo',
      color: '#EE3E43',
      iframeUrl: 'https://ai.potential.com/tools/lesson-planner',
      microsites: ['employees'],
      requiresLogin: true,
    },
    {
      key: 'voice-hiring',
      name: t('Al Ain Museum Voice Hiring Agent', 'وكيل التوظيف الصوتي لمتحف العين'),
      description: t('Pre-screening interview by voice.', 'مقابلة فرز أولية بالصوت.'),
      kind: 'voice',
      providerId: 'assistant_hiring_demo',
      color: '#EE3E43',
      microsites: [] as string[],
      requiresLogin: false,
    },
  ]
  const embedIds: Record<string, string> = {}
  for (const { microsites: linked, ...e } of embedRows) {
    const [row] = await tx.insert(aiEmbeds).values(e).returning()
    embedIds[e.key] = row!.id
    if (linked.length)
      await tx
        .insert(aiEmbedMicrosites)
        .values(linked.map((slug) => ({ embedId: row!.id, micrositeId: ms(slug) })))
  }

  return {
    forms: { menteeRegistration: registration!.id, onboardingPulse: pulse!.id },
    events: eventIds,
    resources: resourceIds,
    aiEmbeds: embedIds,
  }
}
