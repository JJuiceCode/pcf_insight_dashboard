# TASK.md

# Current Focus

Stabilize and finalize the HanaLoop PCF Dashboard assignment.

The current implementation already supports:

- PCF calculation flow
- GHG Scope aggregation
- Activity verification table
- Activity input workflow
- Versioned emission factor management
- Prisma + SQLite integration

The next phase focuses on:

1. operator usability
2. data import workflow
3. dashboard transparency
4. assignment completeness

---

# Completed

## Foundation

- [x] Domain model design
- [x] Typed seed data
- [x] Emission calculation utilities
- [x] Formatting utilities
- [x] GHG Scope classification

---

## Layout & UI

- [x] Responsive dashboard layout
- [x] AppShell / Sidebar / Header
- [x] Shared UI components
- [x] Tailwind light & dark mode system

---

## Dashboard Features

- [x] Dashboard summary
- [x] KPI cards
- [x] Domain explanation section
- [x] Emissions overview section
- [x] Activity verification table

---

## Operator Workflow

- [x] Activity input form
- [x] Validation UX
- [x] Recalculation flow
- [x] KRDS-inspired DateInput
- [x] Missing factor handling

---

## Database

- [x] Prisma setup
- [x] SQLite integration
- [x] Versioned emission factor schema
- [x] Repository + Service architecture
- [x] Active emission factor overview

---

# Current Tasks

## Step 10 — ActivityTable Improvements

Priority: High

- [ ] Add activity type filtering
- [ ] Add GHG Scope filtering
- [ ] Add sorting by:
  - date
  - calculated emissions
  - activity type

- [ ] Improve mobile table usability
- [ ] Improve empty state UX

---

## Step 11 — Excel Upload Interface

Priority: High

Goal:
Allow operators to upload the provided Excel file without manual preprocessing.

Tasks:

- [ ] Add upload button
- [ ] Add upload panel/modal
- [ ] Add drag & drop support (optional)
- [ ] Validate file type
- [ ] Add upload state UI
- [ ] Add import progress/error state

---

## Step 12 — Excel Parsing & Database Import

Priority: High

Goal:
Parse uploaded Excel data and store it into the database.

Tasks:

- [ ] Parse Excel sheets
- [ ] Map Excel columns to domain structure
- [ ] Insert ActivityRecord rows
- [ ] Insert EmissionFactor rows
- [ ] Handle duplicate imports safely
- [ ] Handle invalid rows gracefully

Important:
Activity data and emission factors must remain separated.

---

## Step 13 — Imported Data Recalculation

Priority: High

Goal:
Use imported DB data as the dashboard source.

Tasks:

- [ ] Recalculate dashboard from DB data
- [ ] Refresh KPI cards
- [ ] Refresh overview sections
- [ ] Refresh ActivityTable
- [ ] Refresh emission factor overview

---

# Important Constraints

- Keep business logic outside React components
- Keep calculation utilities pure
- Avoid `any`
- Keep dashboard operator-friendly
- Maintain dark mode compatibility
- Do not over-engineer
- Prefer explicit domain naming

---

# Notes

The assignment emphasizes:

- PCF domain understanding
- calculation transparency
- emission factor versioning
- SaaS dashboard UX
- maintainable architecture

The implementation should feel like a scalable internal carbon accounting platform rather than a static frontend demo.
