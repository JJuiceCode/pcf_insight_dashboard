<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Rules - 과제.1

## Project Context

This project is a frontend hiring assignment for HanaLoop.

The goal is to build a Product Carbon Footprint dashboard for the CT-045 Computer Monitor.

The dashboard should help executives and operators understand:

- total PCF
- GHG Scope classification
- activity-based emissions
- emission factor application
- monthly and category-level emission insights

## Domain Rules

- PCF means Product Carbon Footprint.
- All emissions are calculated in kgCO2e.
- 1 tCO2e = 1,000 kgCO2e.
- Emissions are calculated as: activity amount × emission factor.
- Activity records and emission factors must be modeled separately.
- Emission factors should include versioning fields such as version and effectiveFrom.

## GHG Scope Mapping

- electricity / 한국전력 = Scope 2
- material / 플라스틱 1, 플라스틱 2 = Scope 3
- transport / 트럭 = Scope 3
- Scope 1 has no provided activity data and should be represented as 0.
- Do not invent Scope 1 activity records.

## Technical Rules

- Use Next.js App Router.
- Use TypeScript.
- Use Tailwind CSS.
- Do not use MUI, Ant Design, or other heavy component libraries.
- Avoid unnecessary dependencies.
- Keep calculation logic outside React components.
- Avoid `any`.
- Use strict, meaningful domain types.

## UI Rules

- The UI should feel like a modern SaaS analytics dashboard.
- The layout must be responsive.
- Support light and dark mode using Tailwind CSS.
- Use orange as the main accent color.
- Tables must be horizontally scrollable on small screens.
- KPI values must come from calculation utilities, not hardcoded numbers.
- All user-facing UI text, labels, helper messages, and placeholder content should be written in Korean.

## Code Organization

Prefer clear separation:

- `features/emissions/types.ts`
- `features/emissions/seed.ts`
- `features/emissions/calculations.ts`
- `features/emissions/formatters.ts`
- `components/dashboard/*`
- `components/layout/*`
- `components/ui/*`

## Important

When making changes:

- Keep components small and readable.
- Keep domain logic testable.
- Do not silently ignore missing emission factors.
- Explain assumptions in code comments only when they are domain-related.
