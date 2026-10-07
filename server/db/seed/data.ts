/**
 * SEED.md as data. Shared by the dev seed and the test fixtures so both use the same people,
 * microsites and numbers. Fixed today = 2026-10-06 09:00 UTC.
 */
import type { HubTab, SignInMode } from '@shared/enums'

export const SEED_PASSWORD = 'Dct!2026demo'

type I18n = { en: string; ar: string }
const t = (en: string, ar: string): I18n => ({ en, ar })

export type SeedMicrosite = {
  slug: string
  name: I18n
  subtitle: I18n
  accent: string
  hero: string
  signInMode: SignInMode
  emailDomainRule?: string
  landingOnly: boolean
  tabs: { key: HubTab; label?: I18n }[]
  courses: string[]
  mandatory: string[]
  mentoring: boolean
  competition: boolean
  subAdmin?: string
  defaultFilter?: string
  landing: { heading: I18n; subheading: I18n }
}

const tab = (key: HubTab, label?: I18n) => ({ key, label })

export const MICROSITES: SeedMicrosite[] = [
  {
    slug: 'employees',
    name: t('DCT Employees', 'موظفو الدائرة'),
    subtitle: t('Learning for every DCT colleague', 'التعلم لكل موظف في الدائرة'),
    accent: '#EE3E43',
    hero: 'heroes/employees.png',
    signInMode: 'invite_only',
    emailDomainRule: 'dctabudhabi.ae',
    landingOnly: false,
    tabs: [tab('courses'), tab('workshops'), tab('mentors'), tab('ai_coaches'), tab('ai_tools')],
    courses: ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08'],
    mandatory: ['C01', 'C03'],
    mentoring: false,
    competition: false,
    subAdmin: 'omar.m@dctlearn.example',
    landing: {
      heading: t('Welcome to DCT Learn', 'مرحباً بكم في DCT Learn'),
      subheading: t('Grow with DCT Abu Dhabi', 'انمُ مع دائرة الثقافة والسياحة'),
    },
  },
  {
    slug: 'elevate',
    name: t('Elevate 2026 Mentorship Programme', 'برنامج إرتقاء'),
    subtitle: t('Mentorship for DCT talent', 'برنامج الإرشاد لمواهب الدائرة'),
    accent: '#CD3151',
    hero: 'heroes/elevate.jpg',
    signInMode: 'invite_only',
    landingOnly: false,
    tabs: [tab('mentors', t('Mentors', 'المرشدون')), tab('workshops', t('Sessions', 'الجلسات'))],
    courses: [],
    mandatory: [],
    mentoring: true,
    competition: false,
    subAdmin: 'layla.h@dctlearn.example',
    landing: {
      heading: t(
        'Are you ready to accelerate your growth and career at DCT Abu Dhabi?',
        'هل أنت مستعد لتسريع نموك ومسيرتك المهنية في دائرة الثقافة والسياحة؟',
      ),
      subheading: t('Elevate 2026 Mentorship Programme', 'برنامج إرتقاء 2026 للإرشاد'),
    },
  },
  {
    slug: 'znm',
    name: t('Zayed National Museum', 'متحف زايد الوطني'),
    subtitle: t('Onboarding programme', 'برنامج التهيئة'),
    accent: '#3B2F92',
    hero: 'heroes/znm.jpg',
    signInMode: 'invite_only',
    landingOnly: false,
    tabs: [
      tab('courses', t('ZNM Courses', 'دورات المتحف')),
      tab('resources'),
      tab('workshops', t('Assessments', 'التقييمات')),
    ],
    courses: ['C09', 'C10', 'C11', 'C12', 'C02', 'C01'],
    mandatory: ['C09', 'C10', 'C11', 'C12', 'C02', 'C01'],
    mentoring: false,
    competition: false,
    subAdmin: 'khalid.d@dctlearn.example',
    landing: {
      heading: t(
        'Welcome to the onboarding programme of Zayed National Museum',
        'مرحباً بكم في برنامج التهيئة لمتحف زايد الوطني',
      ),
      subheading: t('Learn, prepare and welcome the world', 'تعلّم واستعد ورحّب بالعالم'),
    },
  },
  {
    slug: 'zu',
    name: t('Zayed University 24-Hour Challenge', 'تحدي جامعة زايد'),
    subtitle: t('Pitch your cultural heritage idea', 'قدّم فكرتك في التراث الثقافي'),
    accent: '#F7C337',
    hero: 'heroes/zu.jpg',
    signInMode: 'invite_only',
    landingOnly: false,
    tabs: [tab('courses')],
    courses: ['C13'],
    mandatory: [],
    mentoring: false,
    competition: true,
    landing: {
      heading: t('24-Hour Challenge', 'تحدي 24 ساعة'),
      subheading: t('Zayed University × DCT', 'جامعة زايد × الدائرة'),
    },
  },
  {
    slug: 'museopro',
    name: t('MuseoPro', 'ميوزيو برو'),
    subtitle: t('Professional museum training', 'تدريب مهني للمتاحف'),
    accent: '#E35E3C',
    hero: 'heroes/museopro.jpg',
    signInMode: 'invite_only',
    landingOnly: false,
    tabs: [tab('courses'), tab('resources'), tab('mentors', t('Trainers', 'المدربون'))],
    courses: ['C14', 'C15', 'C16', 'C17'],
    mandatory: ['C14', 'C15'],
    mentoring: false,
    competition: false,
    subAdmin: 'camille.r@example.com',
    defaultFilter: 'mandatory',
    landing: {
      heading: t('MuseoPro', 'ميوزيو برو'),
      subheading: t('With France Muséums', 'بالتعاون مع متاحف فرنسا'),
    },
  },
  {
    slug: 'nibras',
    name: t('Nibras — DCT AI Champions', 'نبراس'),
    subtitle: t('A DCT AI Champions programme', 'برنامج أبطال الذكاء الاصطناعي'),
    accent: '#2FC4DB',
    hero: 'heroes/nibras.png',
    signInMode: 'invite_only',
    landingOnly: false,
    tabs: [tab('courses')],
    courses: ['C18', 'C19', 'C20', 'C21'],
    mandatory: ['C18', 'C19'],
    mentoring: false,
    competition: false,
    subAdmin: 'fatima.s@dctlearn.example',
    landing: {
      heading: t('A DCT AI Champions programme', 'برنامج أبطال الذكاء الاصطناعي في الدائرة'),
      subheading: t('Aware · Practitioner · Builder', 'واعٍ · ممارس · مطوّر'),
    },
  },
  {
    slug: 'chkforum',
    name: t('Cultural Heritage & Knowledge Development Forum', 'منتدى التراث الثقافي'),
    subtitle: t('Open learning for the forum', 'تعلم مفتوح للمنتدى'),
    accent: '#6D7782',
    hero: 'heroes/csmd.jpg',
    signInMode: 'open',
    landingOnly: false,
    tabs: [tab('courses')],
    courses: ['C22', 'C23'],
    mandatory: [],
    mentoring: false,
    competition: false,
    landing: {
      heading: t(
        'Cultural Heritage & Knowledge Development Forum',
        'منتدى التراث الثقافي وتنمية المعرفة',
      ),
      subheading: t('Join and learn', 'انضم وتعلّم'),
    },
  },
  {
    slug: 'ruwaad',
    name: t('Ruwaad — Careers in Hospitality', 'رواد'),
    subtitle: t('Careers in Hospitality', 'وظائف في الضيافة'),
    accent: '#F77860',
    hero: 'heroes/ruwaad.png',
    signInMode: 'landing_only',
    landingOnly: true,
    tabs: [],
    courses: [],
    mandatory: [],
    mentoring: false,
    competition: false,
    landing: {
      heading: t('Careers in Hospitality', 'وظائف في الضيافة'),
      subheading: t('Register your interest', 'سجّل اهتمامك'),
    },
  },
  {
    slug: 'csmd',
    name: t('Cultural Sites Management Department', 'إدارة المواقع الثقافية'),
    subtitle: t('Cultural sites', 'المواقع الثقافية'),
    accent: '#E3DCD3',
    hero: 'heroes/csmd.jpg',
    signInMode: 'landing_only',
    landingOnly: true,
    tabs: [],
    courses: [],
    mandatory: [],
    mentoring: false,
    competition: false,
    landing: {
      heading: t('Cultural Sites Management Department', 'إدارة المواقع الثقافية'),
      subheading: t('Coming soon', 'قريباً'),
    },
  },
]

