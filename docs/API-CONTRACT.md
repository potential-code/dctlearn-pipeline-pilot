# DCT Learn — API Contract

**Status:** Draft v0.4 · **As of:** 2026-10-07 · Pairs with [`SPEC.md`](SPEC.md) v0.3 and [`SEED.md`](SEED.md).
Implemented by the backend on branch `backend`; the live, generated reference is `docs/openapi.json`
(Scalar UI at `/api/docs`).

The frontend shows nothing that is not in this file; the backend returns nothing that is not in this
file. To change a field, change this file first, then both sides.

## Changelog

### v0.4 (2026-10-07) — from the backend build
All additive; nothing in v0.3 was removed.

**Auth and sessions**
- Password reset path is Better Auth's `POST /api/auth/request-password-reset { email, redirectTo }`; `/forget-password` stays as an alias.
- Sign-in accepts `rememberMe: true` (opt-in; 30-day sessions; never for admin / sub admin).
- `/api/auth/*` errors carry both Better Auth's `{ code, message }` and the contract `{ error: { code, message } }`. Extra code: `invalid_credentials` (401). Lockout answers `429 rate_limited`.
- `POST /api/public/invitations/{token}/accept` → `201 { userId, defaultRoute }` + session cookie. An existing account must give its current password (422 otherwise). A learner may be upgraded to judge / mentor / sub_admin by accepting (audited); any other role change → 409.
- `POST /api/microsites/{p}/access-request` → `201 { id, status: "open"|"approved" }` (open microsite with matching e-mail rule joins at once).
- P12 `registerInterest` is `{ formId: "register-interest" }` (the form is the register-interest endpoint).

**Concurrency**
- Every ifMatch resource returns `updatedAt` (microsites P50, landing P35 dashboard, users P47, courses, rubrics).

**Data model decisions**
- `learning_points_ledger.course_id`: the microsite leaderboard and KPIs count only points earned in that microsite's courses.
- Content `{ en, ar }` stored as one jsonb column per field.

**New endpoints**
- Admin users: `POST /api/admin/users/{id}/anonymise` (§9.7, only after a delete request; audited).
- Data rights: `GET /api/me/export` → `202 { id, kind, status, requestedAt }`; `GET /api/me/exports/{id}` (own only); `POST /api/me/delete-request` → `202 { id, kind, status, requestedAt }`.
- Jobs screen (§9.3): `GET /api/admin/jobs?status=&name=` (no payloads), `GET /api/admin/jobs/schedules`, `POST /api/admin/jobs/{id}/retry` (dead/failed only, audited).
- Exports: `GET /api/admin/exports`, `GET /api/admin/exports/{id}` (nightly progress CSV, kept 30 days).
- `POST /api/admin/translations/machine` → `202 { queued }`.
- Competition: `POST .../admin/rounds/{id}/judging` and `.../close` (the §9.1 moves); rubric GET returns `updatedAt` and `locked`.
- Forms: `DELETE /api/admin/forms/{id}` (soft delete); admin events list accepts `?status=&q=`.
- Mentoring: admin mentor rows add `kind`, `courseIds`; `availabilitySummary = { timezone, rules[] }`; match suggestions capped at 5 and carry `source`.
- `POST /api/admin/uploads` → `200 { fileId, url }`; for a SCORM zip `fileId` is the package id used by `scorm` blocks.

**Behaviour clarified**
- Choosing a mentor sends an application; the match (and lock) exists only when the mentor accepts. Learners book only their matched mentor. Bookings from availability are confirmed at once (per-mentor `autoConfirm`).
- Join window for sessions: 10 min before start until the end; events: live from 15 min before start to 15 min after end. Learners see `zoomUrl`/`joinUrl` only while live and `recordingUrl` once published.
- Judges see submitted entries only; pending (invited) judges count as assigned, so a submission is `scored` when every assigned judge — including pending ones — has scored.
- Sub admins get 403 on learner-only actions (mentoring booking, competition submit) per the matrix; they may view hub and dashboard as learners.
- Unit completion repeated → `pointsAwarded: 0`; blocked completion → `409 locked`.
- Unknown certificate serial → 404.
- Profile `PUT` with no fields is a no-op (200).

**QA fixes (2026-10-07, high findings)**
- P16: each unit in the course view and the unit view now has `assessments: [ { id, title, type, status: locked|available|passed|failed } ]` so unit quizzes (e.g. C08) can be opened.
- External-certificate courses never complete by finishing units; only an approved upload completes them (unit points still count).
- `PUT /api/admin/microsites/{p}` is a partial update: fields left out keep their value; a live microsite can't drop its last enabled tab (409).
- Password reset (`/forget-password` or `/request-password-reset` with only `{ email }`) links to `APP_URL/reset-password?token=…`.
- `POST /api/webhooks/*` is exempt from the browser Origin check (HMAC instead).
- P60 lists block text per path (`html`, `items.0.text`, `questions.1.options.0.text`, …) as entity `block`; `PUT` writes that path's Arabic.

**Security review fixes (2026-10-07)**
- Only the Better Auth endpoints listed in §1 are reachable under `/api/auth/*`; others (e.g. `update-user`, `change-password`) answer 404 — profile, photo and password go through `/api/me/*`.
- File ids sent in bodies (mentor photo, landing images, resource images) must be the caller's own upload or a public brand asset (422 otherwise).
- Changing a microsite's sub admin revokes other pending sub-admin invitations; sub admins can only resend learner/judge invitations.
- A course-level final assessment answers `409 locked` until every unit is complete.
- `GET /api/mentors/{id}/slots` is always capped to 31 days.
- Anonymisation also clears form answers, access requests, register-interest rows, queued e-mails, uploaded photos, cached certificate PDFs and e-mails in audit labels.
- `POST /api/me/password` is rate-limited like sign-in; invitation accept for an existing account uses the sign-in lockout.
- Sub admins see `not_invitable` instead of reasons that reveal accounts elsewhere; archived microsites' admin pages are admin-only.
- Zoom webhooks older than 5 minutes are refused; request logs mask token-like path segments.

**Known gaps (parked)**
- Certificate / action-plan PDFs print Arabic as "?" until a licensed Arabic font is added (SPEC Q4).
- SCORM content is served with a looser CSP (`unsafe-inline`, `unsafe-eval`, framed by our origins) so packages run; before go-live serve SCORM from a separate cookieless origin.
- Zoom attendance is matched by display name until a signed user identity is added to the session token.
- Mentors see raw mentee registration answers; registration forms should not ask for phone/e-mail.
- Reset tokens are Better Auth's (stored as issued); field encryption for employee id / mobile is parked (SPEC §8).
- Zoom, AI matching / insights, voice-hiring provider and machine translation are stubs (503 `feature_off` / rule-based) until keys are provided.

### v0.3
First complete draft (spec v1).

---

## 0. Conventions

