import type { Role } from '@shared/roles'

export type Account = {
  email: string
  name: { en: string; ar: string }
  initials: string
  role: Role
  /** Microsite the account manages (sub admins) or lands in. */
  site?: string
  /** Where the account lands after sign-in (the prototype's demo destinations). */
  home: string
}

/** The five demo accounts on the prototype's sign-in screen, plus the other SEED.md people. */
export const ACCOUNTS: Account[] = [
  {
    email: 'saeed.h@dctlearn.example',
    name: { en: 'Saeed Al Hammadi', ar: 'سعيد الحمادي' },
    initials: 'SA',
    role: 'learner',
    home: '/platforms',
  },
  {
    email: 'hessa.n@example.com',
    name: { en: 'Dr. Hessa Al Nuaimi', ar: 'د. حصة النعيمي' },
    initials: 'HN',
    role: 'mentor',
    home: '/mentor',
  },
  {
    email: 'noura.k@example.com',
    name: { en: 'Noura Al Kaabi', ar: 'نورة الكعبي' },
    initials: 'NK',
    role: 'judge',
    home: '/judge',
  },
  {
    email: 'layla.h@dctlearn.example',
    name: { en: 'Layla Haddad', ar: 'ليلى حداد' },
    initials: 'LH',
    role: 'sub_admin',
    site: 'elevate',
    home: '/elevate/admin',
  },
  {
    email: 'aisha.admin@dctlearn.example',
    name: { en: 'Aisha Al Marzouqi', ar: 'عائشة المرزوقي' },
    initials: 'AM',
    role: 'admin',
    home: '/admin',
  },
  {
    email: 'rashid.b@example.com',
    name: { en: 'Rashid Al Blooshi', ar: 'راشد البلوشي' },
    initials: 'RB',
    role: 'mentor',
    home: '/mentor',
  },
  {
    email: 'mariam.k@example.com',
    name: { en: 'Mariam Khoury', ar: 'مريم خوري' },
    initials: 'MK',
    role: 'mentor',
    home: '/mentor',
  },
  {
    email: 'daniel.o@example.com',
    name: { en: 'Daniel Osei', ar: 'دانيال أوسي' },
    initials: 'DO',
    role: 'judge',
    home: '/judge',
  },
  {
    email: 'omar.m@dctlearn.example',
    name: { en: 'Omar Al Mansoori', ar: 'عمر المنصوري' },
    initials: 'OM',
    role: 'sub_admin',
    site: 'employees',
    home: '/employees/admin',
  },
  {
    email: 'khalid.d@dctlearn.example',
    name: { en: 'Khalid Al Dhaheri', ar: 'خالد الظاهري' },
    initials: 'KD',
    role: 'sub_admin',
    site: 'znm',
    home: '/znm/admin',
  },
]

/** Same routing rule as the prototype's sign-in form: known e-mail → its account, else a learner. */
export function accountFor(email: string): Account {
  const e = email.trim().toLowerCase()
  const known = ACCOUNTS.find((a) => a.email === e)
  if (known) return known
  const local = e.split('@')[0] ?? ''
  const like = ACCOUNTS.find((a) => a.email.split('@')[0]?.split('.')[0] === local.split('.')[0])
  return like ?? { ...(ACCOUNTS[0] as Account), email: e }
}