export type SeedCourse = {
  key: string
  title: I18n
  categories: string[]
  level: 'beginner' | 'intermediate' | 'advanced'
  minutes: number
  units: number
  cert: 'yes' | 'no' | 'external'
  comingSoon?: boolean
  isCertProgramme?: boolean
}

const c = (
  key: string,
  en: string,
  ar: string,
  categories: string[],
  level: SeedCourse['level'],
  minutes: number,
  units: number,
  cert: SeedCourse['cert'],
  extra: Partial<SeedCourse> = {},
): SeedCourse => ({ key, title: t(en, ar), categories, level, minutes, units, cert, ...extra })

export const COURSES: SeedCourse[] = [
  c(
    'C01',
    'DCT World',
    'عالم الدائرة',
    ['All about DCT', 'Welcome to DCT'],
    'beginner',
    45,
    4,
    'yes',
  ),
  c('C02', 'Museum 101', 'المتاحف 101', ['The World of Museums'], 'beginner', 60, 5, 'yes'),
  c('C03', 'DCTLEARN', 'منصة DCT Learn', ['All about DCT'], 'beginner', 20, 2, 'yes'),
  c(
    'C04',
    'Understanding Cultural Heritage',
    'فهم التراث الثقافي',
    ['Cultural Heritage'],
    'beginner',
    50,
    4,
    'yes',
  ),
  c(
    'C05',
    'Sustainable Tourism',
    'السياحة المستدامة',
    ['Tourism Management'],
    'intermediate',
    60,
    4,
    'yes',
  ),
  c(
    'C06',
    'The World of Curation',
    'عالم التقييم الفني',
    ['The World of Museums'],
    'intermediate',
    55,
    4,
    'yes',
  ),
  c(
    'C07',
    'Creative Tourism: What is it?',
    'السياحة الإبداعية',
    ['Creative and Cultural Industries'],
    'beginner',
    40,
    3,
    'yes',
  ),
  c(
    'C08',
    'Data Protection for People and Performance',
    'حماية البيانات',
    ['Corporate Knowledge and Compliance'],
    'beginner',
    30,
    3,
    'yes',
  ),
  c(
    'C09',
    'Introduction to Ticketing',
    'مقدمة في التذاكر',
    ['ZNM onboarding'],
    'beginner',
    35,
    3,
    'yes',
  ),
  c(
    'C10',
    'Operational Readiness – Induction',
    'الجاهزية التشغيلية – التعريف',
    ['ZNM onboarding'],
    'beginner',
    40,
    3,
    'yes',
  ),
  c(
    'C11',
    'Operational Readiness – Role-Specific',
    'الجاهزية التشغيلية – حسب الدور',
    ['ZNM onboarding'],
    'intermediate',
    45,
    3,
    'yes',
  ),
  c(
    'C12',
    'VS Knowledge Assessment',
    'تقييم المعرفة',
    ['Post-Assessment'],
    'beginner',
    15,
    1,
    'no',
  ),
  c(
    'C13',
    '24 Hour Challenge – Introduction to Cultural Heritage',
    'تحدي 24 ساعة',
    ['Cultural Heritage'],
    'beginner',
    90,
    4,
    'yes',
    { isCertProgramme: true },
  ),
  c(
    'C14',
    'Condition Report: General Presentation',
    'تقرير الحالة',
    ['Fundamentals – Documentation of Cultural Heritage'],
    'intermediate',
    50,
    3,
    'yes',
  ),
  c(
    'C15',
    'Conservation and Exhibition of Artefacts',
    'صون وعرض القطع',
    ['Conservation and exhibition of artefacts'],
    'intermediate',
    60,
    4,
    'yes',
  ),
  c(
    'C16',
    'Curating an Exhibition: From Concept to Production',
    'تنظيم المعارض',
    ['Conservation and exhibition of artefacts'],
    'advanced',
    70,
    4,
    'yes',
  ),
  c(
    'C17',
    'Written and Oral Interpretation Tools in Heritage',
    'أدوات التفسير',
    ['Interpretation and audience management'],
    'intermediate',
    45,
    3,
    'yes',
    { comingSoon: true },
  ),
  c(
    'C18',
    'Introduction to Generative AI',
    'مقدمة في الذكاء الاصطناعي التوليدي',
    ['AI Aware'],
    'beginner',
    120,
    1,
    'external',
  ),
  c(
    'C19',
    'Ethics of AI',
    'أخلاقيات الذكاء الاصطناعي',
    ['AI Aware'],
    'beginner',
    90,
    1,
    'external',
  ),
  c(
    'C20',
    'Foundations of Prompt Engineering',
    'أساسيات هندسة الأوامر',
    ['AI Practitioner'],
    'intermediate',
    180,
    1,
    'external',
  ),
  c('C21', 'LLMOps', 'عمليات نماذج اللغة', ['AI Builder'], 'advanced', 240, 1, 'external'),
  c(
    'C22',
    'UNESCO: Implementation of the Convention on Diversity of Cultural Expressions',
    'اتفاقية اليونسكو',
    ['Protection and Promotion of the Diversity of Cultural Expression'],
    'intermediate',
    60,
    3,
    'yes',
  ),
  c(
    'C23',
    'Abu Dhabi Creative City and Its Cooperation with Other Cities',
    'أبوظبي مدينة مبدعة',
    ['Protection and Promotion of the Diversity of Cultural Expression'],
    'intermediate',
    45,
    3,
    'yes',
  ),
]