| Topic | Rule |
|---|---|
| Base URL | `/api` (same origin in production; `http://localhost:8000/api` in dev) |
| Auth | Better Auth cookie session. `GET /api/me` returns the signed-in user. 401 when signed out. |
| Roles | `learner` · `mentor` · `judge` · `sub_admin` · `admin`. One role per account. 403 when the role or microsite scope is wrong. |
| Microsite scope | `{p}` = microsite id (slug, lower-case). Learner routes require membership; sub-admin routes require `subAdminOf == p`. |
| IDs | UUID strings. Legacy WP ids kept as `legacyId` where migrated. |
| Dates | ISO 8601 UTC (`2026-10-06T09:00:00Z`). Date-only as `YYYY-MM-DD`. |
| i18n text | Client-facing content stored in both languages: `{ "en": "...", "ar": "..." }`. UI strings are not in the API. |
| Locale | `Accept-Language: en|ar` only affects server-generated text (e-mails, PDFs). |
| Pagination | `?page=1&pageSize=20` → `{ items: [...], page, pageSize, total }`. Default pageSize 20, max 100. |
| Sorting / filter | `?sort=field:asc|desc`, filters as named query params listed per endpoint. |
| Errors | `{ error: { code: "string", message: "human text", fields?: { name: "message" } } }` with 400/401/403/404/409/422. |
| Files | Upload = `multipart/form-data`; response gives `{ fileId, url }` (signed, short-lived). |
| Mutations | JSON body validated with Zod; same schema used by the form. |
| Rate limits | auth endpoints 10/min per IP; invitations, imports, uploads 30/min per user; public forms 5/min per IP; everything else 120/min per user. 429 with `Retry-After`. |
| Uploads | images ≤ 5 MB (png, jpg, webp); PDFs ≤ 10 MB; audio ≤ 50 MB (mp3, m4a); SCORM zip ≤ 200 MB; CSV ≤ 2 MB / 5,000 rows. |
| Enrolment | Joining a microsite enrols the learner in its courses (no enrol endpoint). Removing a membership keeps progress and certificates. |
| Completion | A course completes when every required unit is complete and any final blocking assessment is passed. External-certificate courses complete when the upload is **approved**. Completion issues the certificate and points once (idempotent). |
| Health | `GET /api/health` → `{ status: "ok", db: "ok", version }` (no auth). |

### 0.0 Field limits (shared by form and API)

| Field | Rule |
|---|---|
| name, first/last name | 1–80 chars |
| email | valid e-mail, ≤ 254, lower-cased |
| password | 10–128 chars, not in breached list (Better Auth) |
| title (any I18n title) | 1–160 chars per language |
| short text (subtitle, label) | ≤ 240 |
| rich text / markdown | ≤ 20,000 |
| action-plan answer | ≤ `charLimit` (default 500) |
| GROW field | ≤ 2,000 each |
| judge feedback / review note | ≤ 1,000 |
| URL | `https://` only (resources, embeds, recordings) |
| slug / microsite id | `^[a-z0-9-]{2,40}$` |

### 0.0.1 Error codes

| code | HTTP | When |
|---|---|---|
| `unauthenticated` | 401 | no session |
| `forbidden` | 403 | wrong role or not a member / not sub admin of `{p}` |
| `not_found` | 404 | entity, or microsite not live, or tab disabled |
| `validation_failed` | 422 | Zod errors in `fields` |
| `conflict` | 409 | duplicate (e.g. second open round, existing member, GROW log for same session) |
| `locked` | 409 | unit locked, assessment attempts used up, submission already submitted |
| `email_not_verified` | 403 | sign-in before verification |
| `account_disabled` | 403 | disabled user |
| `invitation_invalid` | 410 | expired, revoked or used token |
| `rate_limited` | 429 | |
| `feature_off` | 404 | mentoring / competition / AI off for the microsite, or AI provider disabled (503 for AI insights) |

### 0.1 Enums

| Enum | Values |
|---|---|
| `signInMode` | `open` · `invite_only` · `landing_only` |
| `micrositeStatus` | `requested` · `draft` · `live` · `archived` |
| `hubTab` | `courses` · `workshops` · `mentors` · `ai_coaches` · `ai_tools` · `resources` |
| `courseLevel` | `beginner` · `intermediate` · `advanced` |
| `cardState` | `not_started` · `in_progress` · `completed` · `coming_soon` |
| `blockType` | `text` · `image` · `video` · `youtube` · `youtube_playlist` · `scorm` · `audio` · `case_study` · `quotes` · `resources` · `related_courses` · `action_plan` · `survey` |
| `role` | `learner` · `mentor` · `judge` · `sub_admin` · `admin` |
| `formKind` | `survey` · `application` · `registration` |
| `externalCertStatus` | `pending` · `approved` · `rejected` |
| `menteeApplicationStatus` | `pending` · `accepted` · `declined` |
| `assessmentType` | `survey` · `quiz_blocking` · `quiz_non_blocking` |
| `questionType` | `multiple_choice` · `true_false` · `open_text` · `sorting` |
| `unitStatus` | `locked` · `available` · `completed` |
| `bookingStatus` | `requested` · `confirmed` · `completed` · `cancelled` · `no_show` |
| `invitationStatus` | `sent` · `accepted` · `revoked` · `expired` |
| `resourceStatus` | `pending` · `approved` · `rejected` |
| `roundStatus` | `draft` · `open` · `judging` · `closed` |
| `submissionStatus` | `not_started` · `in_progress` · `submitted` · `scored` |
| `aiEmbedKind` | `chat` · `iframe` · `voice` |
| `eventStatus` | `upcoming` · `live` · `past` · `cancelled` |

### 0.2 Shared shapes

```
User           { id, name, email, role, locale, imageUrl?, status: "active"|"disabled"|"invited" }
MicrositeRef   { id, name: I18n, accentColor, logoUrl, heroUrl }
I18n           { en: string, ar: string }
Money/none — no commerce.
CourseCard     { courseId, slug, title: I18n, imageUrl, categories: string[], level: courseLevel,
                 durationMin, isMandatory, isCertProgramme, state: cardState, progressPct, nextUnitId? }
MentorCard     { mentorId, name, title, photoUrl, categories: string[], microsites: string[],
                 rating?, sessionsCount, nextFreeSlot?, bookingEnabled }
Pagination     { items: T[], page, pageSize, total }
```

---

### 0.3 Access rules (apply to every endpoint)

Every endpoint block below has an **Auth:** line using these terms. The backend enforces them in
middleware **and** re-checks ownership in the service; the frontend hiding something is never enough.

**Auth terms**

| Term | Meaning (checked on the server) |
|---|---|
| `public` | no session needed |
| `public (token)` | no session; a valid, unexpired, single-use token is required |
| `signed-in` | any active, verified account |
| `member(p)` | signed-in **and** a membership of microsite `p` **and** `p` is `live` |
| `role(x)` | signed-in **and** `user.role == x` |
| `sub_admin(p)` | `role(sub_admin)` **and** `microsite.subAdminId == user.id` — or `role(admin)` |
| **own** | the record belongs to the signed-in user (`record.userId == user.id`); otherwise **404**, not 403, so ids cannot be probed |
| **assigned** | a row links the judge (or mentor) to that exact record |
| **Audit: yes** | a successful call writes `audit_log { actor, action, target, microsite, at, ip }` |
| **Sanitise** | rich text / HTML stripped to an allow-list on save; all output escaped |

**Permission matrix** (✓ allowed · own = own records only · p = own microsite only · — = 403/404)

| Area | Visitor | Learner | Mentor | Judge | Sub admin | Admin |
|---|---|---|---|---|---|---|
| Public pages, landings, FAQ, certificate check | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sign-in, registration (by mode), invitation accept | ✓ | — | — | — | — | — |
| Hub, dashboard, catalogue, player, achievements | — | p + own | — | — | p (view as learner) | ✓ |
| Profile, password, locale | — | own | own | own | own | own |
| Mentoring: browse, match, book, feedback | — | p + own | — | — | — | ✓ |
| Mentor dashboard, availability, GROW logs | — | read own GROW logs | own | — | — | counts only |
| AI coaches / tools | public or p | p | — | — | p | ✓ |
| Competition: submit, own status | — | p + own | — | — | — | ✓ |
| Judging: view and score submissions | — | — | — | assigned | read p | read |
| Microsite admin: landing, members, rounds, judges, resources | — | — | — | — | p | ✓ |
| Platform admin: microsites, users, catalog, events, forms, mentors, achievements, translations, AI embeds, audit | — | — | — | — | — | ✓ |

**Personal data each role may see**

