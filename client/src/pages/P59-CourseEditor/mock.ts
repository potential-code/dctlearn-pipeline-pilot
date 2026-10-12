// client: hand-built page (P59 course editor). Mock data in the shape of the admin API.
// Seed values are the ones the old artboard used (SEED §2 course list, C01 "DCT World" tree).
import type {
  Assessment,
  Block,
  BlockPayload,
  BlockType,
  Course,
  CourseTree,
  I18n,
  Level,
  ModuleNode,
  Question,
  QuestionOption,
  UnitNode,
} from './types'

const i = (en: string, ar: string): I18n => ({ en, ar })
const blob = (id: string) => `/_blob/${id}`

/** Images the cover picker offers (the course library). */
export const IMAGE_LIBRARY: { id: string; url: string; label: I18n }[] = [
  {
    id: 'dct',
    url: blob('fa500a874150b2a1769785936a6d7785'),
    label: i('DCT World', 'عالم الدائرة'),
  },
  { id: 'team', url: blob('eb80e68b5f407df8f3c317956007a5a2'), label: i('Team', 'الفريق') },
  { id: 'ayyala', url: blob('880a72d5794fad0ac73793c03f37c852'), label: i('Ayyala', 'العيالة') },
  {
    id: 'employees',
    url: blob('92c83a667e1befe5661dab8c7ebca349'),
    label: i('Employees', 'الموظفون'),
  },
  { id: 'heritage', url: blob('6a330c17598da2f1e81b82711e1c5e9a'), label: i('Heritage', 'التراث') },
  { id: 'museum', url: blob('91fa1af72d1e01df9c41fd3bfd8dc824'), label: i('Museum', 'المتحف') },
]

const COURSE_IMG: Record<string, string> = {
  C01: 'fa500a874150b2a1769785936a6d7785',
  C02: 'd99ea09adede7395461223b429f24cf4',
  C04: '592272d2d94f43d123cbcdda07b02178',
  C05: 'd01461a3f6ad3ced258aac4713f94408',
  C06: 'cf69d2b8596f972f4af9fc63c0137303',
  C07: 'f1cfe235742010d5ac7c29f64fa633a0',
  C09: '91fa1af72d1e01df9c41fd3bfd8dc824',
  C13: '40780df486810d248ab2ca9a23d58dcb',
  C14: '403bd7970d9211d5acd7b2806550e6a7',
  C17: '17f39841203c4958a320c0442a073383',
  C18: 'f53e39067997d52c15204d509b52dd30',
  C22: 'd87a92b0c7b42fcdfdc06b70145ff332',
  C03: 'fa500a874150b2a1769785936a6d7785',
  C08: '92c83a667e1befe5661dab8c7ebca349',
  C10: '6a330c17598da2f1e81b82711e1c5e9a',
  C11: '6a330c17598da2f1e81b82711e1c5e9a',
  C12: '91fa1af72d1e01df9c41fd3bfd8dc824',
  C15: '403bd7970d9211d5acd7b2806550e6a7',
  C16: '2ff5095865986643708258995c8a0113',
  C19: 'f53e39067997d52c15204d509b52dd30',
  C20: '7430eed874cd248e04160ae211dc6b79',
  C21: '7430eed874cd248e04160ae211dc6b79',
  C23: 'd87a92b0c7b42fcdfdc06b70145ff332',
}

