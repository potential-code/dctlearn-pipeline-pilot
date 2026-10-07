import { z } from 'zod'
import { HUB_TABS, MICROSITE_STATUSES, SIGN_IN_MODES } from '../enums'
import {
  CourseCard,
  email,
  httpsUrl,
  I18n,
  i18nShort,
  i18nTitle,
  isoDateTime,
  MentorCard,
  MicrositeRef,
  paginated,
  personName,
  slug,
  UserDto,
} from './common'

const url = z.string().max(2048)
/** Relative app paths (`/elevate/login`) or https links. */
const linkUrl = z.union([z.string().regex(/^\/[A-Za-z0-9/_?=&.-]*$/), httpsUrl])
const label = z.object({ en: z.string().max(80), ar: z.string().max(80) })

/* ------------------------------------------------------------------ landing (P12 / P35) */

export const LandingInput = z.object({
  hero: z.object({
    heading: i18nTitle,
    subheading: i18nShort,
    imageUrl: url,
    copyright: z.string().max(240).optional(),
  }),
  cta: z.object({
    signedOut: z.object({ label, url: linkUrl }),
    signedIn: z.object({ label, url: linkUrl }),
  }),
  popup: z
    .object({
      kind: z.enum(['image', 'text', 'image_text']),
      imageUrl: url.optional(),
      text: i18nShort.optional(),
      cta: z.object({ label, url: linkUrl }).optional(),
    })
    .optional(),
  section: z.object({
    kind: z.enum(['partners', 'social', 'custom', 'none']),
    partners: z
      .array(z.object({ name: z.string().max(120), imageUrl: url, url: httpsUrl }))
      .max(20)
      .optional(),
    partnersTitle: i18nShort.optional(),
    social: z
      .object({
        title: i18nShort,
        logoUrl: url,
        logoBg: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        instagram: httpsUrl.optional(),
        x: httpsUrl.optional(),
        facebook: httpsUrl.optional(),
        linkedin: httpsUrl.optional(),
        youtube: httpsUrl.optional(),
      })
      .optional(),
    customHtml: z.string().max(20_000).optional(),
  }),
  embed: z
    .object({
      kind: z.enum(['survey_monkey', 'form']),
      formId: z.uuid().optional(),
      html: z.string().max(20_000).optional(),
    })
    .optional(),
  ifMatch: isoDateTime.optional(),
})

const LinkOut = z.strictObject({ label: I18n, url: z.string() })
export const LandingDto = z.strictObject({
  hero: z.strictObject({
    heading: I18n,
    subheading: I18n,
    imageUrl: z.string(),
    copyright: z.string().optional(),
  }),
  cta: z.strictObject({ signedOut: LinkOut, signedIn: LinkOut }),
  popup: z
    .strictObject({
      kind: z.enum(['image', 'text', 'image_text']),
      imageUrl: z.string().optional(),
      text: I18n.optional(),
      cta: LinkOut.optional(),
    })
    .optional(),
  section: z.strictObject({
    kind: z.enum(['partners', 'social', 'custom', 'none']),
    partners: z
      .array(z.strictObject({ name: z.string(), imageUrl: z.string(), url: z.string() }))
      .optional(),
    partnersTitle: I18n.optional(),
    social: z
      .strictObject({
        title: I18n,
        logoUrl: z.string(),
        logoBg: z.string(),
        instagram: z.string().optional(),
        x: z.string().optional(),
        facebook: z.string().optional(),
        linkedin: z.string().optional(),
        youtube: z.string().optional(),
      })
      .optional(),
    customHtml: z.string().optional(),
  }),
  embed: z
    .strictObject({
      kind: z.enum(['survey_monkey', 'form']),
      formId: z.string().optional(),
      html: z.string().optional(),
    })
    .optional(),
})

/** P12 public landing */
export const PublicLanding = LandingDto.extend({
  microsite: MicrositeRef.extend({
    signInMode: z.enum(SIGN_IN_MODES),
    landingOnly: z.boolean(),
  }).strict(),
  registerInterest: z.strictObject({ formId: z.string() }).optional(),
}).strict()

export const RegisterInterest = z.object({
  name: personName,
  email,
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+0-9 ()-]*$/)
    .optional(),
  message: z.string().max(1000).optional(),
})