| Field | Self | Mentor (own mentees) | Judge (assigned) | Sub admin (p) | Admin |
|---|---|---|---|---|---|
| name, photo | ✓ | ✓ | ✓ | ✓ | ✓ |
| e-mail | ✓ | — | — | ✓ | ✓ |
| phone, employee ID, hire date, sector | ✓ | — | — | — | ✓ |
| progress, certificates | ✓ | — | — | ✓ | ✓ |
| GROW log text | ✓ (mentee) | ✓ | — | — | — (counts only) |
| competition answers | ✓ | — | ✓ | ✓ | ✓ |
| voice-hiring applicant data | — | — | — | — | ✓ (export only) |

**Always**
- Role, status and memberships are read from the database on **every** request, so disabling a user, changing a role or removing a membership takes effect immediately.
- Fields a caller may not set (`role`, `status`, `userId`, `micrositeId`, `subAdminId`, `score` totals, `points`) are ignored if sent in a body; ids come from the session and the URL.
- Every list endpoint applies the same scope as its detail endpoint (no wider data in lists or CSV exports).
- Signed file URLs: 5-minute TTL, tied to the requesting user; access is re-checked when the URL is signed.
- Uploads: type checked by content (not extension), size limits in §0, stored outside the web root, never executed.
- CSRF, CORS (allow-listed origins), secure headers and body limits from `packages/core` on all mutating routes.
- Secrets (AI, voice, Zoom, e-mail keys) never appear in any response.
- Error messages never confirm whether another user's e-mail or record exists.

## 1. Visitor

### P01 Main home — `GET /api/public/home`
**Auth:** public · rate: public

```
hero          { title: I18n, subtitle: I18n, imageUrl }
microsites    [ MicrositeRef & { landingUrl, signInMode } ]       // live, not landing_only first
affiliates    [ { name, url, imageUrl, newTab: bool } ]           // VX Academy, Tourist Guide
featured      [ CourseCard (state omitted) ]                       // max 6
```

### P02 / P03 Employees, Students — `GET /api/public/pages/{professionals|students}`
**Auth:** public

```
sections [ { key, title: I18n, body: I18n (markdown), imageUrl?, cta?: { label: I18n, url } } ]
```

### P04 FAQ — `GET /api/public/faq`
**Auth:** public

```
items [ { id, question: I18n, answer: I18n (markdown), order } ]
```

### P12 Microsite landing — `GET /api/public/microsites/{p}/landing`
**Auth:** public (live microsites only) · register-interest: public, rate 5/min/IP, **Audit:** no · **Sanitise:** `message`

```
microsite   MicrositeRef & { signInMode, landingOnly }
hero        { heading: I18n, subheading: I18n, imageUrl, copyright? }
cta         { signedOut: { label: I18n, url }, signedIn: { label: I18n, url } }
popup?      { kind: "image"|"text"|"image_text", imageUrl?, text?: I18n, cta?: { label: I18n, url } }
section     { kind: "partners"|"social"|"custom"|"none",
              partners?: [ { name, imageUrl, url } ], partnersTitle?: I18n,
              social?: { title: I18n, logoUrl, logoBg, instagram?, x?, facebook?, linkedin?, youtube? },
              customHtml? }
embed?      { kind: "survey_monkey"|"form", formId?, html? }     // sanitised server-side
registerInterest?  { formId }                                     // landing_only microsites
```
404 if the microsite is not `live`. `POST /api/public/microsites/{p}/register-interest` `{ name, email, phone?, message? }` → 201.

### P06 Login — Better Auth routes
**Auth:** public · rate: auth 10/min/IP · lockout after 5 failed attempts (15 min) · disabled / unverified users refused

`POST /api/auth/sign-in/email { email, password }` → session · `POST /api/auth/sign-out` ·
`POST /api/auth/forget-password { email }` → always 200 (no account enumeration) ·
`POST /api/auth/reset-password { token, newPassword }`.
After sign-in the client calls `GET /api/me?from={p}` (`from` = the microsite whose login page was used, if any):
```
user        User
microsites  [ MicrositeRef & { role: "learner"|"sub_admin" } ]
mustSetPassword  bool                 // legacy accounts after migration
defaultRoute     string               // see the landing rule below
accessDenied?    { microsite: MicrositeRef, canJoin: bool }   // only when `from` is set and the user is not a member
```
**Landing rule for `defaultRoute`** (one set of accounts; a microsite login is the same login):
1. `role` is `mentor` / `judge` / `admin` → `/mentor` · `/judge` · `/admin` (sub admin → `/{their p}/admin`).
2. `from={p}` and the user is a member of `p` → `/{p}/dashboard` (the picker is skipped).
3. `from={p}` and not a member → `/{p}/login?denied=1` with `accessDenied` filled; the session stays valid.
4. no `from`: one membership → `/{p}/dashboard`; several → `/platforms`; none → `/platforms` (empty state).

### P07 Microsite login — `GET /api/public/microsites/{p}/login-config`
**Auth:** public · same Better Auth routes as P06 (same accounts, same rate limits and lockout) · sign-up only when `signInMode = open` and the e-mail matches `emailDomainRule`; membership granted server-side, never from the body

```
microsite  MicrositeRef · signInMode · allowSignUp: bool (signInMode == open) · emailDomainRule?: string
→ 404 for landing_only or non-live microsites (client redirects to /{p}/)
```
Sign-in on P07 = `POST /api/auth/sign-in/email` followed by `GET /api/me?from={p}`.
Sign-up when open: `POST /api/auth/sign-up/email { name, email, password, microsite: p }` → membership added server-side by rule, then the same landing rule.
`POST /api/microsites/{p}/access-request` → 201 (signed-in non-member asks for an invitation; notifies the sub admin; one open request per user and microsite, else 409).

### P08 Employee registration — `POST /api/public/register/employee`
**Auth:** public · rate: auth · domain checked server-side · role forced to `learner`, membership forced to `employees`

```
body  { fullName, email (must match allowed domains), password, level, timeAtDct: "lt6m"|"1to2y"|"gt2y" }
→ 201 { userId, verificationSent: true }     // membership "employees" granted by rule
```

### P09 / P10 Reset / set password
**Auth:** public (token) · tokens single-use, hashed at rest, 24 h TTL · all sessions of the user revoked after a reset

Covered by Better Auth above. `GET /api/public/password-token/{token}` → `{ valid: bool, email? , purpose: "reset"|"invite" }`.

### E-mail verification
**Auth:** public (token) · rate: auth

`GET /api/auth/verify-email?token=` (link in e-mail) → redirect to `/login?verified=1` ·
`POST /api/auth/send-verification-email { email }` → always 200.

### Certificate verification (public)
**Auth:** public · returns name, course, date only

`GET /api/public/certificates/{serial}` → `{ valid: bool, learnerName, courseTitle: I18n, issuedAt, issuer }` — no e-mail or other personal data.

### P11 Accept invitation
**Auth:** public (token) · token single-use, 14-day TTL, bound to the invited e-mail · role and microsite come from the invitation, never from the body · **Audit:** yes

```
GET  /api/public/invitations/{token}  → { valid, email, role, microsite?: MicrositeRef, invitedBy, expiresAt }
POST /api/public/invitations/{token}/accept  { name, password, locale } → 201 + session
```

---

## 2. Learner

### P13 Hub picker — `GET /api/me/microsites`
**Auth:** signed-in · **own** memberships only

```
items [ MicrositeRef & { subtitle: I18n, features: hubTab[], progressPct, lastVisitedAt? } ]
```

### P14 Dashboard — `GET /api/microsites/{p}/dashboard`
**Auth:** member(p) · **own** data only

```
microsite        MicrositeRef & { tabs: [ { key: hubTab, label: I18n } ] }
kpis             { inProgress, completed, certificates, points }
continueLearning [ CourseCard ]                                   // max 4, in_progress first
mandatory        [ CourseCard ]                                   // not completed mandatory courses
mentoring?       { enabled, registrationComplete, matchedMentor?: MentorCard, nextSession?: { bookingId, startsAt, joinUrl? } }
competition?     { enabled, roundId?, roundName?: I18n, status: submissionStatus, deadline? }
resources        [ { id, title: I18n, url, imageUrl? } ]        // max 4, approved only
events           [ { id, title: I18n, startsAt, status: eventStatus, joinUrl? } ]   // max 3
surveys          [ { formId, title: I18n, dueAt? } ]
tourSeen         bool
```
`POST /api/me/tour-seen` → 204.

