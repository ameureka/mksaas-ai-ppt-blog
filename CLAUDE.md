# CLAUDE.md

Guidance for Claude Code when editing this repo. Favor small, typed patches and keep env-dependent features in mind.

## Quick Start
- Install deps: `pnpm install`. Run dev: `pnpm dev` (port 3005). Build/start: `pnpm build && pnpm start`.
- Lint/format: `pnpm lint` (Biome check/write) and `pnpm format`.
- Content/email: `pnpm content` to process MDX frontmatter, `pnpm email` to preview templates on 3333.
- DB: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`.
- Cloudflare (opennext): `pnpm preview` / `pnpm deploy` / `pnpm upload`. Utilities: `pnpm list-users`, `pnpm list-contacts`, `pnpm knip`.

## Environment
- Copy `env.example` to `.env.local`. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, Google/GitHub OAuth keys, Stripe secret + webhook + price IDs, Resend key/from email, S3/R2 creds, Turnstile keys, analytics IDs, `NEXT_PUBLIC_BASE_URL`, optional `NEXT_PUBLIC_DEMO_WEBSITE`.
- AI stack needs `OPENAI_API_KEY`, `FIREWORKS_API_KEY`, `REPLICATE_API_TOKEN`, `FAL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, and `FIRECRAWL_API_KEY` for the web content analyzer.

## Architecture & Modules
- App Router with locales (`src/app/[locale]`), marketing pages (home/blog/about/contact/roadmap/changelog/waitlist), AI demos (`/ai/text`, `/ai/image`, `/ai/chat`, placeholder `/ai/video`, `/ai/audio`), auth flows, dashboard/settings, admin users table, and API routes (chat, generate-images, analyze-content, storage upload, search, Stripe webhook, credit distribution, ping).
- UI library in `src/components`: Radix/Tailwind primitives in `ui/`, animation helpers (`magicui/`, `tailark/`), data-table system, marketing blocks, admin/users, pricing + checkout buttons, home/blog sections, email layout components.
- AI: chat UI/route uses `ai` SDK with optional Perplexity when `webSearch` is true; image playground calls `app/api/generate-images` with provider config in `src/ai/image/lib/provider-config.ts`; web content analyzer scrapes via Firecrawl then summarizes with ai-sdk providers (`app/api/analyze-content`).
- Data: Drizzle schema in `src/db/schema.ts` (auth/session/account/verification, payment, user_credit/credit_transaction). Safe actions live in `src/actions` (payments, credits, newsletter, captcha, user admin, payment completion, etc.) using `lib/safe-action`.
- Auth: Better Auth configured in `src/lib/auth.ts` with admin plugin, email verification, optional newsletter auto-subscribe, and locale-aware emails.
- Payments/Credits: Stripe checkout/portal actions; plans in `src/config/price-config.tsx` and flags in `src/config/website.tsx`. Credits helpers in `src/credits/*`; `websiteConfig.credits.enableCredits` is false by default.
- Storage: S3-compatible provider in `src/storage` powering upload API with size/type validation; settings in `src/storage/config/storage-config.ts` and `websiteConfig.storage`.
- Content/Docs: MDX blog/docs in `content/`, categories/authors there; translations in `messages/*.json`. Docs search endpoint uses Fumadocs + Orama with a Mandarin tokenizer (`app/api/search`).
- Config: site-level toggles and metadata in `src/config/website.tsx`; nav/footer/social/pricing/credits configs in `src/config/*.tsx`.

## Routes & UI Notes
- Marketing blog under `app/[locale]/(marketing)/blog`; uses MDX content and category pagination. Home hero/blog/newsletter components live in `src/components/home`.
- Dashboard/settings under `app/[locale]/(protected)/(settings|dashboard)` handle profile, billing (Stripe), credits, security, notifications. Admin users page (`/admin/users`) uses `useUsers` hook + data-table controls to filter/sort with server actions.
- AI marketing pages are client-heavy; keep provider lists in sync with env availability when editing.
- API handlers are colocated under `app/api`; many are thin wrappers around `src/lib` helpers—respect existing validation (zod schemas in actions and utils).

## Testing & QA
- No automated unit suite; rely on `pnpm lint`, manual flows for auth/billing/AI, and Playwright screenshots (`pnpm exec playwright test e2e/screenshots.spec.ts`) when needed.
- Keep server/client boundaries clean; prefer `safe-action` for mutations and add minimal zod validation when touching inputs.

## Tips
- Honor feature flags in `websiteConfig` (e.g., docs enable, credits enable, analytics toggles). Check `websiteConfig.metadata.images` and `next.config.ts` when modifying assets.
- For emails/newsletter, templates live in `src/mail/templates` and `src/newsletter/provider/resend.ts`; consider Resend rate limits noted in `lib/auth.ts`.
- When touching payments/credits, update Drizzle migrations alongside schema changes and sync price IDs in env + `src/config/price-config.tsx`/`credits-config.tsx`.
