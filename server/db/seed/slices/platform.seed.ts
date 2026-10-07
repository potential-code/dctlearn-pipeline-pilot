import type { DbOrTx } from '@server/db/connection'
import { faqItems, pageSections, siteSettings } from '@server/db/schema/public'
import type { SeededCourses } from './catalog.seed'

/**
 * SEED §11 public content: P01 home settings (hero, two affiliates, featured courses),
 * P02/P03 page sections and the six P04 FAQ items. Idempotent per key.
 */
const FEATURED = ['C01', 'C02', 'C04', 'C05', 'C06', 'C07']

export const AFFILIATES = [
  { name: 'VX Academy', url: 'https://vxacademy.example', imageUrl: '', newTab: true },
  { name: 'Abu Dhabi Tourist Guide', url: 'https://adtg.example', imageUrl: '', newTab: true },
]

export const PAGE_SECTIONS = [
  {
    page: 'professionals',
    key: 'intro',
    title: { en: 'Learning for DCT employees', ar: 'التعلّم لموظفي الدائرة' },
    body: {
      en: 'Build the skills that shape Abu Dhabi’s culture and tourism sector, at your own pace.',
      ar: 'طوّر المهارات التي تشكّل قطاع الثقافة والسياحة في أبوظبي، وفق وتيرتك الخاصة.',
    },
    cta: { label: { en: 'Register now', ar: 'سجّل الآن' }, url: '/register' },
  },
  {
    page: 'professionals',
    key: 'programmes',
    title: { en: 'Programmes for every role', ar: 'برامج لكل دور' },
    body: {
      en: 'Onboarding, mandatory compliance courses, mentoring and AI tools — in one place.',
      ar: 'التهيئة والدورات الإلزامية والإرشاد وأدوات الذكاء الاصطناعي — في مكان واحد.',
    },
  },
  {
    page: 'professionals',
    key: 'certificates',
    title: { en: 'Earn certificates', ar: 'احصل على الشهادات' },
    body: {
      en: 'Complete a course to receive a verifiable certificate and learning points.',
      ar: 'أكمل الدورة لتحصل على شهادة قابلة للتحقق ونقاط تعلّم.',
    },
  },
  {
    page: 'students',
    key: 'intro',
    title: { en: 'Learning for students', ar: 'التعلّم للطلاب' },
    body: {
      en: 'Discover careers in culture, heritage and tourism through programmes with our partners.',
      ar: 'اكتشف المهن في الثقافة والتراث والسياحة من خلال برامج مع شركائنا.',
    },
  },
  {
    page: 'students',
    key: 'challenges',
    title: { en: 'Challenges and competitions', ar: 'التحديات والمسابقات' },
    body: {
      en: 'Join university challenges such as the Zayed University 24-Hour Challenge.',
      ar: 'شارك في التحديات الجامعية مثل تحدي جامعة زايد لمدة 24 ساعة.',
    },
  },
  {
    page: 'students',
    key: 'access',
    title: { en: 'How to join', ar: 'كيفية الانضمام' },
    body: {
      en: 'Your university or programme sends you an invitation to its microsite.',
      ar: 'ترسل لك جامعتك أو برنامجك دعوة إلى الموقع المصغّر الخاص به.',
    },
  },
] as const

export const FAQ = [
  {
    question: { en: 'What is DCT Learn?', ar: 'ما هي منصة DCT Learn؟' },
    answer: {
      en: 'The learning platform of the Department of Culture and Tourism – Abu Dhabi.',
      ar: 'منصة التعلّم التابعة لدائرة الثقافة والسياحة – أبوظبي.',
    },
  },
  {
    question: { en: 'Who can register?', ar: 'من يمكنه التسجيل؟' },
    answer: {
      en: 'DCT employees with a dctabudhabi.ae e-mail can register; other programmes are by invitation.',
      ar: 'يمكن لموظفي الدائرة ذوي البريد dctabudhabi.ae التسجيل؛ أما البرامج الأخرى فبالدعوة.',
    },
  },
  {
    question: { en: 'I forgot my password', ar: 'نسيت كلمة المرور' },
    answer: {
      en: 'Use **Forgot password** on the sign-in page to receive a reset link.',
      ar: 'استخدم **نسيت كلمة المرور** في صفحة تسجيل الدخول لتلقي رابط إعادة التعيين.',
    },
  },
  {
    question: { en: 'How do I get a certificate?', ar: 'كيف أحصل على شهادة؟' },
    answer: {
      en: 'Complete every required unit and pass the final assessment; the certificate is issued automatically.',
      ar: 'أكمل جميع الوحدات المطلوبة واجتز التقييم النهائي؛ تصدر الشهادة تلقائياً.',
    },
  },
  {
    question: { en: 'Can I use DCT Learn in Arabic?', ar: 'هل يمكنني استخدام المنصة بالعربية؟' },
    answer: {
      en: 'Yes. Switch the language from the top bar or your profile.',
      ar: 'نعم. غيّر اللغة من الشريط العلوي أو من ملفك الشخصي.',
    },
  },
  {
    question: { en: 'Who do I contact for help?', ar: 'بمن أتصل للمساعدة؟' },
    answer: {
      en: 'Write to DCTLEARN@dctabudhabi.ae.',
      ar: 'راسلنا على DCTLEARN@dctabudhabi.ae.',
    },
  },
] as const

export async function seedPlatform(tx: DbOrTx, courses: SeededCourses = {}) {
  const home = {
    hero: {
      title: { en: 'DCT Learn', ar: 'DCT Learn' },
      subtitle: {
        en: 'Learning for Abu Dhabi’s culture and tourism sector',
        ar: 'التعلّم لقطاع الثقافة والسياحة في أبوظبي',
      },
      imageUrl: '',
    },
    affiliates: AFFILIATES,
    featuredCourseIds: FEATURED.map((k) => courses[k]?.id).filter((id): id is string => !!id),
  }
  await tx
    .insert(siteSettings)
    .values({ key: 'home', value: home })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: home } })
  let order = 0
  for (const s of PAGE_SECTIONS) {
    await tx
      .insert(pageSections)
      .values({
        page: s.page,
        key: s.key,
        title: s.title,
        body: s.body,
        cta: 'cta' in s ? s.cta : null,
        sortOrder: order++,
      })
      .onConflictDoNothing()
  }
  const existing = await tx.select({ id: faqItems.id }).from(faqItems).limit(1)
  if (existing.length === 0)
    await tx.insert(faqItems).values(FAQ.map((f, i) => ({ ...f, sortOrder: i + 1 })))
}