### P52 Hub tabs — `GET /api/microsites/{p}/hub/{tab}`
**Auth:** member(p) · tab must be enabled · resources: `approved` only · mentors: only mentors linked to `p`

| tab | query | response |
|---|---|---|
| `courses` | `q`, `category`, `state` (`all|in_progress|completed`), `sort` | `{ categories: string[], defaultFilter?, items: Pagination<CourseCard> }` |
| `workshops` | `when` (`upcoming|past`) | `Pagination<{ id, title: I18n, category, venue?, startsAt, endsAt, status, zoomUrl?, recordingUrl?, imageUrl? }>` |
| `mentors` | `q`, `category`, `kind` (`mentor|trainer`) | `{ categories: string[], items: Pagination<MentorCard & { courseIds?: string[] }> }` |
| `ai_coaches` / `ai_tools` | — | `{ items: [ { key, name: I18n, description: I18n, iconUrl, kind: aiEmbedKind, url: "/ai/coach/{key}" } ] }` |
| `resources` | `type` (`link|pdf`) | `Pagination<{ id, title: I18n, type, url, imageUrl? }>` |
404 if the tab is off for this microsite.

### P16 Course & unit player
**Auth:** member(p) · course must be in `p`'s course list · progress / answers / SCORM / action plan: **own** only · locked units return `locked`

```
GET /api/microsites/{p}/courses/{slug}
  course    { id, slug, title: I18n, description: I18n, imageUrl, level, durationMin, categories,
              isMandatory, certificateEnabled, progressPct, state, enrolledAt }
  modules   [ { id, title: I18n, order, progressPct,
                units: [ { id, title: I18n, order, status: unitStatus, hasAssessment, durationMin? } ] } ]
  finalAssessment? { id, title: I18n, status: "locked"|"available"|"passed"|"failed" }
  certificate?     { id, serial, issuedAt, pdfUrl }

GET /api/microsites/{p}/units/{unitId}
  unit      { id, title: I18n, order, moduleId, status, prevUnitId?, nextUnitId? }
  blocks    [ { id, type: blockType, order, required: bool, completed: bool, payload } ]
  completion { canComplete: bool, reason?: "blocks_incomplete"|"assessment_required" }

block payload by type:
  text            { html: I18n }
  image           { url, caption?: I18n, alt: I18n }
  video / youtube { videoId|url, title?: I18n, resumeAtSec? }
  youtube_playlist{ items: [ { videoId, title } ] }
  scorm           { launchUrl, version }
  audio           { url, title: I18n, transcript?: I18n }
  case_study      { html: I18n }
  quotes          { items: [ { text: I18n, author? } ] }
  resources       { items: [ { title: I18n, url, type: "pdf"|"link"|"template" } ] }
  action_plan     { title: I18n, questions: [ { no: 1..5, text: I18n, charLimit } ],
                    answers: { [no]: string }, pdfUrl? }
  survey          { questions: [ { id, text: I18n, type: questionType, options?: [ { id, text: I18n } ] } ], answers? }
  related_courses { items: [ CourseCard ] }          // same category/tags, max 4, from this microsite's catalogue

POST /api/units/{unitId}/blocks/{blockId}/progress   { completed: true, positionSec? }        → 204
PUT  /api/units/{unitId}/blocks/{blockId}/action-plan { answers: { [no]: string } }             → 200 { pdfUrl }   // autosave; 409 locked after competition submit
GET  /api/units/{unitId}/blocks/{blockId}/action-plan.pdf                                         // generated on demand
PUT  /api/units/{unitId}/blocks/{blockId}/survey      { answers: [ { questionId, optionIds?, text?, order? } ] } → 200 { completed: true }
GET  /api/units/{unitId}/blocks/{blockId}/scorm       { launchUrl, version: "1.2"|"2004", state?: { cmi } }
PUT  /api/units/{unitId}/blocks/{blockId}/scorm       { cmi: { completionStatus, successStatus?, scoreRaw?, location?, suspendData? } } → 204
                                                      // block completes when completionStatus = completed|passed
POST /api/units/{unitId}/complete                                                               → 200 { unitStatus, courseProgressPct, nextUnitId?, pointsAwarded, certificate? }
```

### Assessments (inside P16)
**Auth:** member(p) · **own** attempts only · answer keys never returned before pass or attempts used up · scoring on the server only

```
GET  /api/assessments/{id}            { id, title: I18n, type: assessmentType, passMark, attemptsAllowed, attemptsUsed,
                                        timeLimitMin?, questions: [ { id, text: I18n, type, options?: [ { id, text: I18n } ] } ] }
POST /api/assessments/{id}/attempts   { answers: [ { questionId, optionIds?: [], text?, order?: [] } ] }
                                      → { attemptId, scorePct, passed, showAnswers: bool, correct?: { [questionId]: optionIds|text } }
```
Answer keys never appear in GET responses.

### P51 Achievements — `GET /api/microsites/{p}/achievements`
**Auth:** member(p) · **own** ledger/certificates · leaderboard shows name + points only (no e-mail) · external-certificate upload: own, type/size checked, **Audit:** yes

```
points        { total, thisMonth }
ledger        [ { at, points, reason: I18n, courseTitle?: I18n } ]        // last 20
badges        [ { key, name: I18n, description: I18n, imageUrl, earnedAt? } ]
certificates  [ { id, courseTitle: I18n, serial, issuedAt, pdfUrl, shareUrl } ]
externalCertificates? [ { id, courseId, courseTitle: I18n, fileUrl, uploadedAt, status } ]   // Nibras only
leaderboard   { me: { rank, points }, top: [ { rank, name, points, isMe } ] }           // top 10, per microsite
```
`POST /api/microsites/{p}/external-certificates` multipart `{ courseId, file }` → 201 · `DELETE .../{id}` → 204.

### P15 Profile
**Auth:** signed-in · **own** profile only · `employeeId`, `sector`, `hireDate`, `role`, `status`, memberships are read-only (changes ignored) · password change needs current password and revokes other sessions

```
GET /api/me/profile
  user      User
  profile   { firstName, lastName, country, position, department, employmentType, seniorityLevel,
              preferredLanguage: "en"|"ar", linkedinUrl, mobile }
  readOnly  { employeeId?, sector?, hireDate? }                 // imported, not editable
  microsites [ MicrositeRef ]
PUT  /api/me/profile   { the editable fields }                → 200
POST /api/me/photo     multipart { file }                      → 200 { imageUrl }
POST /api/me/password  { currentPassword, newPassword }        → 204
PUT  /api/me/locale    { locale: "en"|"ar" }                   → 204   // also set from the top-bar language toggle

### Forms for learners (mentee registration, dashboard surveys, applications)
**Auth:** signed-in · form must be published for one of the user's microsites · **own** entries only · **Sanitise:** text answers

```
GET  /api/forms/{formId}            { id, title: I18n, kind: formKind, fields: [ { key, label: I18n, type: "text"|"textarea"|"select"|"multiselect"|"radio"|"checkbox"|"date"|"number"|"file", required, options?: [ { value, label: I18n } ], maxLength? } ], myEntry?: { submittedAt, answers } }
POST /api/forms/{formId}/entries    { answers: { [key]: value } } → 201   // 409 if the form allows one entry and it exists
```
```

### P17–P22 Mentoring (requires `mentoring.enabled` on the microsite)
**Auth:** member(p) with mentoring on · bookings, feedback, session token: **own** bookings only (mentee or its mentor) · mentor profile shows no e-mail/phone · session token only inside the join window