export const CATEGORIES: Record<string, I18n> = {
  about: i('All about DCT', 'كل ما يخص الدائرة'),
  welcome: i('Welcome to DCT', 'مرحباً بك في الدائرة'),
  museums: i('The World of Museums', 'عالم المتاحف'),
  heritage: i('Cultural Heritage', 'التراث الثقافي'),
  tourism: i('Tourism Management', 'إدارة السياحة'),
  creative: i('Creative and Cultural Industries', 'الصناعات الثقافية والإبداعية'),
  compliance: i('Corporate Knowledge and Compliance', 'المعرفة المؤسسية والامتثال'),
  znm: i('ZNM onboarding', 'التهيئة في متحف زايد الوطني'),
  post: i('Post-Assessment', 'التقييم اللاحق'),
  doc: i('Fundamentals – Documentation of Cultural Heritage', 'أساسيات توثيق التراث الثقافي'),
  cons: i('Conservation and exhibition of artefacts', 'صون القطع الأثرية وعرضها'),
  interp: i('Interpretation and audience management', 'التفسير وإدارة الجمهور'),
  aware: i('AI Aware', 'الوعي بالذكاء الاصطناعي'),
  pract: i('AI Practitioner', 'ممارس الذكاء الاصطناعي'),
  builder: i('AI Builder', 'مطوّر الذكاء الاصطناعي'),
  div: i(
    'Protection and Promotion of the Diversity of Cultural Expression',
    'حماية تنوع أشكال التعبير الثقافي وتعزيزه',
  ),
}

export const MICROSITES: Record<string, { name: I18n; color: string }> = {
  employees: { name: i('DCT Employees', 'موظفو الدائرة'), color: '#EE3E43' },
  elevate: { name: i('Elevate 2026', 'إرتقاء 2026'), color: '#CD3151' },
  znm: { name: i('Zayed National Museum', 'متحف زايد الوطني'), color: '#3B2F92' },
  zu: { name: i('ZU 24-Hour Challenge', 'تحدي جامعة زايد'), color: '#F7C337' },
  museopro: { name: i('MuseoPro', 'ميوزيو برو'), color: '#E35E3C' },
  nibras: { name: i('Nibras — AI Champions', 'نبراس'), color: '#2FC4DB' },
  chkforum: { name: i('Cultural Heritage Forum', 'منتدى التراث الثقافي'), color: '#6D7782' },
}

