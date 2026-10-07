# <Product name> — API Contract

**Status:** Draft v0.1 · **As of:** YYYY-MM-DD · Pairs with `SPEC.md` and `SEED.md`.

The frontend shows nothing that is not in this file; the backend returns nothing that is not in this
file. To change a field, change this file first, then both sides.

<!-- Sections marked (keep as-is) are the Potential-stack defaults. Fill the <...> parts. -->

---

## 0. Conventions *(keep as-is, adjust names)*

| Topic | Rule |
|---|---|
| Base URL | `/api` |
| Auth | Better Auth cookie session. `GET /api/me` returns the signed-in user. 401 when signed out. |
| Roles | <list from SPEC §2.1>. One role per account. |
| Scope | `{p}` = <organising unit> id. Scoped routes require <membership rule>. |
| IDs | UUID strings. |
| Dates | ISO 8601 UTC; date-only `YYYY-MM-DD`. |
| i18n text | Content fields `{ "en": "...", "ar": "..." }`. |
| Pagination | `?page=&pageSize=` → `{ items, page, pageSize, total }`; default 20, max 100. |
| Sorting / filter | `?sort=field:asc|desc`; filters listed per endpoint. |
| Errors | `{ error: { code, message, fields? } }` |
| Files | multipart upload → `{ fileId, url }` (signed). |
| Mutations | JSON validated with Zod; same schema as the form. |
| Rate limits | auth 10/min/IP · imports, invites, uploads 30/min/user · public forms 5/min/IP · other 120/min/user · 429 + `Retry-After`. |
| Uploads | images ≤ 5 MB · PDF ≤ 10 MB · <other types> · CSV ≤ 2 MB / 5,000 rows. |
| Business rules | <enrolment, completion, other cross-cutting rules>. |
| Health | `GET /api/health` → `{ status, db, version }`. |

### 0.0 Field limits
| Field | Rule |
|---|---|
| name | 1–80 |
| email | valid, ≤ 254, lower-cased |
| password | 10–128, breached-list check |
| title (per language) | 1–160 |
| short text | ≤ 240 |
| rich text | ≤ 20,000 |
| URL | `https://` only |
| slug | `^[a-z0-9-]{2,40}$` |

### 0.0.1 Error codes *(keep as-is, add project ones)*
| code | HTTP | When |
|---|---|---|
| `unauthenticated` | 401 | no session |
| `forbidden` | 403 | wrong role or scope |
| `not_found` | 404 | missing, not visible, or not own |
| `validation_failed` | 422 | Zod errors in `fields` |
| `conflict` | 409 | duplicate |
| `locked` | 409 | state does not allow the action |
| `email_not_verified` | 403 | |
| `account_disabled` | 403 | |
| `invitation_invalid` | 410 | |
| `rate_limited` | 429 | |
| `feature_off` | 404 / 503 | feature disabled |

### 0.1 Enums
| Enum | Values |
|---|---|

### 0.2 Shared shapes
```
User  { id, name, email, role, locale, imageUrl?, status }
I18n  { en, ar }
<other shared shapes>
```

### 0.3 Access rules *(keep the structure; fill the tables)*

Every endpoint block has an **Auth:** line using these terms. Enforced in middleware **and** re-checked
in the service.

| Term | Meaning |
|---|---|
| `public` | no session |
| `public (token)` | valid, unexpired, single-use token |
| `signed-in` | any active, verified account |
| `member(p)` | signed-in + membership of `p` + `p` is live |
| `role(x)` | signed-in + `user.role == x` |
| `<scoped_admin>(p)` | scoped admin of `p`, or admin |
| **own** | record belongs to the user; otherwise 404 (not 403) |
| **assigned** | a row links the user to that record |
| **Audit: yes** | writes `audit_log { actor, action, target, scope, at, ip }` |
| **Sanitise** | HTML allow-listed on save; output escaped |

**Permission matrix** (✓ · own · p · —)

| Area | <role 1> | <role 2> | … | Admin |
|---|---|---|---|---|

**Personal data each role may see**