/** P07 */
export const LoginConfig = z.strictObject({
  microsite: MicrositeRef,
  signInMode: z.enum(SIGN_IN_MODES),
  allowSignUp: z.boolean(),
  emailDomainRule: z.string().optional(),
})
export const AccessRequestResponse = z.strictObject({
  id: z.string(),
  status: z.enum(['open', 'approved']),
})

/* ------------------------------------------------------------------ P14 dashboard */

export const DashboardResponse = z.strictObject({
  microsite: MicrositeRef.extend({
    tabs: z.array(z.strictObject({ key: z.enum(HUB_TABS), label: I18n })),
  }).strict(),
  kpis: z.strictObject({
    inProgress: z.number(),
    completed: z.number(),
    certificates: z.number(),
    points: z.number(),
  }),
  continueLearning: z.array(CourseCard),
  mandatory: z.array(CourseCard),
  mentoring: z
    .strictObject({
      enabled: z.boolean(),
      registrationComplete: z.boolean(),
      matchedMentor: MentorCard.optional(),
      nextSession: z
        .strictObject({
          bookingId: z.string(),
          startsAt: z.string(),
          joinUrl: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  competition: z
    .strictObject({
      enabled: z.boolean(),
      roundId: z.string().optional(),
      roundName: I18n.optional(),
      status: z.enum(['not_started', 'in_progress', 'submitted', 'scored']),
      deadline: z.string().optional(),
    })
    .optional(),
  resources: z.array(
    z.strictObject({
      id: z.string(),
      title: I18n,
      url: z.string(),
      imageUrl: z.string().optional(),
    }),
  ),
  events: z.array(
    z.strictObject({
      id: z.string(),
      title: I18n,
      startsAt: z.string(),
      status: z.enum(['upcoming', 'live', 'past', 'cancelled']),
      joinUrl: z.string().optional(),
    }),
  ),
  surveys: z.array(
    z.strictObject({ formId: z.string(), title: I18n, dueAt: z.string().optional() }),
  ),
  tourSeen: z.boolean(),
})

export const HubParams = z.object({ p: slug, tab: z.enum(HUB_TABS) })

/* ------------------------------------------------------------------ P35 sub-admin dashboard */

export const SubAdminDashboard = z.strictObject({
  microsite: MicrositeRef.extend({
    status: z.enum(MICROSITE_STATUSES),
    signInMode: z.enum(SIGN_IN_MODES),
    landingOnly: z.boolean(),
  }).strict(),
  kpis: z.strictObject({
    members: z.number(),
    active30d: z.number(),
    completions: z.number(),
    certificates: z.number(),
    pendingInvites: z.number(),
    pendingResources: z.number(),
  }),
  landing: LandingDto,
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  hasUnpublishedChanges: z.boolean(),
})
export const PublishResponse = z.strictObject({ publishedAt: z.string() })

/* ------------------------------------------------------------------ P40 members & invites */

export const MembersQuery = z.object({
  q: z.string().max(100).optional(),
  status: z.enum(['active', 'disabled', 'invited']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const MemberRow = z.strictObject({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.enum(['active', 'disabled', 'invited']),
  joinedAt: z.string(),
  progressPct: z.number(),
  lastSignInAt: z.string().optional(),
})
export const MembersPage = paginated(MemberRow)

export const InviteMembers = z.object({
  emails: z.array(z.string().max(254)).min(1).max(500),
  role: z.enum(['learner', 'judge']),
  message: z.string().max(1000).optional(),
})
const Skipped = z.strictObject({ email: z.string(), reason: z.string() })
export const InviteResult = z.strictObject({ created: z.number(), skipped: z.array(Skipped) })
export const CsvPreview = z.strictObject({
  preview: z.array(
    z.strictObject({
      row: z.number(),
      email: z.string(),
      name: z.string().optional(),
      valid: z.boolean(),
      reason: z.string().optional(),
    }),
  ),
  token: z.string(),
})
export const CsvConfirm = z.object({ token: z.string().min(10).max(200) })
export const InvitationsQuery = z.object({
  status: z.enum(['sent', 'accepted', 'revoked', 'expired']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const InvitationRow = z.strictObject({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.enum(['sent', 'accepted', 'revoked', 'expired']),
  sentAt: z.string(),
  expiresAt: z.string(),
})
export const InvitationsPage = paginated(InvitationRow)
export const OkResponse = z.strictObject({ ok: z.literal(true) })

/* ------------------------------------------------------------------ P50 / P36 / P37 admin */

const TabInput = z.object({
  key: z.enum(HUB_TABS),
  enabled: z.boolean(),
  label: z.object({ en: z.string().max(80), ar: z.string().max(80) }),
})

export const MicrositeInput = z.object({
  id: slug,
  name: i18nTitle,
  subtitle: i18nShort.optional(),
  templateId: z.string().min(1).max(40),
  branding: z.object({
    logo: url.default(''),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    hero: url.default(''),
  }),
  subAdminEmail: email.optional(),
  signInMode: z.enum(SIGN_IN_MODES),
  emailDomainRule: z
    .string()
    .max(200)
    .regex(/^[a-z0-9.,\s-]*$/i)
    .optional(),
  landingOnly: z.boolean(),
  courseIds: z.array(z.uuid()).max(500).default([]),
  mandatoryCourseIds: z.array(z.uuid()).max(500).default([]),
  tabs: z.array(TabInput).max(6).default([]),
  mentoringEnabled: z.boolean().default(false),
  competitionEnabled: z.boolean().default(false),
  ifMatch: isoDateTime.optional(),
})
/**
 * P50 edit: every field optional and **without defaults** — a field left out keeps its current
 * value (a partial PUT must never wipe courses, tabs or feature flags).
 */
export const MicrositeUpdate = z.object({
  name: i18nTitle.optional(),
  subtitle: i18nShort.optional(),
  templateId: z.string().min(1).max(40).optional(),
  branding: z
    .object({
      logo: url.optional(),
      accentColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      hero: url.optional(),
    })
    .optional(),
  subAdminEmail: email.optional(),
  signInMode: z.enum(SIGN_IN_MODES).optional(),
  emailDomainRule: z
    .string()
    .max(200)
    .regex(/^[a-z0-9.,\s-]*$/i)
    .optional(),
  landingOnly: z.boolean().optional(),
  courseIds: z.array(z.uuid()).max(500).optional(),
  mandatoryCourseIds: z.array(z.uuid()).max(500).optional(),
  tabs: z.array(TabInput).max(6).optional(),
  mentoringEnabled: z.boolean().optional(),
  competitionEnabled: z.boolean().optional(),
  ifMatch: isoDateTime.optional(),
})

export const AdminMicrositeRow = MicrositeRef.extend({
  status: z.enum(MICROSITE_STATUSES),
  signInMode: z.enum(SIGN_IN_MODES),
  landingOnly: z.boolean(),
  subAdmin: UserDto.optional(),
  members: z.number(),
  courses: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).strict()
export const AdminMicrositeList = z.array(AdminMicrositeRow)

export const AdminMicrositeDetail = AdminMicrositeRow.extend({
  templateId: z.string(),
  subtitle: I18n,
  emailDomainRule: z.string().optional(),
  courseIds: z.array(z.string()),
  mandatoryCourseIds: z.array(z.string()),
  tabs: z.array(z.strictObject({ key: z.enum(HUB_TABS), enabled: z.boolean(), label: I18n })),
  mentoringEnabled: z.boolean(),
  competitionEnabled: z.boolean(),
}).strict()

export const StatusChange = z.object({ status: z.enum(MICROSITE_STATUSES) })
export const LandingTemplates = z.array(
  z.strictObject({
    id: z.string(),
    name: z.string(),
    previewUrl: z.string(),
    sections: z.array(z.string()),
  }),
)
export const MicrositeRequestInput = z.object({
  name: z.string().trim().min(2).max(120),
  purpose: z.string().trim().min(2).max(1000),
})
export const MicrositeRequestRow = z.strictObject({
  id: z.string(),
  requestedBy: UserDto,
  name: z.string(),
  purpose: z.string(),
  status: z.enum(['requested', 'approved', 'rejected']),
  requestedAt: z.string(),
})
export const MicrositeRequestList = z.array(MicrositeRequestRow)
export const ApproveResponse = z.strictObject({ micrositeId: z.string() })
export const RejectInput = z.object({ note: z.string().trim().min(1).max(1000) })