// key, EN, AR, categories, level, minutes, units, certificate, status, microsites
type RawRow = [
  string,
  string,
  string,
  string[],
  Level,
  number,
  number,
  'yes' | 'no' | 'external',
  Course['status'] | 'coming_soon',
  string[],
]
const RAW: RawRow[] = [
  [
    'C01',
    'DCT World',
    'عالم الدائرة',
    ['about', 'welcome'],
    'beginner',
    45,
    4,
    'yes',
    'published',
    ['employees', 'znm'],
  ],
  [
    'C02',
    'Museum 101',
    'المتاحف 101',
    ['museums'],
    'beginner',
    60,
    5,
    'yes',
    'published',
    ['employees', 'znm'],
  ],
  [
    'C03',
    'DCTLEARN',
    'منصة DCT Learn',
    ['about'],
    'beginner',
    20,
    2,
    'yes',
    'published',
    ['employees'],
  ],
  [
    'C04',
    'Understanding Cultural Heritage',
    'فهم التراث الثقافي',
    ['heritage'],
    'beginner',
    50,
    4,
    'yes',
    'published',
    ['employees'],
  ],
  [
    'C05',
    'Sustainable Tourism',
    'السياحة المستدامة',
    ['tourism'],
    'intermediate',
    60,
    4,
    'yes',
    'published',
    ['employees'],
  ],
  [
    'C06',
    'The World of Curation',
    'عالم التقييم الفني',
    ['museums'],
    'intermediate',
    55,
    4,
    'yes',
    'published',
    ['employees'],
  ],
  [
    'C07',
    'Creative Tourism: What is it?',
    'السياحة الإبداعية',
    ['creative'],
    'beginner',
    40,
    3,
    'yes',
    'published',
    ['employees'],
  ],
  [
    'C08',
    'Data Protection for People and Performance',
    'حماية البيانات',
    ['compliance'],
    'beginner',
    30,
    3,
    'yes',
    'published',
    ['employees'],
  ],
  [
    'C09',
    'Introduction to Ticketing',
    'مقدمة في التذاكر',
    ['znm'],
    'beginner',
    35,
    3,
    'yes',
    'published',
    ['znm'],
  ],
  [
    'C10',
    'Operational Readiness – Induction',
    'الجاهزية التشغيلية – التعريف',
    ['znm'],
    'beginner',
    40,
    3,
    'yes',
    'published',
    ['znm'],
  ],
  [
    'C11',
    'Operational Readiness – Role-Specific',
    'الجاهزية التشغيلية – حسب الدور',
    ['znm'],
    'intermediate',
    45,
    3,
    'yes',
    'published',
    ['znm'],
  ],
  [
    'C12',
    'VS Knowledge Assessment',
    'تقييم المعرفة',
    ['post'],
    'beginner',
    15,
    1,
    'no',
    'published',
    ['znm'],
  ],
  [
    'C13',
    '24 Hour Challenge – Introduction to Cultural Heritage',
    'تحدي 24 ساعة',
    ['heritage'],
    'beginner',
    90,
    4,
    'yes',
    'published',
    ['zu'],
  ],
  [
    'C14',
    'Condition Report: General Presentation',
    'تقرير الحالة',
    ['doc'],
    'intermediate',
    50,
    3,
    'yes',
    'published',
    ['museopro'],
  ],
  [
    'C15',
    'Conservation and Exhibition of Artefacts',
    'صون وعرض القطع',
    ['cons'],
    'intermediate',
    60,
    4,
    'yes',
    'published',
    ['museopro'],
  ],
  [
    'C16',
    'Curating an Exhibition: From Concept to Production',
    'تنظيم المعارض',
    ['cons'],
    'advanced',
    70,
    4,
    'yes',
    'published',
    ['museopro'],
  ],
  [
    'C17',
    'Written and Oral Interpretation Tools in Heritage',
    'أدوات التفسير',
    ['interp'],
    'intermediate',
    45,
    3,
    'yes',
    'coming_soon',
    ['museopro'],
  ],
  [
    'C18',
    'Introduction to Generative AI',
    'مقدمة في الذكاء الاصطناعي التوليدي',
    ['aware'],
    'beginner',
    120,
    1,
    'external',
    'published',
    ['nibras'],
  ],
  [
    'C19',
    'Ethics of AI',
    'أخلاقيات الذكاء الاصطناعي',
    ['aware'],
    'beginner',
    90,
    1,
    'external',
    'published',
    ['nibras'],
  ],
  [
    'C20',
    'Foundations of Prompt Engineering',
    'أساسيات هندسة الأوامر',
    ['pract'],
    'intermediate',
    180,
    1,
    'external',
    'published',
    ['nibras'],
  ],
  [
    'C21',
    'LLMOps',
    'عمليات نماذج اللغة',
    ['builder'],
    'advanced',
    240,
    1,
    'external',
    'published',
    ['nibras'],
  ],
  [
    'C22',
    'UNESCO: Implementation of the Convention on Diversity of Cultural Expressions',
    'اتفاقية اليونسكو',
    ['div'],
    'intermediate',
    60,
    3,
    'yes',
    'published',
    ['chkforum'],
  ],
  [
    'C23',
    'Abu Dhabi Creative City and Its Cooperation with Other Cities',
    'أبوظبي مدينة مبدعة',
    ['div'],
    'intermediate',
    45,
    3,
    'yes',
    'published',
    ['chkforum'],
  ],
]
interface Row {
  key: string
  en: string
  ar: string
  cats: string[]
  level: Level
  min: number
  units: number
  cert: 'yes' | 'no' | 'external'
  status: Course['status'] | 'coming_soon'
  sites: string[]
}
const ROWS: Row[] = RAW.map(([key, en, ar, cats, level, min, units, cert, status, sites]) => ({
  key,
  en,
  ar,
  cats,
  level,
  min,
  units,
  cert,
  status,
  sites,
}))

let seq = 0
/** Client-side ids; the backend assigns uuids. */
export const uid = (p: string) => `${p}${(seq += 1)}-${Math.random().toString(36).slice(2, 6)}`

