# mk-saas Integration Guide (v1.1 – Detailed Rules)

Use this document as a v0 “Sources” file so the generator fully understands the target environment. This v1.1 version extends the basic rules with stricter conventions (naming, commenting, testing, etc.).

---

## 1. Tech Stack & Global Assumptions

1. Next.js App Router + TypeScript + TailwindCSS; no legacy Pages Router.
2. Folder roots must be `app/`, `components/`, `hooks/`, `lib/`, `styles/`, `tests/`.
3. TSConfig: strict mode enabled; target ES2022.
4. No custom `<html>` or `<body>` wrappers; mk-saas owns global layout, theme, analytics, fonts.

---

### Reference Structure for v0 Output
```
app/
  page.tsx
  metadata.ts (optional generateMetadata helper)
components/
  feature-page.tsx
  common/
    empty-state.tsx
    sidebar.tsx
hooks/
  use-feature-records.ts
  use-current-user.ts
lib/
  api.ts
  texts.ts
  types.ts
  utils.ts
styles/
  globals.css (scoped styles only)
tests/
  feature/feature-page.test.tsx
  feature/feature-page.spec.ts (optional Playwright)
```
- `app/page.tsx` renders `<FeaturePage />` and nothing else.
- Domain-specific components live under `components/` with optional subfolders.
- Hooks and API modules mirror the shape mk-saas expects in `src/features/<feature>`.
- Test files mirror component names to ease migration and automation.

---

## 2. File Naming & Comment Rules

1. **Files**
   - Components: `kebab-case`. Example: `components/feature-page.tsx` or `components/dashboard/cards/customer-card.tsx`.
   - Hooks: always `hooks/use-*.ts`.
   - Utilities: `lib/*.ts` with descriptive names (`lib/price-utils.ts`).
   - Tests: `tests/<feature>/<component>.test.tsx` for React Testing Library, or `tests/<feature>/<page>.spec.ts` for Playwright/E2E.
2. **Components**
   - Export default components in PascalCase (e.g., `export default function FeaturePage()`).
   - Each file may export one default component plus any supporting utility components.
3. **Comments**
   - Use English comments with optional Chinese translations if needed. Keep comments topical (what/why), not step-by-step instructions.
   - Prefix TODOs with `TODO(author):`.

---

## 3. Page & Layout Responsibilities

1. `app/page.tsx` must be lightweight:
   ```tsx
   import FeaturePage from '@/components/feature-page';

   export default function Page() {
     return <FeaturePage />;
   }
   ```
   No other logic allowed.
2. All metadata must be defined via `generateMetadata` in the page file (if needed).
3. Never introduce additional layouts; mk-saas will wrap the page within `[locale]` layout.

---

## 4. Routing & Link Usage

1. Import routes from `@/routes`. Do not hardcode `/pricing`, `/dashboard`, etc.
2. For dynamic segments, prefer helper functions:
   ```ts
   Routes.featureDetail(id)
   ```
   (Wrap this utility in `routes.ts` when needed.)
3. Use `<Link href={Routes.Pricing}>…</Link>` or `router.push(Routes.Dashboard)`.
4. Separate route groups (marketing/protected) will be handled by mk-saas; do not create custom folders such as `(marketing)` at v0 stage.

---

## 5. Data Access, State & Side Effects

1. All network/data operations (even mocks) must live in `lib/api.ts` or `features/<domain>/api.ts`.
2. API functions return typed Promises (e.g., `Promise<FeatureRecord[]>`), not plain objects.
3. Hooks wrap API functions:
   ```ts
   export function useFeatureRecords(): { data: FeatureRecord[]; isLoading: boolean; error?: Error }
   ```
4. Local UI state (forms, toggles) can use `useState`. Domain state (records/list/analytics) must use hooks.
5. Side effects should use `useEffect` or future React Query integration; avoid `useEffect` with async void directly—wrap in inner function.
6. No direct `fetch`/`axios` calls inside components.
7. If state is derived from multiple sources, provide selectors or derived values via `useMemo`.

---

## 6. Auth & Permissions Convention

1. Use placeholder hooks: `useCurrentUser`, `useRequireAuth`, `usePermission`. They should currently mock results but follow the final shape (e.g., `user.id`, `user.roles`).
2. Auth-only sections must conditionally render or redirect. Example:
   ```tsx
   const { user } = useCurrentUser();
   if (!user) return <EmptyState title="Sign in required" />;
   ```
3. Do not import localStorage or cookies directly; mk-saas handles session.

---

## 7. UI & Styling

1. Tailwind + `cn` helper only. No CSS-in-JS, styled-components, or global CSS beyond `styles/globals.css`.
2. Always use mk-saas compatible UI primitives:
   - `@/components/ui/button`, `card`, `dialog`, `input`, `tabs`, `sidebar`, `table`, `toast`, etc.
   - Props should match shadcn defaults (className, variant, size, etc.).
3. If unique UI is needed, add to `components/common` and keep style tokens consistent (spacing multiples of 4, colors using Tailwind tokens).
4. Do not create new ThemeProviders; rely on existing `data-theme` or class toggles if needed.

---

## 8. Text & Localization

1. All user-facing copy belongs in `lib/texts.ts`:
   ```ts
   export const texts = {
     en: { heroTitle: '...' },
     zh: { heroTitle: '...' },
   };
   ```
2. Components consume via `t(locale, 'heroTitle')` or `useT('feature.heroTitle')`.
3. Avoid hardcoding strings in components, even temporary ones.
4. When dynamic values are needed, use template helpers (e.g., `formatNumber`, `Intl.NumberFormat`).

---

## 9. Testing Expectations

1. Minimum: one React Testing Library smoke test per feature (`tests/<feature>/feature-page.test.tsx`).
2. If there is significant interactivity, include at least one Playwright spec demonstrating primary flow.
3. Test files must mirror component names and live under `tests/`.
4. Use `describe`/`it` naming conventions: `describe('FeaturePage', () => it('renders records list', async () => {...}))`.
5. Use `@testing-library/react` and `@testing-library/user-event`. No Enzyme.

---

## 10. Linting & Formatting

1. ESLint/Biome + Prettier defaults. Follow these:
   - No `any` unless typed as `unknown` then narrowed (add comment `// TODO(author): refine type`).
   - Imports must use `@/` alias; relative `../../../` is forbidden.
   - Keep `console.*` statements guarded with `if (process.env.NODE_ENV !== 'production')`.
2. File size guidelines:
   - Components ≤ 200 lines.
   - Hooks/utilities ≤ 150 lines.
   - Break into subcomponents if exceeding the limit.

---

## 11. Submission Checklist

Before delivering a v0 feature, ensure:

1. `app/page.tsx` imports `components/feature-page.tsx` only.
2. All routes use the enum from `routes.ts`.
3. Data/submit actions routed through `lib/api.ts`.
4. Literal strings moved into `lib/texts.ts`.
5. UI built with mk-saas primitives.
6. Hooks for user/data exist and return standardized shapes.
7. At least one test file added under `tests/`.
8. `README` or `NOTES` includes instructions about feature context, dependencies, mock data assumptions.

---

### Why these rules?

Following this specification ensures any v0-generated feature can be copied into `mk-saas/src/features/<feature>` and rendered via `src/app/[locale]/(v0)/<feature>/page.tsx` with minimal rewrites, while reusing mk-saas data sources, state, i18n, and auth layers. Greenfield rules drastically reduce integration friction.

Version: **v1.1 (Detailed)** — please include this version number when sharing the guide so recipients know they are reading the latest specification.