export const courseSlug = (key: string) =>
  COURSES.find((x) => x.key === key)!
    .title.en.toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

export type SeedPerson = {
  key: string
  name: string
  email: string
  role: 'learner' | 'mentor' | 'judge' | 'sub_admin' | 'admin'
  status?: 'active' | 'disabled' | 'invited'
  microsites?: string[]
}

export const PEOPLE: SeedPerson[] = [
  { key: 'aisha', name: 'Aisha Al Marzouqi', email: 'aisha.admin@dctlearn.example', role: 'admin' },
  { key: 'omar', name: 'Omar Al Mansoori', email: 'omar.m@dctlearn.example', role: 'sub_admin' },
  { key: 'layla', name: 'Layla Haddad', email: 'layla.h@dctlearn.example', role: 'sub_admin' },
  {
    key: 'khalid',
    name: 'Khalid Al Dhaheri',
    email: 'khalid.d@dctlearn.example',
    role: 'sub_admin',
  },
  { key: 'camille', name: 'Camille Rousseau', email: 'camille.r@example.com', role: 'sub_admin' },
  {
    key: 'fatima',
    name: 'Fatima Al Suwaidi',
    email: 'fatima.s@dctlearn.example',
    role: 'sub_admin',
  },
  { key: 'hessa', name: 'Dr. Hessa Al Nuaimi', email: 'hessa.n@example.com', role: 'mentor' },
  { key: 'rashid', name: 'Rashid Al Blooshi', email: 'rashid.b@example.com', role: 'mentor' },
  { key: 'mariam', name: 'Mariam Khoury', email: 'mariam.k@example.com', role: 'mentor' },
  { key: 'jeanluc', name: 'Jean-Luc Morel', email: 'jl.morel@example.com', role: 'mentor' },
  { key: 'noura', name: 'Noura Al Kaabi', email: 'noura.k@example.com', role: 'judge' },
  {
    key: 'saeed',
    name: 'Saeed Al Hammadi',
    email: 'saeed.h@dctlearn.example',
    role: 'learner',
    microsites: ['employees', 'elevate'],
  },
  {
    key: 'mona',
    name: 'Mona Al Ameri',
    email: 'mona.a@dctlearn.example',
    role: 'learner',
    microsites: ['employees'],
  },
  {
    key: 'yousef',
    name: 'Yousef Al Zaabi',
    email: 'yousef.z@dctlearn.example',
    role: 'learner',
    microsites: ['znm'],
  },
  {
    key: 'reem',
    name: 'Reem Al Shamsi',
    email: 'reem.s@dctlearn.example',
    role: 'learner',
    microsites: ['znm', 'employees'],
  },
  {
    key: 'ahmed',
    name: 'Ahmed Khan',
    email: 'ahmed.k@example.com',
    role: 'learner',
    microsites: ['zu'],
  },
  {
    key: 'sara',
    name: 'Sara Haddad',
    email: 'sara.h@example.com',
    role: 'learner',
    microsites: ['zu'],
  },
  {
    key: 'elise',
    name: 'Élise Martin',
    email: 'elise.m@example.com',
    role: 'learner',
    microsites: ['museopro'],
  },
  {
    key: 'hamad',
    name: 'Hamad Al Mazrouei',
    email: 'hamad.m@dctlearn.example',
    role: 'learner',
    microsites: ['nibras', 'employees'],
  },
  {
    key: 'former',
    name: 'Former Staff',
    email: 'former.staff@dctlearn.example',
    role: 'learner',
    status: 'disabled',
    microsites: ['employees'],
  },
]

export const person = (key: string) => {
  const p = PEOPLE.find((x) => x.key === key)
  if (!p) throw new Error(`No seed person ${key}`)
  return p
}

/** Handy e-mails for tests. */
export const E = Object.fromEntries(PEOPLE.map((p) => [p.key, p.email])) as Record<string, string>
