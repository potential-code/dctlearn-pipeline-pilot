import { db } from '@server/db/connection'
import { seedBase } from '@server/db/seed/fixtures'
import { sql } from 'drizzle-orm'
import { resetDb } from '../helpers/db'

/**
 * WORKAROUND (requested shared change): `courses_title_search_idx` in db/schema/catalog.ts is
 * invalid SQL (`"title"->>'en' || ' ' || "title"->>'ar'` parses as `(... || "title") ->> 'ar'`),
 * so drizzle-kit push stops there — exit code 0 — and every index after it is never created
 * (enrolment / membership uniques, job dedupe, this area's upsert targets). Joining two
 * microsites that share a course then enrols twice. Until catalog.ts is fixed, these tests
 * recreate the missing indexes on the emptied tables. `if not exists` makes it a no-op after.
 */
const STATEMENTS = [
  'create unique index if not exists "enrolments_user_course_uq" on "enrolments" ("user_id","course_id")',
  'create index if not exists "enrolments_course_idx" on "enrolments" ("course_id")',
  'create unique index if not exists "microsite_courses_uq" on "microsite_courses" ("microsite_id","course_id")',
  'create unique index if not exists "points_ledger_source_uq" on "learning_points_ledger" ("user_id","source_type","source_id")',
  'create unique index if not exists "invitations_token_hash_uq" on "invitations" ("token_hash")',
  'create unique index if not exists "sessions_token_uq" on "sessions" ("token")',
  'create unique index if not exists "users_email_uq" on "users" ("email")',
  'create unique index if not exists "csv_imports_token_uq" on "csv_imports" ("token_hash")',
  `create unique index if not exists "csv_imports_one_pending_uq" on "csv_imports" ("kind","scope") where "status" = 'pending'`,
  'create unique index if not exists "job_runs_dedupe_uq" on "job_runs" ("dedupe_key")',
  `create unique index if not exists "access_requests_open_uq" on "access_requests" ("user_id","microsite_id") where "status" = 'open'`,
  'create unique index if not exists "memberships_user_microsite_uq" on "memberships" ("user_id","microsite_id")',
  'create unique index if not exists "microsites_slug_uq" on "microsites" ("slug")',
  'create unique index if not exists "progress_exports_kind_date_uq" on "progress_exports" ("kind","for_date")',
  'create unique index if not exists "translation_status_field_uq" on "translation_status" ("entity","record_id","field")',
  'create unique index if not exists "page_sections_page_key_uq" on "page_sections" ("page","key")',
]

let applied = false

/** `freshBase()` with the missing unique indexes restored before seeding. */
export async function freshPlatformBase() {
  await resetDb()
  if (!applied) {
    for (const s of STATEMENTS) await db.execute(sql.raw(s))
    applied = true
  }
  return seedBase()
}
