<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Additional Recommended Rules

## Architecture Rules

- Prefer domain-first architecture over UI-first implementation.
- React components should consume already-calculated data.
- Do not calculate emissions directly inside React components.
- Keep business logic inside `features/emissions/*`.
- Keep formatting logic separated from calculation logic.

## Seed Data Rules

- Do not modify seed activity data unless explicitly required.
- Do not duplicate emission factor values inside activity records.
- Treat seed data as immutable demo source data.

## Calculation Rules

- All calculations must internally use `kgCO2e`.
- `tCO2e` should only be used for formatted display values.
- Invalid calculation rows must be represented explicitly.
- Missing emission factors must never fail silently.
- Aggregation functions should ignore invalid rows unless otherwise required.

## TypeScript Rules

- Prefer explicit return types for exported functions.
- Prefer discriminated or explicit domain types over generic objects.
- Avoid deeply nested anonymous object types when reusable domain types are possible.

## Tailwind / Styling Rules

- Use Tailwind utility classes only.
- Prefer reusable UI primitives for repeated card or badge styles.
- Keep dark mode compatibility using `dark:` variants.
- Avoid hardcoded colors that break dark mode readability.
- Use orange accent colors consistently for:
  - active navigation
  - KPI highlights
  - badges
  - status indicators
  - important metrics

## Responsive Layout Rules

- Mobile-first responsive design.
- Dashboard grids should collapse naturally on smaller screens.
- Tables should support horizontal scrolling on mobile.
- Sidebar should not block usability on tablet/mobile layouts.

## Naming Rules

Prefer explicit domain names such as:

- `CalculatedEmissionRow`
- `EmissionSummary`
- `ScopeEmissionSummary`
- `MonthlyEmissionSummary`

Avoid vague names such as:

- `Data`
- `Info`
- `Result`
- `Item`

## Comment Rules

- Add comments only when explaining domain decisions or architectural intent.
- Avoid obvious implementation comments.
- Keep comments concise and professional.

## Assignment Intent

This assignment is intended to demonstrate:

- PCF domain understanding
- clean frontend architecture
- SaaS dashboard UX thinking
- maintainable calculation flow
- operator-friendly data transparency

The implementation should feel like a scalable internal carbon accounting platform, not a static demo page.

When uncertain, prioritize:

1. domain clarity
2. maintainability
3. explicit data flow
4. type safety
5. operator readability
   over visual complexity.
