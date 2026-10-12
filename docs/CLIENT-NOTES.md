# DCT Learn client (`client/`) — notes

React rebuild of the Claude Design canvas "DCT Learn Design System"
(https://claude.ai/artifact/AzgxCwZWsBZEv5AJ2CH1qj). Runs on mock data; not wired to the server yet.

## Run it

```bash
bun install
bun run dev:client          # http://localhost:5173 (also reachable from the Windows browser)
bun run check:client        # typecheck + biome + build
bun run test:client         # Playwright: routes, prototype flows, artboard parity
```

Start at `/`, choose **Sign in**, and pick a demo account (password `Dct!2026demo`):
Saeed (learner), Dr. Hessa (mentor), Noura (judge), Layla (sub admin), Aisha (admin).
The floating pill switches account and language (EN / ع). Design-system boards: `/design/<board>`
(foundations, buttons, forms, shell, shell-mobile, cards, data, feedback, landing, learning; dev only).
Any artboard state can be opened by URL, e.g. `/employees/learn/dct-world?state=final`,
`/elevate/admin?screen=edited`, `/admin/platforms/new?step=3`.

## How the port works

- `tools/dc2jsx.ts` converts each artboard (`.dc.html`) into `src/pages/<Artboard>/`:
  `view.tsx` (markup as JSX), `logic.js` (the artboard's own logic class, unchanged),
  `style.css` (page CSS, scoped), `meta.json`. Files containing a `client:` marker are hand-edited
  and are not overwritten unless `--force` is passed.
- `src/dc/runtime.ts` runs the original logic classes (state, setState, lifecycle) in React.
- The three shared stylesheets are copied verbatim (`src/styles/`). `fixes.css` holds the only
  visual change: KPI rows stack on phones for pages that were drawn at 1280 px only.
- One shared `AppShell` replaces the shell that was copied into 45 artboards. It uses the newest
  shell from the canvas, so the 11 older pages (P15, P16, P35, P37, P45, P47, P50, P51, P52, P55,
  Notifications) gained the mobile menu and the user-menu dropdown.
- Navigation follows SPEC §5 URLs. Prototype-only paths redirect: `/{p}/sign-in` → `/{p}/login`,
  `/mentor/session/{id}` → `/mentoring/session/{id}`. `/employees/` and `/zu/` show the P02 and P03
  landings. Landing-only microsites (ruwaad, csmd) redirect every other path to their landing.

## Verification

- **Parity with the artboard code** (`tools/parity.ts`, `e2e/parity.e2e.ts`): each artboard's
  original logic is run headlessly and its template rendered; the React page must contain every
  text run and the same number of elements per class, in English and Arabic. Result: 142 / 142.
- **Routes** (`e2e/routes.e2e.ts`): 71 pages × EN/AR × desktop 1280 / mobile 390 render with no
  console errors or failed requests, with screenshots in `client/e2e/.out/screens/`.
- **Prototype flows** (`e2e/prototype.e2e.ts`): the five demo accounts, guards and redirects,
  language toggle, user menu, mobile sheet, P35 draft → publish, P40 invite, P59 tabs.
- Pixel comparison against exported artboard PNGs is deferred.

## Decisions to revisit

- DCT fonts (Corporate S CT, GE SS Text) are committed in `client/public/fonts/` at the owner's
  request; the web licence (SPEC Q4) is still unconfirmed.
- The canvas's ShellMobile board puts its scrim above the sheet; the dev board raises the sheet.

## Backend gaps the design exposes (not fixed here)

- In-app notifications list and read state (Notifications page is mock only).
- "No access / request access" state on the microsite sign-in page (server supports it; not designed).
- Public certificate check page, admin audit log, background jobs and exports screens, anonymise
  user (server supports them; not designed).
- Home-page editing and microsite card ordering (neither designed nor in the server).
- Course editor (P59, hand-built after the potential-template CourseBuilder; mock store in
  `client/src/pages/P59-CourseEditor/store.ts`, shapes in `types.ts`):
  - **Pre-test** has no backend equivalent. `course_assessments` needs a position (for example
    `kind: pre | post | unit`) or an `is_pre` flag; Post-test maps to `is_final`.
  - `show_answers` (assessment setting) and the certificate `showSerial` toggle have no column.
  - Certificate signatory name/title are single strings in the contract; the old design showed them
    per language.
  - Per-unit quizzes are `course_assessments` rows with `unit_id`, linked from a `quiz_blocking`
    block through `payload.assessmentId`; the contract does not say how the block references it.
  - Cover image "Browse" needs an image-library listing; the mock offers six images.
  - The mock API is synchronous; every method matches an endpoint in API-CONTRACT "Admin: courses".
  - P59 is no longer generated: it is removed from `tools/artboards.txt` and has no parity fixture
    (`rebuilt: true` in `e2e/pages.ts`); `e2e/course-editor.e2e.ts` covers it.
- Course player (P16, hand-built after the potential-template learning-module player; mock store in
  `client/src/pages/P16-Course/store.ts`, shapes in `types.ts`, data derived from the P59 seed):
  - **Pre-test required before modules**: the learner must have *attempted* the pre-test (pass not
    required) before any unit opens. The contract's `GET /courses/{slug}` has no pre-assessment ref and
    unit `status` does not say why a unit is locked; it needs `preAssessment { id, title, status }` and
    unit locking on "pre-test attempted".
  - **Block-level locking**: one block per screen, blocks unlock in order. The contract only tracks
    unit status; `GET /units/{id}` returns `completed` per block but not which block is unlocked. The
    client derives it (all earlier blocks completed). The server must enforce it on `progress` calls.
  - Per-block completion rules: video (`mustWatch`), audio and action plan (5 answers of 10+ characters)
    complete on `POST .../progress`; survey and SCORM complete on their own PUTs; a `quiz_blocking`
    block completes on a passing attempt. The contract does not list the `quiz_blocking` block type or
    the unit-check link (`payload.assessmentId`) in `blockType`.
  - `CourseView` also needs: module `progressPct` by blocks (the player shows "N units · X% complete"),
    `isMandatory` per microsite, bilingual `categories`, and `finalAssessment`/`preAssessment` as the
    post-test / pre-test rows (`kind`).
  - `AssessmentView` needs `description`, `kind` (pre | post | unit), `showAnswers`, `attemptsUsed` and
    best score / last attempt (the intro shows attempts made, attempts remaining, best score, status);
    `attemptsAllowed: 0` is read as unlimited. `AttemptResult` needs per-question `right` when answers
    are revealed (the review marks correct / incorrect).
  - Block payload gaps: playlist item titles are bilingual (contract: string); quote `author` and
    resource `title` bilingual; resource `ext` / `size` for the file badge; case study has a separate
    `reflection`; text `html` is shown as plain paragraphs (sanitised rich text not rendered yet).
  - Completion: the course completes on the post-test pass (or on the last unit when there is no
    post-test); points are `pointsConfig.unit` per unit, `assessmentPass` once on the post-test pass and
    `course` on completion. The mock awards them locally; the real values come from `/units/{id}/complete`.
  - Video and audio playback are simulated (no media in the mock): position advances on a timer and
    `positionSec` / `resumeAtSec` are not sent. The real YouTube IFrame API and an `<audio>` element
    replace `useSim` in `renderers.tsx`.
  - Deep links `/{p}/learn/{course}/pre-test | final-check | complete | u2 | u2/b3` address a place by
    index (`b3` = third block). The mock seeds a fresh page load so the link is reachable
    (`?state=fresh|u2|final|failed|complete` seeds it explicitly); with the API the server decides and a
    locked place shows the "Not available yet" notice. Unknown course slugs fall back to Museum 101.
  - P16 is no longer generated: removed from `tools/artboards.txt` and has no parity fixture
    (`rebuilt: true` in `e2e/pages.ts`); `e2e/course-player.e2e.ts` covers it.
- Server e-mail links use paths that differ from SPEC (e.g. `/invite/{token}` vs `/{p}/invite`).