| Field | Self | <role> | … | Admin |
|---|---|---|---|---|

**Always** *(keep as-is)*
- Role, status and memberships read from the DB on every request; changes apply immediately.
- Fields the caller may not set (`role`, `status`, `userId`, scope ids, totals, points) are ignored in bodies.
- List and export endpoints use the same scope as detail endpoints.
- Signed file URLs: 5-minute TTL, user-bound, access re-checked when signing.
- Uploads: type checked by content, stored outside the web root, never executed.
- CSRF, CORS allow-list, secure headers, body limits from core on all mutating routes.
- Secrets never appear in responses.
- Errors never confirm whether another user's e-mail or record exists.

---

## 1. <Role> pages

### <Page ID> <Page name> — `<METHOD> /api/...`
**Auth:** <term(s)> · <ownership / state rules> · **Sanitise:** <fields> · **Audit:** <yes/no>

```
<request body, if any>
→ <response fields with types>
```
<Errors specific to this endpoint.>

<!-- Repeat one block per page / action. Group by role, in the same order as SPEC §5. -->

---

## N. Notifications (server → e-mail, no API)
| Event | To | Template |
|---|---|---|

Sender configurable (`MAIL_FROM`).

---

## N+1. Backend behaviour *(keep the structure; fill the tables)*

### Status changes
Only listed moves are allowed (else `409`). **A** = audited.
| Entity | From → To | Who / trigger |
|---|---|---|

### Database rules
| Rule | Where |
|---|---|
| Unique | <natural keys, idempotency keys (points, certificates), one-active-X partial indexes> |
| Indexes | every FK · hot filters · text search fields |
| Delete behaviour | users disabled/anonymised, never hard-deleted · parents archived · soft delete (`deleted_at`) for content · audit log append-only |
| Foreign keys | `RESTRICT` by default; `CASCADE` only for draft-owned children |
| Timestamps | `created_at`, `updated_at` (UTC) everywhere |

### Background jobs
| Job | Schedule | Retry | Notes |
|---|---|---|---|
| Send e-mail | on event | 5, exponential | dead-letter visible to admin |
| Token / invitation expiry | hourly | — | |
| Cleanup | daily | — | expired tokens, orphan uploads |

### Concurrency
| Case | Rule |
|---|---|
| Same slot / resource taken twice | unique index → `409` |
| Double submit / double click | idempotent result |
| Two admins edit the same record | `ifMatch: updatedAt` → `409` on mismatch |

### Editing live content
<What happens to users' progress/state when published content is changed, added or removed.>

### Sessions *(keep as-is)*
`HttpOnly`, `Secure`, `SameSite=Lax` · 7 days sliding (30 with remember me) · admin roles 12 h · password change/reset and disabling end all sessions · `POST /api/me/sessions/revoke-all`.

### Personal data rights *(keep as-is, set periods)*
`GET /api/me/export` · `POST /api/me/delete-request` (admin confirms, user anonymised) · retention periods: <…> (check local law).

### Time zones *(keep as-is)*
Store UTC; display user time zone (default <zone>); recurring availability stored in the owner's zone.

### Configuration
| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | yes | |
| `APP_URL`, `CORS_ORIGINS` | yes | |
| `MAIL_FROM`, e-mail provider keys | prod | |
| `STORAGE_*` | yes | |
| `REDIS_URL` | if jobs | |
| <optional integrations> | no | feature off when blank |
Validated at boot.

### Monitoring and backups *(keep as-is, set targets)*
Structured logs (no PII/secrets) · error tracking · alerts (5xx rate, dead letters, disk, health) · daily backup + PITR, RPO <…>, RTO <…>, monthly restore test.

### API versioning *(keep as-is)*
v1 additive-only after merge; breaking changes under `/api/v2`; version line + changelog at top.

### Acceptance criteria *(keep as-is)*
Per endpoint: happy path returns exactly the documented fields · disallowed roles get 401/403/404 · other users' records 404 · invalid input 422 · applicable status/concurrency rules.
Per page: documented fields, empty/loading/error, 390 px mobile, RTL — passing on the shared seed data.