const opt = (text: I18n, correct: boolean): QuestionOption => ({ id: uid('o'), text, correct })
const q = (
  type: Question['type'],
  text: I18n,
  options: QuestionOption[],
  points: number,
  order: number,
): Question => ({
  id: uid('q'),
  type,
  text,
  options,
  points,
  order,
})
const tf = (correctTrue: boolean) => [
  opt(i('True', 'صح'), correctTrue),
  opt(i('False', 'خطأ'), !correctTrue),
]

function blocksC01(): Record<string, Block[]> {
  const b = (
    unitId: string,
    order: number,
    type: BlockType,
    required: boolean,
    payload: BlockPayload,
  ): Block => ({
    id: uid('b'),
    unitId,
    type,
    order,
    required,
    payload,
  })
  return {
    U1: [
      b('U1', 0, 'youtube', true, {
        title: i('DCT in three minutes', 'الدائرة في ثلاث دقائق'),
        videoUrl: 'dQw4w9WgXcQ',
        mustWatch: true,
      }),
      b('U1', 1, 'text', true, {
        title: i('Summary: who we are', 'ملخّص: من نحن'),
        body: i(
          'The Department of Culture and Tourism – Abu Dhabi brings culture and tourism together under one roof. We protect the emirate’s heritage, grow its creative industries and welcome millions of visitors every year.\n\nIn this course you will meet our sectors, visit our cultural sites and see where your role fits in the visitor journey.',
          'تجمع دائرة الثقافة والسياحة – أبوظبي الثقافة والسياحة تحت سقف واحد. نحمي تراث الإمارة، وننمّي صناعاتها الإبداعية، ونستقبل ملايين الزوار كل عام.\n\nستتعرّف في هذه الدورة إلى قطاعاتنا، وتزور مواقعنا الثقافية، وترى موقع دورك في رحلة الزائر.',
        ),
      }),
      b('U1', 2, 'case_study', true, {
        title: i(
          'Case study: a first visit to Qasr Al Hosn',
          'دراسة حالة: الزيارة الأولى لقصر الحصن',
        ),
        scenario: i(
          'A family arrives at Qasr Al Hosn on a Friday afternoon. They booked online, but the children are tired and the parents want to understand the fort’s story in under an hour. Three DCT colleagues — ticketing, a guide and a café host — each meet them once.',
          'تصل عائلة إلى قصر الحصن عصر يوم جمعة. حجزوا عبر الإنترنت، لكن الأطفال متعبون والوالدان يريدان فهم قصة الحصن في أقل من ساعة. يلتقيهم ثلاثة من زملاء الدائرة — في التذاكر، والإرشاد، والمقهى — كلٌّ مرة واحدة.',
        ),
        reflection: i(
          'Which of the three moments would you improve first, and how?',
          'أيّ اللحظات الثلاث ستحسّنها أولاً، وكيف؟',
        ),
      }),
      b('U1', 3, 'quotes', false, {
        title: i('Voices from DCT', 'أصوات من الدائرة'),
        quotes: [
          {
            text: i(
              'Every visitor should leave with a story they want to tell.',
              'يجب أن يغادر كل زائر ومعه قصة يرغب في روايتها.',
            ),
            author: i('Visitor Experience team', 'فريق تجربة الزوار'),
          },
          {
            text: i(
              'Heritage is not behind glass — it is what we do every day.',
              'التراث ليس خلف الزجاج، بل هو ما نفعله كل يوم.',
            ),
            author: i('Cultural Heritage sector', 'قطاع التراث الثقافي'),
          },
        ],
      }),
    ],
    U2: [
      b('U2', 0, 'audio', true, {
        title: i('DCT Flow — Our sectors', 'تدفّق الدائرة — قطاعاتنا'),
        audioMeta: '6:04 · 5.6 MB · MP3',
        transcript: i(
          'Welcome to DCT Flow. In the next six minutes we walk through how our sectors work together…',
          'مرحباً بك في «تدفّق الدائرة». في الدقائق الست القادمة نتعرّف إلى طريقة عمل قطاعاتنا معاً…',
        ),
      }),
      b('U2', 1, 'text', true, {
        title: i('Our sectors at a glance', 'قطاعاتنا بإيجاز'),
        body: i(
          'Culture, tourism, heritage and creative industries each have their own teams — and they meet in every visitor experience.',
          'لكل من الثقافة والسياحة والتراث والصناعات الإبداعية فرقها الخاصة — وتلتقي جميعها في كل تجربة زائر.',
        ),
      }),
      b('U2', 2, 'resources', false, {
        title: i('Sector map', 'خريطة القطاعات'),
        files: [{ name: 'Sector map.pdf', ext: 'PDF', size: '1.2 MB', color: '#D63539' }],
      }),
      b('U2', 3, 'survey', true, {
        title: i('Quick check-in', 'استطلاع سريع'),
        surveyQuestions: [
          {
            text: i(
              'Which sector did you know least about before this unit?',
              'ما القطاع الذي كنت تعرف عنه أقل قبل هذا الدرس؟',
            ),
            type: 'single',
          },
          {
            text: i('How clear is the sector map? (1–5)', 'ما مدى وضوح خريطة القطاعات؟ (1–5)'),
            type: 'scale',
          },
          {
            text: i('What would you like to learn next?', 'ماذا تودّ أن تتعلّم بعد ذلك؟'),
            type: 'open',
          },
        ],
      }),
    ],
    U3: [
      b('U3', 0, 'scorm', true, {
        title: i('Cultural sites explorer', 'مستكشف المواقع الثقافية'),
        scormMeta: '48 MB · SCORM 1.2',
        launchFile: 'index_lms.html',
        completionRule: 'completed',
      }),
      b('U3', 1, 'text', true, {
        title: i('Beyond the landmarks', 'ما وراء المعالم'),
        body: i(
          'From Al Ain Oasis to the Saadiyat Cultural District, each site has its own visitors, rhythms and stories.',
          'من واحة العين إلى المنطقة الثقافية في السعديات، لكل موقع زواره وإيقاعه وحكاياته.',
        ),
      }),
      b('U3', 2, 'youtube_playlist', false, {
        title: i('Site stories', 'حكايات المواقع'),
        videos: [
          {
            title: i('Qasr Al Hosn — the story of a fort', 'قصر الحصن — حكاية حصن'),
            videoId: 'X7kq2LmP0aQ',
            duration: '4:10',
          },
          {
            title: i('Al Ain Oasis at dawn', 'واحة العين عند الفجر'),
            videoId: 'T3vN8rWb1sE',
            duration: '3:05',
          },
          {
            title: i('Inside the Saadiyat Cultural District', 'داخل المنطقة الثقافية في السعديات'),
            videoId: 'H6pZ4yUc9oK',
            duration: '5:40',
          },
        ],
      }),
    ],
    U4: [
      b('U4', 0, 'text', true, {
        title: i('Every role shapes the visit', 'كل دور يصنع الزيارة'),
        body: i(
          'Whether you sell tickets, write policy or build systems, your work reaches a visitor somewhere along their journey.',
          'سواء كنت تبيع التذاكر أو تكتب السياسات أو تبني الأنظمة، يصل عملك إلى الزائر في مرحلة ما من رحلته.',
        ),
      }),
      b('U4', 1, 'action_plan', true, {
        title: i('My action plan', 'خطة عملي'),
        intro: i(
          'Answer five short questions. Your plan is private and you can download it as a PDF.',
          'أجب عن خمسة أسئلة قصيرة. خطتك خاصة بك ويمكنك تنزيلها بصيغة PDF.',
        ),
        allowPdf: true,
        planQuestions: [
          {
            text: i(
              'In 3 years, on the professional side, I want to have done…',
              'بعد 3 سنوات، على الصعيد المهني، أريد أن أكون قد أنجزت…',
            ),
            limit: 500,
          },
          {
            text: i(
              'In 3 years, on the personal side, I want to have learned…',
              'بعد 3 سنوات، على الصعيد الشخصي، أريد أن أكون قد تعلّمت…',
            ),
            limit: 500,
          },
          {
            text: i(
              'One thing I will change in how I welcome visitors is…',
              'أمر واحد سأغيّره في طريقة استقبالي للزوار هو…',
            ),
            limit: 500,
          },
          {
            text: i(
              'The colleague or team I will learn from is…',
              'الزميل أو الفريق الذي سأتعلّم منه هو…',
            ),
            limit: 500,
          },
          {
            text: i(
              'My first step, starting this month, is…',
              'خطوتي الأولى، ابتداءً من هذا الشهر، هي…',
            ),
            limit: 500,
          },
        ],
      }),
      b('U4', 2, 'resources', false, {
        title: i('Action plan template', 'نموذج خطة العمل'),
        files: [{ name: 'Action plan template.docx', ext: 'DOC', size: '48 KB', color: '#3B2F92' }],
      }),
      b('U4', 3, 'quiz_blocking', true, {
        title: i('Unit check: your role in the visitor journey', 'تحقق الدرس: دورك في رحلة الزائر'),
        assessmentId: 'A-unit',
      }),
    ],
  }
}