```
GET  /api/microsites/{p}/mentors                       → P52 mentors tab shape
GET  /api/mentors/{mentorId}                           { MentorCard, bio: I18n, linkedinUrl, courses: [ CourseCard ], availabilitySummary }
GET  /api/microsites/{p}/mentoring/registration        { formId, complete: bool, answers? }
POST /api/microsites/{p}/mentoring/registration        { answers: { [fieldKey]: value } }   → 200 { complete: true }
POST /api/microsites/{p}/mentoring/match               {}  → { suggestions: [ MentorCard & { matchScore, reasons: I18n[] } ] }   // AI or rule-based
POST /api/microsites/{p}/mentoring/match/choose        { mentorId } → 200 { matchedMentor }
GET  /api/mentors/{mentorId}/slots?from=&to=           { slots: [ { startsAt, endsAt } ] }    // 60-min slots
POST /api/bookings                                     { mentorId, startsAt, topic? } → 201 { bookingId, status }
GET  /api/me/bookings?status=                          Pagination<{ id, mentor: MentorCard, startsAt, endsAt, status, joinUrl?, feedbackGiven }>
POST /api/bookings/{id}/cancel                         { reason? } → 200
GET  /api/bookings/{id}/session                        { status, joinUrl?, startsAt, canJoinFrom, lobbyState: "early"|"ready"|"waiting"|"closed"|"cancelled" }
POST /api/bookings/{id}/session/token                  → 200 { sdkKey, signature, sessionName, userName, expiresAt }   // Zoom Video SDK; 503 feature_off when Zoom not configured
POST /api/bookings/{id}/feedback                       { rating: 1..5, comment?, attendance: "attended"|"mentor_absent"|"i_missed" } → 201
```
Match: AI ranking when the provider is on; otherwise rule-based score (category overlap 60 %, language 30 %, availability 10 %). Response shape is the same either way; `source: "ai"|"rules"`.
Webhook (server only): `POST /api/webhooks/zoom` — HMAC-verified; updates session attendance.

### P23–P27 AI tools
**Auth:** member(p) when `requiresLogin`, else public · voice-hiring intake: public, rate 5/min/IP, `consent: true` required, provider key never returned · **Audit:** no (PII not logged)

```
GET /api/microsites/{p}/ai                 { coaches: [ AiEmbed ], tools: [ AiEmbed ] }
GET /api/ai/embeds/{key}                   AiEmbed = { key, name: I18n, description: I18n, iconUrl, kind, providerId, color, requiresLogin, scriptUrl?, iframeUrl? }
POST /api/ai/embeds/{key}/session          → 200 { token, expiresAt }      // signed short-lived token for embeds that need the signed-in user; carries user id + locale only
POST /api/ai/voice-hiring/intake           { firstName, lastName, email, phone, university, major, graduationYear,
                                             alAinResident: bool, familyBook: bool, availability, noticePeriod, yearsExperience, consent: true }
                                           → 201 { sessionToken }      // server calls provider; key never leaves server
```

### P28 / P29 Competition
**Auth:** member(p) with competition on · **own** submission only · submit is one-way (409 after) · score/rank shown only after the round is `closed`

```
GET  /api/microsites/{p}/competition           { round: { id, name: I18n, status, opensAt, closesAt, description: I18n },
                                                 submission: { status, courseId, courseSlug, submittedAt? }, eligible: bool, eligibilityRule: I18n }
POST /api/microsites/{p}/competition/submit    {} → 200 { status: "submitted" }       // locks the action plan
GET  /api/microsites/{p}/competition/dashboard { points, unitsCompleted, unitsTotal, countdown: { closesAt }, status, score?: { total, outOf: 100 }, rank? }
```

---

## 3. Mentor

### P30 Mentor dashboard — `GET /api/mentor/dashboard`
**Auth:** role(mentor) · **own** mentees, bookings, applications only · mentee data limited to name, microsite, sessions (no e-mail, phone, employee ID) · GROW log: own bookings only, immutable, **Sanitise:** text

```
me          { MentorCard, microsites: [ MicrositeRef ] }
kpis        { mentees, upcoming, completedSessions, pendingLogs }
mentees     [ { userId, name, microsite: MicrositeRef, matchedAt, sessionsDone, lastSessionAt?, logsPending } ]
upcoming    [ { bookingId, mentee: { userId, name }, startsAt, endsAt, joinUrl? } ]
past        [ { bookingId, mentee, startsAt, status, feedback?: { rating }, growLogId? } ]
applications [ { id, mentee, submittedAt, answers } ]              // mentee registrations awaiting the mentor
```
```
GET  /api/mentor/grow-logs?menteeId=                 Pagination<{ id, bookingId, menteeName, sessionNo, sessionDate, goal, reality, options, wayForward, createdAt }>
POST /api/mentor/grow-logs                           { bookingId, sessionNo, sessionDate, goal, reality, options, wayForward } → 201   // immutable
GET  /api/mentor/profile · PUT /api/mentor/profile   { title, bio: I18n, categories, linkedinUrl, photo }
POST /api/mentor/applications/{id}/accept            → 200 { matchId }
POST /api/mentor/applications/{id}/decline           { reason? } → 200
POST /api/bookings/{id}/mentor-feedback              { rating: 1..5, attendance: "attended"|"no_show", note? } → 201
```
GROW logs are readable by the mentor who wrote them and by that mentee (`GET /api/me/grow-logs` → same shape, read-only). Admins see counts only.

### P31 Availability
**Auth:** role(mentor) · **own** availability and bookings only

```
GET  /api/mentor/availability           { rules: [ { id, weekday: 0..6, startTime, endTime, timezone } ], timeOff: [ { from, to } ], slotMinutes: 60 }
PUT  /api/mentor/availability           { rules, timeOff, timezone } → 200
GET  /api/mentor/bookings?from=&to=     [ { bookingId, mentee, startsAt, status } ]
POST /api/bookings/{id}/confirm | /cancel | /no-show   → 200
```

---

## 4. Judge

### P33 Judge dashboard — `GET /api/judge/dashboard`
**Auth:** role(judge) · rounds where the judge has assignments only

```
kpis     { assigned, graded, pending }
rounds   [ { roundId, microsite: MicrositeRef, name: I18n, status, deadline, assigned, graded } ]
```

### P34 Applicants & grading
**Auth:** role(judge) · **assigned** submissions only (checked per submission **and** round) · applicant shown by name + microsite only · scoring only while round is `judging` · **Sanitise:** feedback

```
GET  /api/judge/rounds/{roundId}/applicants?status=   Pagination<{ submissionId, applicant: { name, microsite }, submittedAt, status: "pending"|"graded", myScore?: number }>
GET  /api/judge/submissions/{id}                      { applicant, pitch: { pdfUrl, answers: [ { question: I18n, answer } ] },
                                                        rubric: [ { criterionId, question: I18n, weightPct } ], myScores?: [ { criterionId, score: 1..10, feedback? } ] }
PUT  /api/judge/submissions/{id}/scores               { scores: [ { criterionId, score: 1..10, feedback? } ] }
                                                      → 200 { weightedTotal: number (0..100) }
```
Weighted total = Σ(score/10 × weightPct). Weights per round sum to 100 (validated on P43).

---

## 5. Sub admin (`/api/microsites/{p}/admin/...`, role `sub_admin` of `p` or `admin`)

### P35 Dashboard
**Auth:** sub_admin(p) or admin · **Sanitise:** landing `customHtml`, `embed.html`, popup text (allow-list) · publish: **Audit:** yes

```
GET  .../admin/dashboard     { microsite: MicrositeRef & { status, signInMode, landingOnly },
                               kpis: { members, active30d, completions, certificates, pendingInvites, pendingResources },
                               landing: <P12 editable shape>, publishedAt?, hasUnpublishedChanges }
PUT  .../admin/landing       { hero, cta, popup?, section, embed? } → 200 (draft)
POST .../admin/landing/publish → 200 { publishedAt }
```

