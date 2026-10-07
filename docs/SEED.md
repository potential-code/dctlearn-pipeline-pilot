# DCT Learn — Seed dataset

**Status:** Draft v0.1.1 (scores and event time corrected to match the fixed clock) · **As of:** 2026-10-06 · Pairs with [`SPEC.md`](SPEC.md) and [`API-CONTRACT.md`](API-CONTRACT.md).

The same dataset is loaded by the backend seed script and used by the frontend mockup, so screens match
when the two are merged. **Fixed "today" = 2026-10-06 09:00 UTC.** All people are fictional; e-mails use
`@dctlearn.example` (learners) and `@example.com` (external). Course titles and categories are real
(from the current catalogue) so reviewers judge a realistic experience.

---

## 1. Microsites (9)

| id | Name (EN / AR) | Accent | Hero image | Sign-in | Landing only | Tabs on | Courses | Mandatory | Mentoring | Competition | Sub admin |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `employees` | DCT Employees / موظفو الدائرة | `#EE3E43` | `heroes/employees.png` | invite_only (domain `dctabudhabi.ae` may self-register) | no | courses, workshops, mentors, ai_coaches, ai_tools | C01–C08 | C01, C03 | no | no | Omar Al Mansoori |
| `elevate` | Elevate 2026 Mentorship Programme / برنامج إرتقاء | `#CD3151` | `heroes/elevate.jpg` | invite_only | no | mentors (label "Mentors"), workshops (label "Sessions") | — | — | **yes** | no | Layla Haddad |
| `znm` | Zayed National Museum / متحف زايد الوطني | `#3B2F92` | `heroes/znm.jpg` | invite_only | no | courses ("ZNM Courses"), resources, workshops ("Assessments") | C09–C12, C02, C01 | all | no | no | Khalid Al Dhaheri |
| `zu` | Zayed University 24-Hour Challenge / تحدي جامعة زايد | `#F7C337` | `heroes/zu.jpg` | invite_only | no | courses | C13 | — | no | **yes** | — (admin covers) |
| `museopro` | MuseoPro / ميوزيو برو | `#E35E3C` | `heroes/museopro.jpg` | invite_only | no | courses (default filter "Mandatory courses"), resources, mentors (trainers) | C14–C17 | C14, C15 | no | no | Camille Rousseau |
| `nibras` | Nibras — DCT AI Champions / نبراس | `#2FC4DB` | `heroes/nibras.png` | invite_only | no | courses | C18–C21 (tracks: Aware, Practitioner, Builder) | per track | no | no | Fatima Al Suwaidi |
| `chkforum` | Cultural Heritage & Knowledge Development Forum / منتدى التراث الثقافي | `#6D7782` | `heroes/forum.jpg` | open | no | courses | C22–C23 | — | no | no | — |
| `ruwaad` | Ruwaad — Careers in Hospitality / رواد | `#F77860` | `heroes/ruwaad.png` | landing_only | **yes** | — | — | — | no | no | — |
| `csmd` | Cultural Sites Management Department / إدارة المواقع الثقافية | `#E3DCD3` | `heroes/csmd.jpg` | landing_only | **yes** | — | — | — | no | no | — |

