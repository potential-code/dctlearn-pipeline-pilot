/**
 * One entry per canvas artboard (EN boards; the -AR boards are the same entries with ?lang=ar).
 * `path` is the SPEC URL; `account` the demo account whose session the page needs.
 */
export type Who = 'learner' | 'mentor' | 'judge' | 'subadmin' | 'admin'
export type Entry = {
  artboard: string
  path: string
  account?: Who
  /** The real artboard file when this entry is a variant board (Auth-MSignin → Auth). */
  source?: string
  /** Props the route passes to the page; parity fixtures render the artboard with the same. */
  props?: Record<string, unknown>
}

export const EMAILS: Record<Who, string> = {
  learner: 'saeed.h@dctlearn.example',
  mentor: 'hessa.n@example.com',
  judge: 'noura.k@example.com',
  subadmin: 'layla.h@dctlearn.example',
  admin: 'aisha.admin@dctlearn.example',
}

export const PAGES: Entry[] = [
  // public and auth
  { artboard: 'Home', path: '/' },
  { artboard: 'Microsite', path: '/elevate?popup=false', props: { site: 'elevate', popup: false } },
  {
    artboard: 'Microsite-Popup',
    path: '/elevate',
    source: 'Microsite',
    props: { site: 'elevate', popup: true },
  },
  {
    artboard: 'Microsite-ZNM',
    path: '/znm',
    source: 'Microsite',
    props: { site: 'znm', popup: false },
  },
  {
    artboard: 'Microsite-Ruwaad',
    path: '/ruwaad',
    source: 'Microsite',
    props: { site: 'ruwaad', popup: false },
  },
  { artboard: 'Auth', path: '/login', props: { screen: 'login' } },
  {
    artboard: 'Auth-MSignin',
    path: '/elevate/login',
    source: 'Auth',
    props: { screen: 'msignin' },
  },
  {
    artboard: 'Auth-Register',
    path: '/employee-registration',
    source: 'Auth',
    props: { screen: 'register' },
  },
  { artboard: 'Auth-Reset', path: '/reset-password', source: 'Auth', props: { screen: 'reset' } },
  { artboard: 'Auth-SetPw', path: '/set-password', source: 'Auth', props: { screen: 'setpw' } },
  { artboard: 'Auth-Invite', path: '/elevate/invite', source: 'Auth', props: { screen: 'invite' } },
  { artboard: 'P02-Employees', path: '/professionals' },
  { artboard: 'P03-Students', path: '/students' },
  { artboard: 'P04-FAQ', path: '/faq' },
  { artboard: 'P05-NotFound', path: '/404' },
  { artboard: 'P27-VoiceHiring', path: '/ai/voice-hiring', props: { screen: 'intro' } },
  // learner
  { artboard: 'P13-Hubs', path: '/platforms', account: 'learner' },
  {
    artboard: 'P14-Dashboard',
    path: '/employees/dashboard',
    account: 'learner',
    props: { site: 'employees' },
  },
  {
    artboard: 'P52-Hub',
    path: '/employees/hub/courses',
    account: 'learner',
    props: { site: 'employees', tab: 'courses' },
  },
  {
    artboard: 'P16-Course',
    path: '/employees/learn/dct-world',
    account: 'learner',
    props: { site: 'employees', course: 'dct-world' },
  },
  {
    artboard: 'P51-Achievements',
    path: '/employees/achievements',
    account: 'learner',
    props: { site: 'employees' },
  },
  {
    artboard: 'P15-Profile',
    path: '/employees/profile',
    account: 'learner',
    props: { site: 'employees' },
  },
  { artboard: 'PX-Notifications', path: '/notifications', account: 'learner' },
  {
    artboard: 'P17-Mentors',
    path: '/elevate/mentoring',
    account: 'learner',
    props: { site: 'elevate', screen: 'matched' },
  },
  {
    artboard: 'P18-MentorProfile',
    path: '/elevate/mentoring/mentor/hessa',
    account: 'learner',
    props: { site: 'elevate', mentor: 'hessa' },
  },
  {
    artboard: 'P19-MenteeRegister',
    path: '/elevate/mentoring/register',
    account: 'learner',
    props: { site: 'elevate', screen: 'prefilled' },
  },
  {
    artboard: 'P20-Match',
    path: '/elevate/mentoring/match',
    account: 'learner',
    props: { site: 'elevate', screen: 'loading' },
  },
  {
    artboard: 'P21-Book',
    path: '/elevate/mentoring/book',
    account: 'learner',
    props: { site: 'elevate', screen: 'pick' },
  },
  {
    artboard: 'P22-SessionRoom',
    path: '/mentoring/session/b1',
    account: 'learner',
    props: { role: 'learner', screen: 'ready' },
  },
  {
    artboard: 'P23-AICoaches',
    path: '/employees/ai',
    account: 'learner',
    props: { site: 'employees' },
  },
  {
    artboard: 'P24-AICoach',
    path: '/employees/ai/coach/culture-bot',
    account: 'learner',
    props: { site: 'employees', coach: 'culture-bot', screen: 'conversation' },
  },
  {
    artboard: 'P25-AITool',
    path: '/employees/ai/tool/lesson-planner',
    account: 'learner',
    props: { site: 'employees', tool: 'lesson-planner', screen: 'loading' },
  },
  {
    artboard: 'P26-LessonPlanner',
    path: '/employees/ai/lesson-planner',
    account: 'learner',
    props: { site: 'employees', screen: 'empty' },
  },
  {
    artboard: 'P28-Competition',
    path: '/zu/competition',
    account: 'learner',
    props: { site: 'zu', screen: 'draft' },
  },
  {
    artboard: 'P29-CompetitionDashboard',
    path: '/zu/competition/dashboard',
    account: 'learner',
    props: { site: 'zu', screen: 'judging' },
  },
  // mentor and judge
  { artboard: 'P30-Mentor', path: '/mentor', account: 'mentor', props: { tab: 'overview' } },
  { artboard: 'P31-Availability', path: '/mentor/availability', account: 'mentor' },
  { artboard: 'P33-Judge', path: '/judge', account: 'judge' },
  { artboard: 'P34-Applicants', path: '/judge/applicants', account: 'judge' },
  // sub admin
  {
    artboard: 'P35-SubAdmin',
    path: '/elevate/admin',
    account: 'subadmin',
    props: { site: 'elevate' },
  },
  {
    artboard: 'P40-Members',
    path: '/elevate/admin/members',
    account: 'subadmin',
    props: { site: 'elevate' },
  },
  { artboard: 'P41-Rounds', path: '/zu/admin/rounds', account: 'subadmin', props: { site: 'zu' } },
  {
    artboard: 'P43-Rubrics',
    path: '/zu/admin/rubrics',
    account: 'subadmin',
    props: { site: 'zu' },
  },
  { artboard: 'P42-Judges', path: '/zu/admin/judges', account: 'subadmin', props: { site: 'zu' } },
  { artboard: 'P44-Scores', path: '/zu/admin/scores', account: 'subadmin', props: { site: 'zu' } },
  {
    artboard: 'P53-Resources',
    path: '/znm/admin/resources',
    account: 'subadmin',
    props: { site: 'znm' },
  },
  // admin
  { artboard: 'P45-Admin', path: '/admin', account: 'admin', props: { tab: 'general' } },
  {
    artboard: 'P55-Reports',
    path: '/admin/microsites',
    account: 'admin',
    props: { site: 'employees' },
  },
  {
    artboard: 'P50-Microsites',
    path: '/admin/platforms',
    account: 'admin',
    props: { tab: 'live' },
  },
  {
    artboard: 'P36-CreateMicrosite',
    path: '/admin/platforms/new',
    account: 'admin',
    props: { step: '1' },
  },
  {
    artboard: 'P37-Templates',
    path: '/admin/templates',
    account: 'admin',
    props: { preview: 'none' },
  },
  { artboard: 'P47-Users', path: '/admin/users', account: 'admin', props: { tab: 'users' } },
  { artboard: 'P48-MentorPool', path: '/admin/mentors', account: 'admin' },
  { artboard: 'P46-Catalog', path: '/admin/catalog', account: 'admin' },
  {
    artboard: 'P59-CourseEditor',
    path: '/admin/catalog/editor/C01',
    account: 'admin',
    props: { course: 'C01' },
  },
  { artboard: 'P57-Events', path: '/admin/events', account: 'admin' },
  { artboard: 'P56-Forms', path: '/admin/surveys', account: 'admin' },
  { artboard: 'P54-ResourceReview', path: '/admin/resources', account: 'admin' },
  { artboard: 'P58-AchievementsAdmin', path: '/admin/achievements', account: 'admin' },
  { artboard: 'P60-Translations', path: '/admin/translations', account: 'admin' },
  { artboard: 'P61-AIEmbeds', path: '/admin/ai-embeds', account: 'admin' },
  // design-system boards (dev only)
  { artboard: 'Main', path: '/design/foundations' },
  { artboard: 'Buttons', path: '/design/buttons' },
  { artboard: 'Forms', path: '/design/forms' },
  { artboard: 'Shell', path: '/design/shell' },
  { artboard: 'ShellMobile', path: '/design/shell-mobile' },
  { artboard: 'Cards', path: '/design/cards' },
  { artboard: 'Data', path: '/design/data' },
  { artboard: 'Feedback', path: '/design/feedback' },
  { artboard: 'Landing', path: '/design/landing' },
  { artboard: 'Learning', path: '/design/learning' },
]
