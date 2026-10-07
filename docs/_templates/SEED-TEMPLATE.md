# <Product name> — Seed dataset

**Status:** Draft v0.1 · **As of:** YYYY-MM-DD · Pairs with `SPEC.md` and `API-CONTRACT.md`.

Loaded by the backend seed script **and** used by the frontend mockup, so screens match at merge.
**Fixed "today" = YYYY-MM-DD 09:00 UTC.** People are fictional; content (programme names, course
titles, categories) is real or client-like — never "Lorem ipsum" or "Test user".

## 1. <Organising units> (all launch ones)
| id | Name (EN / AR) | Accent | Hero | Sign-in | Features on | Content | Scoped admin |
|---|---|---|---|---|---|---|---|

Landing / branding content per unit (headings, popups, partners).

## 2. Main content (e.g. courses, products, jobs)
| Key | Title (EN) | Title (AR) | Category | Level / type | Size | Notes |
|---|---|---|---|---|---|---|

### 2.1 One showcase item, fully structured
Uses every content/block type and every state (locked, completed, coming soon, blocking quiz…).

## 3. Reference lists (categories, tags, sectors)

## 4. People
Demo password for every account (dev only; refused in production).
### 4.1 Admins and scoped admins
### 4.2 <Other roles> (2–4 each)
### 4.3 End users (6–10) — each with a different state: new, in progress, completed, multi-scope, invited, disabled
| # | Name | E-mail | Scopes | Profile | Progress / activity |
|---|---|---|---|---|---|

## 5–9. One section per feature (bookings, rounds and scores, events, resources, integrations…)
Include at least one record in each status (pending / approved / rejected, upcoming / live / past…).

## 10. Invitations and requests (pending, expired)

## 11. Static content (FAQ, home sections, affiliates)

## 12. Assets folder layout
```
seed/assets/
  logos/  heroes/  cards/  people/  partners/  certificates/  media/
```
