# Spec templates

Reusable starting points for a new platform. Copy all three into the new project's `docs/`, then fill
them in this order: **SPEC → API-CONTRACT → SEED**. DCT Learn (`../SPEC.md`, `../API-CONTRACT.md`,
`../SEED.md`) is the worked example.

| File | What it is | Filled from |
|---|---|---|
| [`SPEC-TEMPLATE.md`](SPEC-TEMPLATE.md) | What the platform is: roles, journeys, pages, data model, branding, security | client brief, user flows, discovery |
| [`API-CONTRACT-TEMPLATE.md`](API-CONTRACT-TEMPLATE.md) | What data each page sends and receives, and who may call it | SPEC §2 (roles) and §5 (pages) |
| [`SEED-TEMPLATE.md`](SEED-TEMPLATE.md) | The shared demo dataset for mockup and backend | SPEC + client content |

**Rules**
- SPEC §1–§11 describe the new platform only. Anything about an existing system goes in the last section ("Migrating from an existing platform").
- Every page has an ID (e.g. P01) used in all three files.
- Every endpoint has an **Auth:** line using the terms in API-CONTRACT §0.3. No Auth line = not reviewed.
- If it is not in the contract, the UI does not show it and the API does not return it. Change the file first.
- Sections marked *(keep as-is)* are standard for the Potential stack; change only if the project differs.

Candidate to move into `potential-template/mockup-references/_spec-templates/` after this pilot.
