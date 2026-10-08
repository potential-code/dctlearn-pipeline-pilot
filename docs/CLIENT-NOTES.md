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
Any artboard state can be opened by URL, e.g. `/employees/learn/dct-world?screen=quiz`,
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
- Server e-mail links use paths that differ from SPEC (e.g. `/invite/{token}` vs `/{p}/invite`).