function generic(row: Row): { modules: ModuleNode[] } {
  const n = row.units
  const names: [string, string][] = [
    ['Overview', 'نظرة عامة'],
    ['Key ideas', 'الأفكار الرئيسية'],
    ['In practice', 'في الممارسة'],
    ['Case examples', 'أمثلة تطبيقية'],
    ['Check your understanding', 'تحقّق من فهمك'],
  ]
  const modules: ModuleNode[] = [
    { id: uid('m'), title: i('Introduction', 'مقدّمة'), order: 0, units: [] },
    ...(n > 1
      ? [{ id: uid('m'), title: i('Going further', 'التعمّق'), order: 1, units: [] as UnitNode[] }]
      : []),
  ]
  for (let k = 0; k < n; k++) {
    const nm = (k === n - 1 && n > 1 ? names[4] : names[Math.min(k, 3)]) as [string, string]
    const mod = modules[k < Math.ceil(n / 2) ? 0 : modules.length - 1] as ModuleNode
    const unitId = uid('u')
    mod.units.push({
      id: unitId,
      moduleId: mod.id,
      title: i(nm[0], nm[1]),
      order: mod.units.length,
      durationMin: null,
      blocks: [
        {
          id: uid('b'),
          unitId,
          type: 'text',
          order: 0,
          required: true,
          payload: {
            title: i(nm[0], nm[1]),
            body: i(`Unit introduction for ${row.en}.`, `مقدّمة الدرس في «${row.ar}».`),
          },
        },
        {
          id: uid('b'),
          unitId,
          type: 'youtube',
          order: 1,
          required: true,
          payload: {
            title: i(`${nm[0]} — video`, `فيديو: ${nm[1]}`),
            videoUrl: 'dQw4w9WgXcQ',
            mustWatch: true,
          },
        },
      ],
    })
  }
  return { modules }
}

