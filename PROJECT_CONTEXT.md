# PROJECT_CONTEXT.md

# Project

HanaLoop Frontend Assignment

Product Carbon Footprint (PCF) Dashboard for:

- Product: Computer Monitor
- Product Code: CT-045

---

# Current Implementation Status

## Completed

### Domain & Calculation Layer

- Product / Activity / EmissionFactor domain model implemented
- Typed seed data created
- Emission calculation utilities implemented
- Formatting utilities implemented
- GHG Scope classification implemented
- Activity → Factor → Calculation → Aggregation flow established

---

### Dashboard Layout & UI

- Responsive AppShell / Sidebar / Header layout implemented
- Shared UI components implemented:
  - Card
  - Badge
  - KpiCard

- Tailwind dark mode foundation implemented
- Orange accent design system applied

---

### Dashboard Features

- Executive summary dashboard implemented
- Domain explanation section implemented
- Emissions overview implemented
- Activity verification table implemented
- Activity input workflow implemented
- Validation and form UX implemented
- Recalculation flow refactored and cleaned

---

### Data Management

- Reusable DateInput component implemented (KRDS-inspired)
- Prisma + SQLite database integrated
- Versioned emission factor model implemented
- EmissionFactor separated from Activity data
- Repository + Service architecture introduced
- Active emission factors displayed in dashboard

---

# Current Architecture

```txt
Activity Data
→ EmissionFactor lookup
→ Emission calculation
→ GHG Scope classification
→ Aggregation
→ Dashboard rendering
```

---

# Folder Structure

```txt
features/emissions/
├─ types.ts
├─ seed.ts
├─ calculations.ts
├─ formatters.ts
├─ repositories/*
├─ services/*

components/
├─ dashboard/*
├─ layout/*
├─ ui/*

prisma/
├─ schema.prisma
├─ seed.ts
```

---

# Important Rules

- Activity data and emission factors must remain separated
- Emission factors use version history
- Avoid business logic inside React components
- Dashboard values should come from calculation utilities
- Avoid `any`
- Use Tailwind dark mode
- Use orange accent consistently

---

# Next Steps

- [x] Add filtering to ActivityTable

- [x] Add sorting to ActivityTable

- [x] Step 10: Excel upload interface

- [x] Step 11-A: Excel parsing + ActivityRecord DB import

- [ ] Step 11-B: Connect Excel upload UI to import API

- [ ] Step 12: Recalculate dashboard from imported DB data
