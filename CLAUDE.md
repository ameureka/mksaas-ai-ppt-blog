# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start
- Install deps: `pnpm install`. Run dev: `pnpm dev` (port 3005). Build/start: `pnpm build && pnpm start`.
- Lint/format: `pnpm lint` (Biome check/write) and `pnpm format`.
- Content/email: `pnpm content` to process MDX frontmatter, `pnpm email` to preview templates on 3333.
- DB: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`.
- Cloudflare (opennext): `pnpm preview` / `pnpm deploy` / `pnpm upload`.
- Utilities: `pnpm list-users`, `pnpm list-contacts`, `pnpm fix-payments`, `pnpm fix-payments-scene`, `pnpm knip`.

## Environment
- Copy `env.example` to `.env.local`. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, Google/GitHub OAuth keys, Stripe secret + webhook + price IDs, Resend key/from email, S3/R2 creds, Turnstile keys, analytics IDs, `NEXT_PUBLIC_BASE_URL`, optional `NEXT_PUBLIC_DEMO_WEBSITE`.
- AI stack needs `OPENAI_API_KEY`, `FIREWORKS_API_KEY`, `REPLICATE_API_TOKEN`, `FAL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, and `FIRECRAWL_API_KEY` for the web content analyzer.
- Dev server runs on port 3005; email preview runs on 3333.

## Architecture & Modules
- **App Router**: Next.js 15 with locales (`src/app/[locale]`), marketing pages (home/blog/about/contact/roadmap/changelog/waitlist), AI demos (`/ai/text`, `/ai/image`, `/ai/chat`, placeholder `/ai/video`, `/ai/audio`), auth flows, dashboard/settings, admin users table.
- **UI Components**: Radix/Tailwind primitives in `src/components/ui/`, animation helpers (`magicui/`, `tailark/`), data-table system, marketing blocks, admin/users, pricing + checkout buttons, home/blog sections, email layout components.
- **AI Stack**:
  - Chat UI/route uses `ai` SDK with optional Perplexity when `webSearch` is true
  - Image playground calls `app/api/generate-images` with provider config in `src/ai/image/lib/provider-config.ts`
  - Web content analyzer scrapes via Firecrawl then summarizes with ai-sdk providers (`app/api/analyze-content`)
- **Data Layer**: Drizzle ORM schema in `src/db/schema.ts` (auth/session/account/verification, payment, user_credit/credit_transaction). Safe actions in `src/actions` using `lib/safe-action`.
- **Auth**: Better Auth in `src/lib/auth.ts` with admin plugin, email verification, optional newsletter auto-subscribe, and locale-aware emails.
- **Payments/Credits**: Stripe checkout/portal actions; plans in `src/config/price-config.tsx` and flags in `src/config/website.tsx`. Credits helpers in `src/credits/*`; `websiteConfig.credits.enableCredits` is false by default.
- **Storage**: S3-compatible provider in `src/storage` powering upload API with size/type validation; settings in `src/storage/config/storage-config.ts` and `websiteConfig.storage`.
- **Content/Docs**: MDX blog/docs in `content/`, categories/authors there; translations in `messages/*.json`. Docs search endpoint uses Fumadocs + Orama with a Mandarin tokenizer (`app/api/search`).
- **Config**: Site-level toggles and metadata in `src/config/website.tsx`; nav/footer/social/pricing/credits configs in `src/config/*.tsx`.

## API Routes
Key API endpoints under `src/app/api`:
- `/api/chat` - AI chat with optional web search
- `/api/generate-images` - Image generation with multiple providers
- `/api/analyze-content` - Web content analyzer using Firecrawl
- `/api/search` - Docs search with Orama
- `/api/distribute-credits` - Credit distribution endpoint
- `/api/ping` - Health check endpoint

## Routes & UI Notes
- Marketing blog under `app/[locale]/(marketing)/blog`; uses MDX content and category pagination. Home hero/blog/newsletter components in `src/components/home`.
- Dashboard/settings under `app/[locale]/(protected)/(settings|dashboard)` handle profile, billing (Stripe), credits, security, notifications.
- Admin users page (`/admin/users`) uses `useUsers` hook + data-table controls to filter/sort with server actions.
- AI marketing pages are client-heavy; keep provider lists in sync with env availability when editing.
- API handlers are colocated under `app/api`; many are thin wrappers around `src/lib` helpers—respect existing validation (zod schemas in actions and utils).

## Directory Structure
- `src/app/` - Next.js app router pages and layouts
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and shared code
- `src/db/` - Database schema and migrations using Drizzle ORM
- `src/stores/` - Zustand state management
- `src/actions/` - Server actions and API routes
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/i18n/` - Internationalization setup (next-intl)
- `src/mail/` - Email templates (React Email) and mail functionality
- `src/payment/` - Stripe payment integration
- `src/analytics/` - Analytics and tracking
- `src/storage/` - S3-compatible file storage integration
- `src/notification/` - Discord/Feishu notification handlers
- `src/credits/` - Credit system helpers
- `content/` - MDX content files (blog, docs)
- `messages/` - Translation files (en.json, zh.json)

## Technology Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Drizzle ORM with PostgreSQL
- **Auth**: Better Auth with admin plugin
- **Payments**: Stripe
- **Email**: React Email + Resend
- **Storage**: S3-compatible (Cloudflare R2)
- **UI**: Radix UI + Tailwind CSS
- **State**: Zustand for client-side state
- **Forms**: React Hook Form + Zod
- **AI**: ai SDK with multiple providers (OpenAI, Fireworks, Replicate, FAL, Google, DeepSeek, OpenRouter)
- **Content**: Fumadocs (MDX)
- **i18n**: next-intl
- **Linting**: Biome

## Testing & QA
- No automated unit suite; rely on `pnpm lint`, manual flows for auth/billing/AI.
- Playwright screenshots: `pnpm exec playwright test e2e/screenshots.spec.ts`.
- Keep server/client boundaries clean; prefer `safe-action` for mutations and add minimal zod validation when touching inputs.

## Development Workflow
1. Use TypeScript for all new code
2. Follow Biome formatting rules (configured in `biome.json`)
3. Write server actions in `src/actions/`
4. Use Zustand for client-side state management
5. Implement database changes through Drizzle migrations (`pnpm db:generate` then `pnpm db:migrate`)
6. Use Radix UI components for consistent UI
7. Follow the established directory structure
8. Update content collections when adding new content (`pnpm content`)
9. Use environment variables from `env.example`

## Important Notes
- **Feature Flags**: Honor toggles in `websiteConfig` (e.g., docs enable, credits enable, analytics toggles). Check `websiteConfig.metadata.images` and `next.config.ts` when modifying assets.
- **Emails/Newsletter**: Templates in `src/mail/templates` and `src/newsletter/provider/resend.ts`; consider Resend rate limits noted in `lib/auth.ts`.
- **Payments/Credits**: Update Drizzle migrations alongside schema changes and sync price IDs in env + `src/config/price-config.tsx`/`credits-config.tsx`.
- **i18n**: Default locale is English (`en`), also supports Chinese (`zh`). Translations in `messages/*.json`.
- **Image Optimization**: Disabled by default (`unoptimized: true` in next.config.ts) to avoid Vercel limits.
- **Docker**: Set `DOCKER_BUILD=true` for standalone output.
- **Safe Actions**: Use `next-safe-action` from `src/lib/safe-action.ts` for all server mutations.
- **Content**: Run `pnpm content` after modifying MDX files to regenerate Fumadocs metadata.