function assessmentsC01(unitId: string): Assessment[] {
  const mc = (
    en: string,
    ar: string,
    opts: [string, string][],
    ok: number,
    pts: number,
    order: number,
  ) =>
    q(
      'multiple_choice',
      i(en, ar),
      opts.map((o, k) => opt(i(o[0], o[1]), k === ok)),
      pts,
      order,
    )
  return [
    {
      id: 'A-pre',
      kind: 'pre',
      unitId: null,
      title: i('DCT World pre-test', 'الاختبار القبلي – عالم الدائرة'),
      type: 'quiz_non_blocking',
      passMark: 50,
      attemptsAllowed: 2,
      timeLimitMin: null,
      shuffle: false,
      showAnswers: true,
      isFinal: false,
      version: 1,
      hasAttempts: false,
      questions: [
        mc(
          'How many sectors does DCT Abu Dhabi bring together?',
          'كم عدد القطاعات التي تجمعها الدائرة؟',
          [
            ['Two: culture and tourism', 'اثنان: الثقافة والسياحة'],
            ['Four', 'أربعة'],
            ['One', 'واحد'],
          ],
          0,
          1,
          0,
        ),
        q(
          'true_false',
          i(
            'You have visited at least one DCT cultural site.',
            'سبق أن زرت موقعاً ثقافياً واحداً على الأقل من مواقع الدائرة.',
          ),
          tf(true),
          1,
          1,
        ),
        q(
          'open_text',
          i('What do you hope to learn in this course?', 'ماذا تأمل أن تتعلّم في هذه الدورة؟'),
          [],
          2,
          2,
        ),
      ],
    },
    {
      id: 'A-post',
      kind: 'post',
      unitId: null,
      title: i('DCT World final check', 'التحقق النهائي – عالم الدائرة'),
      type: 'quiz_blocking',
      passMark: 70,
      attemptsAllowed: 2,
      timeLimitMin: null,
      shuffle: true,
      showAnswers: false,
      isFinal: true,
      version: 1,
      hasAttempts: true,
      questions: [
        mc(
          'Which two areas does DCT Abu Dhabi bring together?',
          'ما المجالان اللذان تجمعهما دائرة الثقافة والسياحة – أبوظبي؟',
          [
            ['Culture and tourism', 'الثقافة والسياحة'],
            ['Sport and health', 'الرياضة والصحة'],
            ['Transport and housing', 'النقل والإسكان'],
            ['Education and research', 'التعليم والبحث'],
          ],
          0,
          2,
          0,
        ),
        mc(
          'Where is the Zayed National Museum?',
          'أين يقع متحف زايد الوطني؟',
          [
            ['Saadiyat Cultural District', 'المنطقة الثقافية في السعديات'],
            ['Al Ain Oasis', 'واحة العين'],
            ['Yas Island', 'جزيرة ياس'],
            ['Al Dhafra', 'الظفرة'],
          ],
          0,
          2,
          1,
        ),
        mc(
          'Which stage of the visitor journey comes first?',
          'ما المرحلة الأولى في رحلة الزائر؟',
          [
            ['Inspiration and planning', 'الإلهام والتخطيط'],
            ['Arrival', 'الوصول'],
            ['The visit', 'الزيارة'],
            ['Sharing the memory', 'مشاركة الذكرى'],
          ],
          0,
          2,
          2,
        ),
        q(
          'true_false',
          i(
            'Every DCT employee plays a part in the visitor journey.',
            'لكل موظف في الدائرة دور في رحلة الزائر.',
          ),
          tf(true),
          1,
          3,
        ),
        q(
          'open_text',
          i(
            'Describe one way your role improves a visitor’s experience.',
            'صف طريقة واحدة يُحسّن بها دورك تجربة الزائر.',
          ),
          [],
          3,
          4,
        ),
      ],
    },
    {
      id: 'A-unit',
      kind: 'unit',
      unitId,
      title: i('Unit check: your role in the visitor journey', 'تحقق الدرس: دورك في رحلة الزائر'),
      type: 'quiz_blocking',
      passMark: 60,
      attemptsAllowed: 3,
      timeLimitMin: 10,
      shuffle: false,
      showAnswers: true,
      isFinal: false,
      version: 1,
      hasAttempts: false,
      questions: [
        q(
          'true_false',
          i(
            'Only front-line staff affect the visitor experience.',
            'الموظفون في الخطوط الأمامية وحدهم يؤثرون في تجربة الزائر.',
          ),
          tf(false),
          1,
          0,
        ),
        q(
          'sorting',
          i('Put the visitor journey in order.', 'رتّب مراحل رحلة الزائر.'),
          [
            opt(i('Inspiration and planning', 'الإلهام والتخطيط'), true),
            opt(i('Arrival', 'الوصول'), true),
            opt(i('The visit', 'الزيارة'), true),
            opt(i('Sharing the memory', 'مشاركة الذكرى'), true),
          ],
          2,
          1,
        ),
      ],
    },
  ]
}

