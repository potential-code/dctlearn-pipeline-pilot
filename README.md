# DCT Learn — rebuild

Rebuild of the DCT Learn platform (`dctlearn.dct.gov.ae`) on the Potential stack.

- **Spec:** [`docs/SPEC.md`](docs/SPEC.md) · **API contract:** [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) (v0.4) ·
  **Seed data:** [`docs/SEED.md`](docs/SEED.md) · **Backend guide:** [`docs/BACKEND.md`](docs/BACKEND.md) ·
  **Generated API reference:** `docs/openapi.json` (Scalar UI at `/api/docs`).
- **Process:** Platform Build Flow — Part 1 (requirements → structured spec → map modules to templates →
  clickable mockup → approval → backend handoff).
- **Reference templates:** `potential-code/potential-template` (cloned at `C:\Users\aliya\potential-template`,
  currently on branch `mockup-references` which adds the `mockup-references/` screenshot library + `layout-rules.md`).
- **Research copy of the live site:** Local app site `dctlearn` → http://dctlearn.local (read-only research;
  live data — do not share).

**Decisions (2026-10-07):** frontend mockup in Claude Design (rebuilt in code at merge) · backend on
Express · scope = all roles · spec keeps DCT naming · P-codes kept as page IDs · senior approves the
mockup · repo stays local for now.

## Backend (branch `backend`)

Bun · Express 5 · Better Auth · Drizzle/PostgreSQL · Zod 4. All contract areas are implemented:
identity & access, microsites, learning & achievements, content (events, resources, forms, AI embeds),
mentoring, competition, analytics/translations/jobs/data rights. Zoom, AI and machine translation are
stubs until keys are provided.

```bash
cp .env.example .env                 # fill DATABASE_URL, BETTER_AUTH_SECRET, …
bun install
bun run db:migrate && bun run db:seed   # SEED.md data + brand pack (password Dct!2026demo)
bun run dev                          # http://localhost:8000/api/health · /api/docs
bun run test                         # needs TEST_DATABASE_URL (a *test* database)
bun run typecheck && bun run lint
```

Demo accounts: `aisha.admin@dctlearn.example` (admin), `omar.m@dctlearn.example` (sub admin, employees),
`hessa.n@example.com` (mentor), `noura.k@example.com` (judge), `saeed.h@dctlearn.example` (learner).
