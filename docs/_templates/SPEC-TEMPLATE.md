# <Product name> — Platform Requirements Specification

**Status:** Draft v0.1 · **As of:** YYYY-MM-DD · **Author:** <name>
**Single source of truth for** the frontend mockup and the backend build. Companion files:
`API-CONTRACT.md` (data per page) and `SEED.md` (shared demo data).

<!-- §1–§11 describe the NEW platform only. No "today/old/new" wording. Existing-system facts go in §12. -->

---

## 1. Product overview
<One paragraph: what the platform is, for whom, and its main organising idea (e.g. microsites, tenants, programmes).>

**Who it is for:** <user groups>

| # | Module | Summary |
|---|---|---|
| M1 | | |

**Target stack** *(keep as-is unless different)*: Bun + Express + Better Auth, Vite + React 19 SPA,
Drizzle ORM on PostgreSQL, i18next (EN/AR, RTL), Docker on Dokploy — from `potential-template/project-skeleton`.

**Scale to design for:** <users, tenants, content items, largest table>.

---

## 2. Roles and <organising unit>

### 2.1 Roles
One role per account (or say otherwise).

| Role | Who | Can do |
|---|---|---|
| Visitor | not signed in | |
| | | |

<How membership / scoping works. "Every permission is enforced on the server; hiding UI is never the only guard.">

### 2.2 <Organising unit> settings
| Setting | Values |
|---|---|

### 2.3 Launch list
| Id | Name | Sign-in | Features on |
|---|---|---|---|

---

## 3. User journeys
Page IDs are defined in §5. One subsection per role: **Purpose**, **Entry**, numbered steps (page ID + URL +
what happens), and a mermaid flowchart.

### 3.1 Visitor
### 3.2 <Role>

---

## 4. Build approach: modules → reference templates
| Module | Template | What still needs building |
|---|---|---|

### 4.1 Mockup references
Every page follows `mockup-references/layout-rules.md` *(keep as-is)*.

| Page | Reference screenshot | Notes / "spec needed" |
|---|---|---|

---

## 5. Pages and navigation
**Data:** S = shows, C = collects. Full fields in API-CONTRACT.

### 5.1 <Role>
| ID | URL | Purpose | Data |
|---|---|---|---|

### 5.x Navigation per role
| Role | Sidebar items | Top bar |
|---|---|---|

---

## 6. Data model
| Entity | Key fields |
|---|---|

<State business rules here, e.g. enrolment rule, completion rule.>

Status changes, constraints, indexes, delete behaviour, jobs, concurrency and live-content edits: **API-CONTRACT "Backend behaviour"**.

---

## 7. Branding and design
### 7.1 Colours (tokens, hex, use)
### 7.2 Typography (UI, headings, Arabic, scale)
### 7.3 Components (what each key component looks like)
### 7.4 Brand assets needed
### 7.5 Arabic and right-to-left *(keep as-is)*
`dir="rtl"`, logical CSS properties, mirrored shell, Arabic font token, content stored in both languages.
### 7.6 Accessibility and responsive *(keep as-is)*
WCAG 2.1 AA; 390 px mobile (sidebar → sheet, single column, tables → cards); < 992 px tablet; max 1400 px.

---

## 8. Security and access control *(keep as-is, adjust names)*
1. **Authentication:** Better Auth, verified e-mail, cookie sessions, rate limits and lockout, invitation tokens with expiry, admin-triggered reset, disabled status checked every request, no account enumeration.
2. **Authorisation:** roles in §2.1 on every route and service; scoped roles limited to their scope; users to their own data. Full matrix, ownership, personal-data visibility, sanitised fields and audited actions: **API-CONTRACT §0.3** and each endpoint's **Auth:** line.
3. **Input and output:** shared Zod schemas; parameterised queries; rich text sanitised on save and escaped on render; uploads checked by type and size, signed URLs.
4. **Web protections:** CSRF, CORS, secure headers, body limits from core; no secrets in the client; third-party calls made by the server.
5. **Privacy:** <sensitive fields>; collected only where needed; encrypted at rest; consent text for third-party sharing.
6. **Audit:** log admin and scoped-admin actions (imports, role/membership changes, publishing, approvals, deletions).
7. **Operations:** secrets in env; no dumps in web-served folders; pinned images; daily backups.

---

## 9. Integrations
| Integration | Use |
|---|---|

## 10. Non-functional requirements
- Languages; performance targets; mobile-first; realistic seed data; hosting; every page has empty / loading / error / mobile / RTL states.
- Session lengths; personal-data export/deletion and retention; time zone; monitoring, backups (RPO/RTO); API versioning; definition of done — detailed in API-CONTRACT "Backend behaviour".

## 11. Open questions
- [ ] **Q1** <question>. *Proposed:* <answer>. *Owner:* <who>

---

## 12. Migrating from an existing platform (optional — delete if greenfield)
### 12.1 The existing system (stack, counts, notable custom code)
### 12.2 Old → new mapping (new entity ↔ old table / field)
### 12.3 What changes (area · existing · new platform) and what is dropped
### 12.4 Security findings on the live system (fix now, independent of the rebuild)
### 12.5 Data migration rules (what moves, what is archived, what is discarded)
### 12.6 Migration questions