/** The tree GET /api/admin/courses/{id} would return, for the seed course with this key. */
export function seedCourse(key: string): CourseTree {
  const row = ROWS.find((r) => r.key === key.toUpperCase()) ?? (ROWS[0] as Row)
  const isC01 = row.key === 'C01'
  const gen = isC01 ? null : generic(row)
  let modules: ModuleNode[]
  let assessments: Assessment[] = []
  if (isC01) {
    const blocks = blocksC01()
    const unit = (
      id: string,
      moduleId: string,
      en: string,
      ar: string,
      order: number,
    ): UnitNode => ({
      id: uid('u'),
      moduleId,
      title: i(en, ar),
      order,
      durationMin: null,
      blocks: (blocks[id] ?? []).map((b) => ({ ...b })),
    })
    const m1 = uid('m')
    const m2 = uid('m')
    const units = [
      unit('U1', m1, 'Who we are', 'من نحن', 0),
      unit('U2', m1, 'Our sectors', 'قطاعاتنا', 1),
      unit('U3', m2, 'Abu Dhabi’s cultural sites', 'المواقع الثقافية في أبوظبي', 0),
      unit('U4', m2, 'Your role in the visitor journey', 'دورك في رحلة الزائر', 1),
    ]
    for (const u of units) for (const b of u.blocks) b.unitId = u.id
    modules = [
      {
        id: m1,
        title: i('Welcome to DCT', 'مرحباً بك في الدائرة'),
        order: 0,
        units: units.slice(0, 2),
      },
      {
        id: m2,
        title: i('Culture & Tourism', 'الثقافة والسياحة'),
        order: 1,
        units: units.slice(2),
      },
    ]
    const last = units[3] as UnitNode
    assessments = assessmentsC01(last.id)
    const quizBlock = last.blocks.find((b) => b.type === 'quiz_blocking')
    if (quizBlock) quizBlock.payload.assessmentId = 'A-unit'
  } else {
    modules = gen?.modules ?? []
  }
  const certKind = row.cert
  const man = (m: string) =>
    (m === 'employees' && (row.key === 'C01' || row.key === 'C03')) ||
    m === 'znm' ||
    (m === 'museopro' && (row.key === 'C14' || row.key === 'C15'))
  const course: Course = {
    id: row.key,
    slug: row.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    title: i(row.en, row.ar),
    description: isC01
      ? i(
          'Meet DCT Abu Dhabi: who we are, our sectors and your role in the visitor journey.',
          'تعرّف إلى الدائرة: من نحن، وقطاعاتنا، ودورك في رحلة الزائر.',
        )
      : i(`A short course on ${row.en}.`, `دورة قصيرة في «${row.ar}».`),
    overview: isC01
      ? i(
          'Get to know DCT Abu Dhabi: who we are, our sectors, our cultural sites and your part in every visitor’s journey.',
          'تعرّف إلى دائرة الثقافة والسياحة – أبوظبي: من نحن، وقطاعاتنا، ومواقعنا الثقافية، ودورك في رحلة كل زائر.',
        )
      : i(`An introduction to ${row.en}.`, `مقدّمة في «${row.ar}».`),
    imageUrl: blob(COURSE_IMG[row.key] ?? 'fa500a874150b2a1769785936a6d7785'),
    categories: row.cats.slice(),
    level: row.level,
    durationMin: row.min,
    status: row.status === 'coming_soon' ? 'published' : row.status,
    sequential: true,
    certificateEnabled: certKind !== 'no',
    externalCertificate: certKind === 'external',
    comingSoon: row.status === 'coming_soon',
    isCertProgramme: false,
    pointsConfig: { unit: 10, module: 0, course: 50, assessmentPass: 20 },
    microsites: row.sites.map((id) => ({ id, mandatory: man(id) })),
  }
  return {
    course,
    modules,
    assessments,
    certificate: {
      signatureName: 'Aisha Al Marzouqi',
      signatureTitle: 'Learning & Development, DCT Abu Dhabi',
      showSerial: true,
    },
  }
}

/** Last-save line the design showed before anything is edited. */
export const SEED_LAST_SAVED = {
  en: 'Last saved 5 Oct 2026, 14:20 Gulf',
  ar: 'آخر حفظ 5 أكتوبر 2026، 14:20 بتوقيت الخليج',
}