### P40 Members & invites
**Auth:** sub_admin(p) or admin · sees name, e-mail, status, progress — not employee ID, phone or profile details · invite role limited to `learner`/`judge` · invite, CSV import, revoke, remove: **Audit:** yes

```
GET  .../admin/members?q=&status=      Pagination<{ userId, name, email, status, joinedAt, progressPct, lastSignInAt? }>
POST .../admin/invitations             { emails: string[], role: "learner"|"judge", message? } → 201 { created, skipped: [ { email, reason } ] }
POST .../admin/invitations/csv         multipart { file } → 200 { preview: [ { row, email, name?, valid, reason? } ], token }
POST .../admin/invitations/csv/confirm { token } → 201 { created, skipped }
GET  .../admin/invitations?status=     Pagination<{ id, email, role, status, sentAt, expiresAt }>
POST .../admin/invitations/{id}/resend | /revoke → 200
DELETE .../admin/members/{userId}      → 204   // removes membership only
```

### P41 Rounds · P43 Rubrics · P42 Judges · P44 Scores
**Auth:** sub_admin(p) or admin · rubric locked once scoring starts · assignments only to judges invited to `p` · score CSV: **Audit:** yes

```
GET/POST .../admin/rounds                 { id, name: I18n, description: I18n, status, opensAt, closesAt, courseId, eligibilityMinProgressPct (default 80) }
PUT  .../admin/rounds/{id} · POST .../admin/rounds/{id}/activate     // one open round per microsite (409 otherwise)
GET/PUT .../admin/rounds/{id}/rubric      { criteria: [ { id?, question: I18n, weightPct, order } ] }   // 422 unless Σ = 100
GET  .../admin/judges                     Pagination<{ userId?, invitationId?, name?, email, status, assigned, graded }>
POST .../admin/judges/invite              { emails: string[] } → 201
PUT  .../admin/rounds/{id}/assignments    { assignments: [ { submissionId, judgeUserIds: string[] } ] } → 200
POST .../admin/rounds/{id}/assignments/auto { judgesPerSubmission: 3 } → 200
GET  .../admin/rounds/{id}/scores         { aggregation: "mean"|"median", rows: [ { submissionId, applicant, judges: [ { judgeName, total, perCriterion: [ { criterionId, score } ] } ], finalScore, rank } ] }
GET  .../admin/rounds/{id}/scores.csv
```

### P53 Resources
**Auth:** sub_admin(p) or admin · `https` only · edits reset to `pending` · **Audit:** yes

```
GET  .../admin/resources               Pagination<{ id, title: I18n, url, type, status, reviewNote?, submittedAt }>
POST .../admin/resources               { title: I18n, url (https only) | file, imageUrl? } → 201 (status pending)
PUT  .../admin/resources/{id}          → resets to pending
DELETE .../admin/resources/{id}
```

---

## 6. DCT Learn admin (`/api/admin/...`, role `admin`)

### P45 Dashboard · P55 Reports
**Auth:** role(admin) · AI insights sends aggregates only · progress CSV: **Audit:** yes

```
GET /api/admin/dashboard?range=7d|30d|90d|12m&microsite=      { kpis: { totalUsers, newUsers, activeUsers, completions, certificates, growthPct },
                                                                series: { signups: [ { bucket, value } ], completions: [...] },
                                                                byMicrosite: [ { microsite: MicrositeRef, members, active, completions } ],
                                                                byRole: [ { role, count } ], recentSignups: [ User & { joinedAt, lastSignInAt? } ] }
GET /api/admin/microsites/{p}/report?range=                   { same shape scoped to one microsite, topCourses: [ { courseId, title, started, completed } ] }
POST /api/admin/insights/ask                                  { question } → { answer, dataUsed: string[] }   // aggregates only; 503 when AI off
GET /api/admin/exports/progress.csv?microsite=&from=&to=      // user, course, progress %, completed at
```

### P50 Microsites · P36 Create · P37 Landing templates
**Auth:** role(admin) · create / edit / status change: **Audit:** yes

```
GET  /api/admin/microsites                     [ MicrositeRef & { status, signInMode, landingOnly, subAdmin?: User, members, courses, createdAt } ]
POST /api/admin/microsites                     { id (slug), name: I18n, templateId, branding: { logo, accentColor, hero }, subAdminEmail?,
                                                 signInMode, landingOnly, courseIds, mandatoryCourseIds, tabs: [ { key, enabled, label: I18n } ],
                                                 mentoringEnabled, competitionEnabled } → 201
PUT  /api/admin/microsites/{p}                 same fields (edit sheet)
POST /api/admin/microsites/{p}/status          { status } → 200
GET  /api/admin/landing-templates              [ { id, name, previewUrl, sections: string[] } ]
GET  /api/admin/microsite-requests             [ { id, requestedBy: User, name, purpose, status, requestedAt } ]
POST /api/microsite-requests                   { name, purpose } → 201          // sub admin or admin
POST /api/admin/microsite-requests/{id}/approve → 201 { micrositeId }          // creates a draft microsite
POST /api/admin/microsite-requests/{id}/reject  { note } → 200
```

### P47 Users & roles
**Auth:** role(admin) · full profile visible · role, status, membership changes and imports: **Audit:** yes · disabling a user or removing a membership revokes access on the next request · admin cannot remove their own admin role

```
GET  /api/admin/users?q=&role=&microsite=&status=   Pagination<User & { microsites: string[], joinedAt, lastSignInAt?, legacyId? }>
GET  /api/admin/users/{id}                          User & profile & { microsites, points, certificates: [...], externalCertificates: [...], growLogsSummary?, auditTrail: [ { at, actor, action } ] }
PUT  /api/admin/users/{id}                          { name, role, status, microsites: string[], profile: {...} }
POST /api/admin/users/{id}/reset-password           → 204 (sends set-password e-mail)
POST /api/admin/users/import                        multipart { file } → { preview: [ { row, email, name, microsites, action: "create"|"update"|"skip", reason? } ], token }
POST /api/admin/users/import/confirm                { token, sendWelcome: bool } → 201 { created, updated, skipped }
GET  /api/admin/users/import/sample.csv
```
CSV columns: `email, first_name, last_name, employee_id?, position?, sector?, department?, hire_date?, microsites (semicolon list), role?`

### P46 Catalog · P59 Course editor
**Auth:** role(admin) · **Sanitise:** all rich-text block payloads · SCORM zip unpacked in isolation, path-traversal checked · publish/archive: **Audit:** yes

```
GET  /api/admin/courses?q=&status=&microsite=    Pagination<{ id, slug, title: I18n, status: "draft"|"published"|"archived", level, units, enrolled, completed, updatedAt, microsites: string[] }>
POST /api/admin/courses                           { title: I18n, slug?, description: I18n, level, durationMin, categories, imageUrl, certificateEnabled, sequential: bool }
GET  /api/admin/courses/{id}                      full tree: course, modules[ units[ blocks[] ] ], assessments[], card, certificateSettings
PUT  /api/admin/courses/{id} · POST .../publish · POST .../archive
POST /api/admin/courses/{id}/modules · PUT/DELETE .../modules/{mid} · PUT .../modules/reorder { ids }
POST .../modules/{mid}/units · PUT/DELETE .../units/{uid} · PUT .../units/reorder
POST .../units/{uid}/blocks { type, payload, required } · PUT/DELETE .../blocks/{bid} · PUT .../blocks/reorder
POST /api/admin/courses/{id}/assessments { title: I18n, type, passMark, attemptsAllowed, timeLimitMin?, shuffle, isFinal, moduleId? }
PUT  .../assessments/{aid} · questions CRUD { text: I18n, type, options: [ { text: I18n, correct } ], points }
PUT  /api/admin/courses/{id}/card                 { imageUrl, categories, level, durationMin, comingSoon, isCertProgramme, overview: I18n }
PUT  /api/admin/courses/{id}/certificate          { backgroundUrl, logoUrl, signatureName, signatureTitle, signatureImageUrl? }
POST /api/admin/uploads                           multipart → { fileId, url }      // images, PDFs, SCORM zip (unpacked server-side → launchUrl), audio
```

