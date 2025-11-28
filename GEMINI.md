# Gemini Context: MkSaaS AI & PPT Platform

This file provides essential context and guidelines for Gemini when working on the MkSaaS AI & PPT Platform project.

## 1. Project Overview
**MkSaaS** is a comprehensive full-stack application built with Next.js 15. It combines:
- **Multi-language Blog & Docs**: MDX-driven content with Fumadocs.
- **AI Playground**: Chat (OpenAI/Perplexity), Image Generation (Fal/Fireworks/Replicate), and Web Analysis (Firecrawl).
- **PPT Template Marketplace**: A fully functional PowerPoint template marketplace with admin management, user downloads, and ads integration.
- **SaaS Features**: Authentication (Better Auth), Payments (Stripe), and Credits system.

## 2. Tech Stack & Key Libraries
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript.
- **Styling**: Tailwind CSS v4, Radix UI primitives, Shadcn UI components.
- **Database**: PostgreSQL with Drizzle ORM.
- **Auth**: Better Auth (Email/Social, Admin plugin).
- **State**: Zustand (Client), TanStack Query (Server/Hooks), Nuqs (URL state).
- **Validation**: Zod + React Hook Form.
- **AI**: Vercel AI SDK (`ai`).
- **I18n**: `next-intl` (Supports English `en` and Chinese `zh`).
- **Linting/Formatting**: Biome.

## 3. Operational Commands
Always use `pnpm` for package management.

| Action | Command | Description |
|--------|---------|-------------|
| **Dev Server** | `pnpm dev` | Starts server on port 3005. |
| **Build** | `pnpm build` | Production build. |
| **Lint & Format** | `pnpm lint` | Runs Biome check and write. **Run this before finalizing changes.** |
| **Database Gen** | `pnpm db:generate` | Generate SQL migrations from schema. |
| **Database Migrate** | `pnpm db:migrate` | Apply migrations to the DB. |
| **Content Refresh** | `pnpm content` | Regenerate Fumadocs MDX indices. Run after editing `content/`. |
| **Email Preview** | `pnpm email` | Starts email preview server on port 3333. |
| **E2E Tests** | `pnpm exec playwright test` | Run Playwright tests (see `e2e/`). |

## 4. Architecture & Development Patterns

### Server Actions & Data Fetching
- **Mutations**: Use Server Actions located in `src/actions/`.
    - **Strict Rule**: All actions must use `actionClient` from `src/lib/safe-action.ts` for type safety and error handling.
- **Queries**:
    - Client-side: Use custom hooks (e.g., `src/hooks/ppt/use-get-ppts.ts`) wrapping TanStack Query.
    - Server-side (RSC): Direct DB calls via Drizzle.

### PPT Management System (Core Feature)
The project includes a sophisticated PPT marketplace.
- **Components**: Located in `src/components/ppt/` (Cards, Search, Ads, Download Flow).
- **Admin**: `src/app/[locale]/(protected)/admin/ppt/`.
- **Hooks Pattern**: Follow the pattern in `src/hooks/ppt/` for all data interactions.
- **Schema**: Defined in `src/db/schema.ts` (table `ppt`).

### Internationalization (i18n)
- Content is served via `[locale]` routes.
- **Strings**: Stored in `messages/en.json` and `messages/zh.json`.
- **Usage**:
    - Components: `const t = useTranslations('Namespace');`
    - Server: `const t = await getTranslations('Namespace');`

### File Structure
- `src/app`: App Router (marketing, protected, auth, api).
- `src/components/ui`: Shadcn/Radix primitives.
- `src/components/ppt`: PPT-specific feature components.
- `src/lib`: Shared utilities (Auth, DB connection, Safe Action client).
- `src/db`: Drizzle schema and migrations.
- `content`: MDX files for Blog and Docs.

## 5. Gemini Workflow Guidelines
1.  **Conventions**: Adhere strictly to Biome formatting. If you modify code, run `pnpm lint` to ensure compliance.
2.  **Environment**: Check `env.example` for required keys (Stripe, AI Keys, DB URL).
3.  **New Features**:
    - When adding UI, look for existing Shadcn components in `src/components/ui` first.
    - When adding DB tables, update `src/db/schema.ts` and suggest running `pnpm db:generate`.
4.  **Documentation**: If you modify `content/*.mdx`, remind the user to run `pnpm content`.
5.  **Language**: The codebase uses English for comments/variables, but supports Chinese content. Documentation in the root (`/`) is mixed.

## 6. Key Configuration Files
- `next.config.ts`: Next.js config.
- `drizzle.config.ts`: Database connection settings.
- `biome.json`: Linting rules.
- `src/config/website.tsx`: Global site configuration (toggles for features like credits, docs).
