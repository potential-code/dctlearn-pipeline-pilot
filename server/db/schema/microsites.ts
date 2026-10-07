import { deletedAt, i18n, id, timestamps, tstz } from '@server/db/columns'
import { users } from '@server/db/schema/identity'
import type { HubTab } from '@shared/enums'
import type { I18n } from '@shared/schemas/common'
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export type MicrositeTab = { key: HubTab; enabled: boolean; label: I18n }

/** The editable landing (P12/P35). Stored as one document; draft and published copies. */
export type LandingDoc = {
  hero: { heading: I18n; subheading: I18n; imageUrl: string; copyright?: string }
  cta: { signedOut: { label: I18n; url: string }; signedIn: { label: I18n; url: string } }
  popup?: {
    kind: 'image' | 'text' | 'image_text'
    imageUrl?: string
    text?: I18n
    cta?: { label: I18n; url: string }
  }
  section: {
    kind: 'partners' | 'social' | 'custom' | 'none'
    partners?: { name: string; imageUrl: string; url: string }[]
    partnersTitle?: I18n
    social?: {
      title: I18n
      logoUrl: string
      logoBg: string
      instagram?: string
      x?: string
      facebook?: string
      linkedin?: string
      youtube?: string
    }
    customHtml?: string
  }
  embed?: { kind: 'survey_monkey' | 'form'; formId?: string; html?: string }
}

export const microsites = pgTable(
  'microsites',
  {
    id: id(),
    /** Public id used in URLs (`{p}`). */
    slug: text('slug').notNull(),
    name: i18n('name').notNull(),
    subtitle: i18n('subtitle').default({ en: '', ar: '' }).notNull(),
    templateId: text('template_id').default('standard').notNull(),
    logoUrl: text('logo_url').default('').notNull(),
    accentColor: text('accent_color').default('#EE3E43').notNull(),
    heroUrl: text('hero_url').default('').notNull(),
    subAdminId: uuid('sub_admin_id').references(() => users.id),
    signInMode: text('sign_in_mode').default('invite_only').notNull(),
    /** e.g. `dctabudhabi.ae`: open sign-up (and invite_only self-registration) needs a match. */
    emailDomainRule: text('email_domain_rule'),
    status: text('status').default('draft').notNull(),
    landingOnly: boolean('landing_only').default(false).notNull(),
    tabs: jsonb('tabs').$type<MicrositeTab[]>().default([]).notNull(),
    defaultFilter: text('default_filter'),
    mentoringEnabled: boolean('mentoring_enabled').default(false).notNull(),
    competitionEnabled: boolean('competition_enabled').default(false).notNull(),
    aiEnabled: boolean('ai_enabled').default(true).notNull(),
    notificationRecipients: jsonb('notification_recipients')
      .$type<string[]>()
      .default([])
      .notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('microsites_slug_uq').on(t.slug),
    index('microsites_sub_admin_idx').on(t.subAdminId),
  ],
)

export const landingTemplates = pgTable('landing_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  previewUrl: text('preview_url').default('').notNull(),
  sections: jsonb('sections').$type<string[]>().default([]).notNull(),
  ...timestamps(),
})

export const micrositeLandings = pgTable('microsite_landings', {
  micrositeId: uuid('microsite_id')
    .primaryKey()
    .references(() => microsites.id),
  draft: jsonb('draft').$type<LandingDoc>().notNull(),
  published: jsonb('published').$type<LandingDoc>(),
  publishedAt: tstz('published_at'),
  publishedById: uuid('published_by_id').references(() => users.id),
  ...timestamps(),
})

export const memberships = pgTable(
  'memberships',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    /** How the membership was granted: invitation · signup · rule · admin · import · seed */
    source: text('source').default('admin').notNull(),
    lastVisitedAt: tstz('last_visited_at'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('memberships_user_microsite_uq').on(t.userId, t.micrositeId),
    index('memberships_microsite_idx').on(t.micrositeId),
  ],
)

export const micrositeRequests = pgTable('microsite_requests', {
  id: id(),
  requestedById: uuid('requested_by_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  purpose: text('purpose').notNull(),
  status: text('status').default('requested').notNull(),
  note: text('note'),
  micrositeId: uuid('microsite_id').references(() => microsites.id),
  decidedById: uuid('decided_by_id').references(() => users.id),
  decidedAt: tstz('decided_at'),
  ...timestamps(),
})

/** Signed-in non-member asks for access (P07). One open request per user and microsite. */
export const accessRequests = pgTable(
  'access_requests',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    micrositeId: uuid('microsite_id')
      .notNull()
      .references(() => microsites.id),
    status: text('status').default('open').notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('access_requests_open_uq')
      .on(t.userId, t.micrositeId)
      .where(sql`${t.status} = 'open'`),
  ],
)

/** Landing-only microsites: register-interest form (P12). */
export const registerInterest = pgTable('register_interest', {
  id: id(),
  micrositeId: uuid('microsite_id')
    .notNull()
    .references(() => microsites.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message'),
  deletedAt: deletedAt(),
  ...timestamps(),
})

export type Microsite = typeof microsites.$inferSelect