### P57 Events & workshops
**Auth:** role(admin) · `https` only for links · **Audit:** create/cancel

```
GET/POST /api/admin/events        { id, title: I18n, description: I18n, category, venue?, startsAt, endsAt, timezone, zoomUrl?, recordingUrl?, imageUrl?,
                                    status, audiences: [ { micrositeId } ] }
PUT/DELETE /api/admin/events/{id} · POST .../cancel { reason } · PUT .../recording { url, publish: bool }
GET /api/admin/events/{id}/participants   Pagination<User & { microsite }>
```

### P56 Surveys & applications
**Auth:** role(admin) · entries CSV: **Audit:** yes

```
GET/POST /api/admin/forms        { id, title: I18n, kind: "survey"|"application"|"registration", microsites: string[], fields: [ { key, label: I18n, type, required, options? } ], status }
PUT /api/admin/forms/{id} · GET /api/admin/forms/{id}/entries Pagination<{ id, user?, submittedAt, answers }> · GET .../entries.csv
```

### P54 Resource verification
**Auth:** role(admin) · approve/reject: **Audit:** yes

```
GET  /api/admin/resources?status=pending     Pagination<{ id, microsite: MicrositeRef, title: I18n, url, submittedBy: User, submittedAt }>
POST /api/admin/resources/{id}/approve       → 200
POST /api/admin/resources/{id}/reject        { note } → 200
```

### P48 Mentor pool
**Auth:** role(admin) · invite/edit: **Audit:** yes

```
GET  /api/admin/mentors?q=&microsite=&status=   Pagination<MentorCard & { email, status, mentees, sessions, microsites }>
POST /api/admin/mentors/invite                  { emails: string[], microsites: string[], categories?: string[] } → 201
PUT  /api/admin/mentors/{id}                    { microsites, categories, courseIds, bookingEnabled, kind: "mentor"|"trainer", status }
GET  /api/admin/mentors/{id}/mentees            [ { user, microsite, matchedAt, sessions, lastLogAt? } ]
```

### P61 AI embeds
**Auth:** role(admin) · `https` script/iframe URLs from an allow-listed host only · **Audit:** yes

```
GET/POST/PUT/DELETE /api/admin/ai-embeds   { key, name: I18n, description: I18n, iconUrl, kind, providerId, color, scriptUrl?, iframeUrl?, microsites: string[], requiresLogin }
```

### P58 Achievements administration
**Auth:** role(admin) · manual points/badges and certificate decisions: **Audit:** yes

```
GET  /api/admin/badges · POST · PUT /{key} · DELETE /{key}      { key, name: I18n, description: I18n, imageUrl, rule: "courses_completed"|"points_total"|"streak_days"|"manual", threshold? }
POST /api/admin/badges/{key}/award           { userId } → 201          // manual badges only
GET  /api/admin/points?userId=&microsite=&source=   Pagination<{ at, user: User, points, source: "unit"|"module"|"course"|"assessment"|"manual", courseTitle? }>
POST /api/admin/points/adjust                { userId, points (±), reason } → 201
PUT  /api/admin/courses/{id}/points          { unit, module, course, assessmentPass } → 200     // defaults 10 / 0 / 50 / 20
GET  /api/admin/external-certificates?status=pending   Pagination<{ id, user: User, microsite, course: { id, title: I18n }, fileUrl, uploadedAt, status }>
POST /api/admin/external-certificates/{id}/approve     → 200          // completes the course
POST /api/admin/external-certificates/{id}/reject      { note } → 200
```

### P60 Translations
**Auth:** role(admin) · **Sanitise:** translated rich text

```
GET  /api/admin/translations?entity=course|unit|block|page|faq|microsite&missing=ar   Pagination<{ entity, id, field, en, ar, status: "missing"|"machine"|"reviewed" }>
PUT  /api/admin/translations                 { entity, id, field, ar } → 200 (status reviewed)
POST /api/admin/translations/machine         { entity, ids } → 202        // queued; off when no translation provider
```

### Audit log
**Auth:** role(admin) · read-only; entries cannot be edited or deleted through the API

```
GET /api/admin/audit?actor=&action=&from=&to=   Pagination<{ at, actor: User, action, target: { type, id, label }, microsite? }>
```

---

## 7. Sub-admin microsite request
Sub admins can request a new microsite from P35 (`POST /api/microsite-requests`); admins decide on P50.

## 8. Notifications (server → e-mail, no API)

| Event | To | Template |
|---|---|---|
| Invitation created / resent | invitee | `invitation` (P11 link, expiry) |
| Set-password / reset requested | user | `set-password` |
| Course completed | learner | `course-complete` (+ certificate link) |
| Booking requested / confirmed / cancelled | both | `booking-*` |
| Session reminder (24 h, 1 h) | both | `session-reminder` |
| GROW log added | mentee | `grow-log` |
| Judge invited / round deadline | judge | `judge-*` |
| Resource approved / rejected | sub admin | `resource-*` |
| New microsite request / resource pending / external certificate uploaded | admin | `admin-*` |
| E-mail verification | new user | `verify-email` |
| Mentee application received / accepted / declined | mentor / mentee | `mentee-application-*` |
| External certificate approved / rejected | learner | `external-cert-*` |
| Register interest received | microsite sub admin (or admin) | `register-interest` |
| Access request from a signed-in non-member | microsite sub admin (or admin) | `access-request` |
| Microsite request approved / rejected | requester | `microsite-request-*` |

Sender: configurable (`MAIL_FROM`, default `DCTLEARN@dctabudhabi.ae`). Recipients lists configurable per microsite.

---

## 9. Backend behaviour

Rules the backend must implement beyond request/response shapes. Each is tested.

### 9.1 Status changes (state machines)

Only the moves listed are allowed; anything else returns `409 conflict`. Every move marked **A** writes an audit entry.

| Entity | From → To | Who / trigger |
|---|---|---|
| Microsite | `requested → draft` | admin approves request **A** |
| | `draft → live` | admin **A** (needs landing published + ≥ 1 tab or `landingOnly`) |
| | `live → archived`, `archived → live` | admin **A** |
| Landing | `draft → published` | sub admin(p) / admin **A**; edits create a new draft, published version stays live |
| Invitation | `sent → accepted` | invitee (token) |
| | `sent → revoked` | inviter or admin **A** |
| | `sent → expired` | job (expiry passed) |
| | `revoked/expired → sent` | resend creates a **new** token (old one stays invalid) |
| User | `invited → active` | accepts invitation / verifies e-mail |
| | `active ↔ disabled` | admin **A** |
| Course | `draft → published` | admin **A** (needs ≥ 1 published unit with content) |
| | `published → archived` | admin **A** (learners keep progress and certificates) |
| Resource | `pending → approved / rejected` | admin **A** |
| | `rejected → pending` | sub admin edits and resubmits |
| | `approved → pending` | sub admin edits |
| External certificate | `pending → approved / rejected` | admin **A** (approve completes the course) |
| | `rejected → pending` | learner uploads a new file |
| Mentee application | `pending → accepted / declined` | mentor |
| Booking | `requested → confirmed` | mentor (or auto-confirm if slot from availability) |
| | `requested/confirmed → cancelled` | mentee or mentor, up to 2 h before start |
| | `confirmed → completed / no_show` | mentor feedback, or job 2 h after end (→ `completed` if both joined per Zoom webhook) |
| Round | `draft → open` | sub admin(p) **A** (rubric must total 100; only one open round per microsite) |
| | `open → judging` | job at `closesAt`, or sub admin **A** |
| | `judging → closed` | sub admin **A** (scores and ranks become visible to learners) |
| Submission | `not_started → in_progress` | first action-plan save |
| | `in_progress → submitted` | learner (eligibility checked) — one-way |
| | `submitted → scored` | all assigned judges scored |
| Event | `upcoming → live → past` | computed from time (join window ± grace) |
| | `upcoming → cancelled` | admin **A** |