Landing content per microsite: heading / subheading from SPEC §2.2 (e.g. ZNM "Welcome to the onboarding
programme of Zayed National Museum"; Elevate "Are you ready to accelerate your growth and career at
DCT Abu Dhabi?"; Nibras "A DCT AI Champions programme"; Ruwaad "Careers in Hospitality").
Elevate has `popup` enabled (image + "Mentee registration is open"). MuseoPro and Elevate show
**partners** (DCT, France Muséums, Réunion des Musées, INP). ZNM shows **social** links. Ruwaad shows a
register-interest form.

---

## 2. Courses (23) — real titles, fictional structure

| Key | Title (EN) | Title (AR) | Categories | Level | Min | Units | Cert | Note |
|---|---|---|---|---|---|---|---|---|
| C01 | DCT World | عالم الدائرة | All about DCT; Welcome to DCT | beginner | 45 | 4 | yes | most-taken course |
| C02 | Museum 101 | المتاحف 101 | The World of Museums | beginner | 60 | 5 | yes | |
| C03 | DCTLEARN | منصة DCT Learn | All about DCT | beginner | 20 | 2 | yes | onboarding |
| C04 | Understanding Cultural Heritage | فهم التراث الثقافي | Cultural Heritage | beginner | 50 | 4 | yes | |
| C05 | Sustainable Tourism | السياحة المستدامة | Tourism Management | intermediate | 60 | 4 | yes | |
| C06 | The World of Curation | عالم التقييم الفني | The World of Museums | intermediate | 55 | 4 | yes | |
| C07 | Creative Tourism: What is it? | السياحة الإبداعية | Creative and Cultural Industries | beginner | 40 | 3 | yes | |
| C08 | Data Protection for People and Performance | حماية البيانات | Corporate Knowledge and Compliance | beginner | 30 | 3 | yes | has blocking quiz |
| C09 | Introduction to Ticketing | مقدمة في التذاكر | ZNM onboarding | beginner | 35 | 3 | yes | |
| C10 | Operational Readiness – Induction | الجاهزية التشغيلية – التعريف | ZNM onboarding | beginner | 40 | 3 | yes | |
| C11 | Operational Readiness – Role-Specific | الجاهزية التشغيلية – حسب الدور | ZNM onboarding | intermediate | 45 | 3 | yes | |
| C12 | VS Knowledge Assessment | تقييم المعرفة | Post-Assessment | beginner | 15 | 1 | no | survey only |
| C13 | 24 Hour Challenge – Introduction to Cultural Heritage | تحدي 24 ساعة | Cultural Heritage | beginner | 90 | 4 | yes | competition course; last unit = action plan "pitch" |
| C14 | Condition Report: General Presentation | تقرير الحالة | Fundamentals – Documentation of Cultural Heritage | intermediate | 50 | 3 | yes | |
| C15 | Conservation and Exhibition of Artefacts | صون وعرض القطع | Conservation and exhibition of artefacts | intermediate | 60 | 4 | yes | |
| C16 | Curating an Exhibition: From Concept to Production | تنظيم المعارض | Conservation and exhibition of artefacts | advanced | 70 | 4 | yes | |
| C17 | Written and Oral Interpretation Tools in Heritage | أدوات التفسير | Interpretation and audience management | intermediate | 45 | 3 | yes | coming_soon |
| C18 | Introduction to Generative AI | مقدمة في الذكاء الاصطناعي التوليدي | AI Aware | beginner | 120 | 1 | external | Nibras: completion by certificate upload |
| C19 | Ethics of AI | أخلاقيات الذكاء الاصطناعي | AI Aware | beginner | 90 | 1 | external | |
| C20 | Foundations of Prompt Engineering | أساسيات هندسة الأوامر | AI Practitioner | intermediate | 180 | 1 | external | |
| C21 | LLMOps | عمليات نماذج اللغة | AI Builder | advanced | 240 | 1 | external | |
| C22 | UNESCO: Implementation of the Convention on Diversity of Cultural Expressions | اتفاقية اليونسكو | Protection and Promotion of the Diversity of Cultural Expression | intermediate | 60 | 3 | yes | |
| C23 | Abu Dhabi Creative City and Its Cooperation with Other Cities | أبوظبي مدينة مبدعة | Protection and Promotion of the Diversity of Cultural Expression | intermediate | 45 | 3 | yes | |

### 2.1 Structure of a full course (apply to C01 as the showcase; others get 2–3 modules of text + youtube + survey)

**C01 DCT World** — sequential, certificate enabled, 10 points per unit, 50 points on completion.

| Module | Unit | Blocks (type → payload summary) | Assessment |
|---|---|---|---|
| M1 Welcome to DCT | U1 Who we are | youtube (`dQw4w9WgXcQ` placeholder) · text (summary) · case_study · quotes (2) | — |
| | U2 Our sectors | audio ("DCT Flow — Our sectors", 6 min, `audio/dct-flow-sectors.mp3`) · text · resources (1 PDF "Sector map") | survey (3 q) |
| M2 Culture & Tourism | U3 Abu Dhabi's cultural sites | scorm (`scorm/cultural-sites/index.html`) · text · youtube_playlist (3 videos) | — |
| | U4 Your role in the visitor journey | text · **action_plan** (5 questions, 500 chars each: "In 3 years, on the professional side, I want to have done…", …) · resources (template) | **quiz_blocking** "DCT World final check" — pass 70 %, 2 attempts, 5 questions (3 multiple_choice, 1 true_false, 1 open_text) |

**C08 Data Protection** has a `quiz_blocking` after unit 2 (pass 80 %, 1 attempt). **C12** is one `survey` unit. **C13** last unit holds the competition action plan (3 questions: name/tagline, short description, why it will grab attention). **C17** is `coming_soon`.

### 2.2 Course cards
Every course has a card: `cards/{key}.jpg`, categories as above, level, duration, `isCertProgramme = false`
except C13, `comingSoon = true` for C17.

---

## 3. Mentor categories (real list)
Strategy and Planning · Culture and Heritage · Museums and Curation · Marketing and Communications ·
People and Performance · Finance and Revenue · Visitor Experience and Events · Libraries and Publishing ·
Tourism and International Operations · Legal and Governance · Sustainability · Business Excellence and
Quality · Youth and Community Engagement · Research

---

## 4. People

Passwords in seed: `Dct!2026demo` for every account (dev only; refused in production).

### 4.1 Admin & sub admins
| Name | E-mail | Role | Scope |
|---|---|---|---|
| Aisha Al Marzouqi | aisha.admin@dctlearn.example | admin | DCT Learn |
| Omar Al Mansoori | omar.m@dctlearn.example | sub_admin | employees |
| Layla Haddad | layla.h@dctlearn.example | sub_admin | elevate |
| Khalid Al Dhaheri | khalid.d@dctlearn.example | sub_admin | znm |
| Camille Rousseau | camille.r@example.com | sub_admin | museopro |
| Fatima Al Suwaidi | fatima.s@dctlearn.example | sub_admin | nibras |

### 4.2 Mentors (3) + trainer (1)
| Name | E-mail | Title | Categories | Microsites | Kind | Availability (Gulf time) |
|---|---|---|---|---|---|---|
| Dr. Hessa Al Nuaimi | hessa.n@example.com | Director, Museums Strategy | Museums and Curation; Strategy and Planning | elevate | mentor | Sun–Thu 10:00–13:00 |
| Rashid Al Blooshi | rashid.b@example.com | Head of Visitor Experience | Visitor Experience and Events; Tourism and International Operations | elevate | mentor | Mon, Wed 14:00–17:00 |
| Mariam Khoury | mariam.k@example.com | Senior Manager, People & Performance | People and Performance; Marketing and Communications | elevate, employees | mentor | Tue, Thu 09:00–12:00 |
| Jean-Luc Morel | jl.morel@example.com | Conservation Trainer, France Muséums | Museums and Curation | museopro | trainer (courses C14, C15) | — (no booking) |

Bios: 2 sentences each, EN + AR. Photos `people/mentor-{1..4}.jpg`.

### 4.3 Judges (2)
| Name | E-mail | Microsite | Status |
|---|---|---|---|
| Noura Al Kaabi | noura.k@example.com | zu | active |
| Daniel Osei | daniel.o@example.com | zu | invited (pending) |

### 4.4 Learners (8)
| # | Name | E-mail | Microsites | Profile | Progress & points |
|---|---|---|---|---|---|
| L1 | Saeed Al Hammadi | saeed.h@dctlearn.example | employees, elevate | Specialist, DCT Culture, hired 2024-03 | C01 100 % (cert), C02 60 %, C03 100 % (cert); 280 pts; Elevate registered, matched to Hessa; 2 bookings |
| L2 | Mona Al Ameri | mona.a@dctlearn.example | employees | Section Head, Support Services | C01 25 %, C08 0 %; 40 pts |
| L3 | Yousef Al Zaabi | yousef.z@dctlearn.example | znm | Gallery Host, ZNM | C09 100 %, C10 100 %, C11 40 %, C12 done; 310 pts; 2 certs |
| L4 | Reem Al Shamsi | reem.s@dctlearn.example | znm, employees | Ticketing Host, ZNM | C09 100 %, C01 100 %; 200 pts |
| L5 | Ahmed Khan | ahmed.k@example.com | zu | ZU student | C13 100 %, action plan submitted, scored 72/100; 130 pts |
| L6 | Sara Haddad | sara.h@example.com | zu | ZU student | C13 75 %, action plan draft; 90 pts |
| L7 | Élise Martin | elise.m@example.com | museopro | Collections officer | C14 100 %, C15 30 %; 140 pts |
| L8 | Hamad Al Mazrouei | hamad.m@dctlearn.example | nibras (Aware), employees | Data analyst | C18 external cert uploaded (approved), C19 pending upload; C01 100 %; 150 pts |
| — | Invited (not accepted) | new.member@dctlearn.example | elevate | — | invitation sent 2026-10-01, expires 2026-10-15 |
| — | Disabled | former.staff@dctlearn.example | employees | — | status disabled |

Points ledger entries dated between 2026-08-01 and 2026-10-05. Leaderboard (employees): Saeed 280, Reem 200, Hamad 150, Mona 40.

---

## 5. Mentoring (Elevate)

- **Registration form** (kind `registration`): fields `goals` (text), `yearsAtDct` (select), `preferredAreas` (multi-select of mentor categories), `language` (en/ar/both). L1 completed on 2026-09-20.
- **Match:** L1 → Hessa (source `ai`, score 0.87, reasons "Museums and Curation overlap", "Arabic + English"). Suggestions also returned Rashid (0.71).
- **Bookings**
  | id | Mentee | Mentor | Starts (UTC) | Status | Feedback |
  |---|---|---|---|---|---|
  | B1 | L1 | Hessa | 2026-09-28 07:00 (60 min) | completed | rating 5, attended |
  | B2 | L1 | Hessa | 2026-10-12 07:00 | confirmed | — |
  | B3 | L4 | Mariam | 2026-10-02 06:00 | cancelled (mentor, "travel") | — |
- **GROW log** (by Hessa, for B1, session 1, 2026-09-28): Goal "Lead a small exhibition project by Q2 2027" · Reality "Strong content skills, limited budget experience" · Options "Shadow the finance lead; take C16" · Way forward "Enrol in C16 this week; draft a one-page project brief before session 2".

---

## 6. Competition (ZU)

- **Round R1** "24-Hour Challenge 2026" — status `judging`, opened 2026-09-15, closes 2026-10-20, course C13, eligibility ≥ 80 % progress.
- **Rubric** (Σ = 100): Name/tagline captures the essence — 15 · Short description communicates the key message — 25 · Creativity and originality — 20 · Will it grab attention and drive participation — 40.
- **Submissions:** L5 submitted 2026-09-30 (scored by Noura: 7, 7, 8, 7 → 72.0 with weights 15/25/20/40); L6 in progress.
- **Assignments:** L5 → Noura, Daniel (pending); L6 → Noura.

---

## 7. Events / workshops (3)

| Title | Microsites | Category | Starts (UTC) | Venue / link | Status |
|---|---|---|---|---|---|
| Mentoring Kick-off Session | elevate | Sessions | 2026-10-08 06:00–07:00 | Zoom `https://zoom.example/kickoff` | upcoming |
| Museum Safety Briefing | znm | Assessments | 2026-10-06 08:30–09:30 | Zayed National Museum, Saadiyat | live (today, at the fixed 09:00) |
| Creative Economy Masterclass | employees | Workshops | 2026-09-10 07:00–09:00 | recording `https://video.example/masterclass` | past |

---

## 8. Resources (4)

| Title | Microsite | Type | Status | Note |
|---|---|---|---|---|
| ZNM Visitor Code of Conduct | znm | pdf | approved | |
| Museum Glossary (ICOM) | museopro | link `https://icom.museum/...` | approved | |
| Ticketing FAQ sheet | znm | link | pending | submitted by Khalid 2026-10-05 |
| Internal SharePoint link | employees | link | rejected | note: "Use a public https link; SharePoint needs login" |

---

## 9. AI embeds (4)

| key | Name | Kind | Provider id (placeholder) | Colour | Microsites | Login |
|---|---|---|---|---|---|---|
| `culture-bot` | Abu Dhabi Culture Bot | chat | `bot_culture_demo` | `#A39089` | employees | yes |
| `career-coach` | Career Coach | chat | `bot_career_demo` | `#CE3F3F` | employees, elevate | yes |
| `lesson-planner` | AI Lesson Planner | iframe | `tool_lesson_demo` | `#EE3E43` | employees | yes |
| `voice-hiring` | Al Ain Museum Voice Hiring Agent | voice | `assistant_hiring_demo` | `#EE3E43` | — (public page) | no |

---

## 10. Invitations & requests
- Learner invitation to `new.member@dctlearn.example` (elevate) — sent, expires 2026-10-15.
- Judge invitation to Daniel Osei (zu) — sent 2026-10-03.
- Mentor invitation to `new.mentor@example.com` — sent 2026-10-04.
- Microsite request from Layla Haddad: "Elevate Alumni", purpose "keep 2025 cohort engaged" — requested 2026-10-02.

## 11. FAQ (6 items), Home affiliates (2: VX Academy `https://vxacademy.example`, Abu Dhabi Tourist Guide `https://adtg.example`, new tab)

---

## 12. Assets folder layout (shared by both tracks)
```
seed/assets/
  logos/dct-learn.png  logos/dct-brandmark.jpg
  heroes/{employees,elevate,znm,zu,museopro,nibras,ruwaad,csmd}.{jpg|png}   (forum: reuse csmd or add)
  cards/C01.jpg … C23.jpg
  people/mentor-1..4.jpg  people/learner-1..8.jpg  (stock, royalty-free)
  partners/{dct,fm,rmn,inp}.png
  certificates/background.png  certificates/logo.png
  audio/dct-flow-sectors.mp3   scorm/cultural-sites/
```
Real DCT images from the current site may be used for heroes, logos and certificate backgrounds
(they are DCT's own assets); people photos are stock.