### 9.2 Database rules

| Rule | Where |
|---|---|
| Unique | `users.email` · `memberships(user_id, microsite_id)` · `microsite_courses(microsite_id, course_id)` · `enrolments(user_id, course_id)` · `course_certificates(enrolment_id)` and `serial` · `learning_points_ledger(user_id, source_type, source_id)` · `badge_awards(user_id, badge_key)` · `grow_logs(booking_id)` · `scores(judge_id, submission_id, criterion_id)` · `invitations(token_hash)` · one open round per microsite (partial unique index) · `mentor_bookings(mentor_id, starts_at)` where status not cancelled |
| Indexes | every foreign key · `memberships(microsite_id)` · `progress(user_id, course_id)` · `bookings(mentor_id, starts_at)` · `audit_log(at)`, `audit_log(actor_id)` · `invitations(email, status)` · text search on course title and user name/e-mail |
| Delete behaviour | **Users:** never hard-deleted by the app; disabled, or anonymised on a data-deletion request (§9.7). **Microsites:** archived, not deleted. **Courses:** archived; hard delete only when no enrolments. **Memberships:** deleted (progress kept). **Resources, events, forms, AI embeds, badges:** soft delete (`deleted_at`). **Audit log:** append-only. |
| Foreign keys | `ON DELETE RESTRICT` by default; `CASCADE` only for child rows owned by a parent draft (e.g. draft course → modules → units → blocks). |
| Timestamps | every table has `created_at`, `updated_at` (UTC). |

### 9.3 Background jobs (jobs-reminders template)

| Job | Schedule | Retry | Notes |
|---|---|---|---|
| Send e-mail | queued on event | 5 attempts, exponential backoff | dead-letter after 5; visible in admin jobs screen |
| Session reminders | 24 h and 1 h before each confirmed booking | 3 | |
| Invitation expiry | hourly | — | `sent → expired` |
| Booking auto-complete | every 15 min | — | §9.1 |
| Round close | every 5 min | — | `open → judging` at `closesAt` |
| Certificate PDF | on course completion | 3 | idempotent per enrolment |
| Action-plan PDF | on request, cached until answers change | 3 | |
| SCORM unpack | on upload | 1 | validates manifest; rejects path traversal |
| Machine translation | every 1 min, batch 20 | 3 per item | only when provider configured |
| Microsite report cache | every 15 min | — | analytics template report cache |
| Nightly progress export | 02:00 Gulf time | 3 | stored for 30 days, admin download |
| Cleanup | daily | — | expired tokens, orphan uploads > 24 h, signed-URL cache |

### 9.4 Concurrency

| Case | Rule |
|---|---|
| Two learners book the same slot | unique index on `(mentor_id, starts_at)` for active bookings; second gets `409 conflict` "slot just taken" |
| Double-click *Mark complete* / double submit | idempotent: same result, points and certificate awarded once (unique keys §9.2) |
| Two judges score the same submission | independent rows per judge; final score computed on read |
| Two admins edit the same record | `updatedAt` sent back as `ifMatch`; mismatch → `409 conflict` "changed by someone else" (courses, microsites, landings, rubrics) |
| CSV import while another runs | one import per microsite at a time (`409`) |
| Accepting an invitation twice | token single-use; second call `410 invitation_invalid` |

### 9.5 Editing a published course

- Changes to text, media and titles apply immediately for everyone.
- **Adding** a unit/block: learners who had completed the course stay completed; others see the new unit.
- **Removing** a unit/block: its progress rows are kept but ignored; course progress is recalculated.
- **Changing an assessment** that has attempts: create a new version; past attempts keep their score against the old version.
- **Making a block required** after learners passed it: no effect on existing completions.
- Certificates already issued are never revoked by edits.
- All recalculation runs in a job, not in the request.

### 9.6 Sessions

- Cookie session, `HttpOnly`, `Secure`, `SameSite=Lax`.
- Lifetime 7 days, sliding (renewed on use); 30 days with "remember me".
- Admin and sub-admin sessions: 12 hours, not extended by "remember me".
- Password change or reset ends all other sessions.
- Disabling a user ends all their sessions immediately.
- `POST /api/me/sessions/revoke-all` → 204 (log out everywhere, from the profile).

### 9.7 Personal data rights

- `GET /api/me/export` → 202; e-mails a download link (JSON + PDFs of certificates) within 24 h. **Auth:** signed-in, own.
- `POST /api/me/delete-request` → 202; admin confirms on P47; the user is anonymised (name → "Deleted user", e-mail hashed, profile cleared); certificates keep the serial but drop the name; audit entry kept.
- Retention: inactive accounts reviewed after 3 years; voice-hiring applicant data deleted after 12 months; audit log kept 2 years. (Confirm with client — UAE PDPL.)

### 9.8 Time zones

- Stored in UTC; displayed in the user's time zone (default `Asia/Dubai`).
- Mentor availability stored as weekly rules in the mentor's time zone; slots generated in UTC.
- Round deadlines and event times shown with the time zone label.

### 9.9 Configuration (environment variables)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | yes | sessions |
| `APP_URL`, `CORS_ORIGINS` | yes | links in e-mails, CORS allow-list |
| `MAIL_FROM`, `SES_REGION`, `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY` | yes (prod) | e-mail; Mailpit in dev |
| `STORAGE_*` (endpoint, bucket, keys) | yes | uploads, certificates, SCORM |
| `REDIS_URL` | yes | jobs queue |
| `ZOOM_SDK_KEY`, `ZOOM_SDK_SECRET`, `ZOOM_WEBHOOK_SECRET` | no | session room (off when blank) |
| `AI_PROVIDER_URL`, `AI_PROVIDER_KEY`, `AI_MODEL` | no | mentor match, insights (rule-based / hidden when blank) |
| `POTENTIAL_INTAKE_URL`, `POTENTIAL_INTAKE_KEY`, `VOICE_PROVIDER_KEY` | no | voice hiring |
| `TRANSLATION_API_URL`, `TRANSLATION_API_KEY` | no | machine translation |
| `SENTRY_DSN` | no | error tracking |
| `SEED_*_PASSWORD` | dev only | seed accounts |

Validated at boot; the server refuses to start if a required variable is missing.

### 9.10 Monitoring and backups

- Structured JSON logs with request id; no passwords, tokens or personal data in logs.
- Error tracking (Sentry or equivalent) on API and client.
- Alerts: API 5xx rate > 2 % for 5 min, job dead-letters > 0, DB disk > 80 %, health check failing.
- Backups: daily full + point-in-time recovery; **RPO 24 h, RTO 4 h**; restore tested monthly.

### 9.11 API versioning

- This contract is **v1**. After the merge, changes are additive only (new fields, new endpoints).
- A breaking change needs a new path (`/api/v2/...`) and both versions run until the client is updated.
- Every change to this file bumps its version line and is noted in a short changelog at the top.

### 9.12 Acceptance criteria (how "done" is checked)

For each endpoint block, the backend has tests for:
1. the happy path returns exactly the documented fields;
2. every role **not** allowed in §0.3 gets 401/403/404;
3. another user's record (**own** / **assigned**) returns 404;
4. invalid input returns 422 with field errors per §0.0;
5. each state rule in §9.1 / §9.4 that applies.

For each page, the mockup and the client show: the documented fields, empty / loading / error states,
mobile 390 px and Arabic RTL. A page is done when both sides pass against the same seed data.
