# PPTHub Blog & AI Playground

Personal site and AI demos built on the PPTHub stack: multi-language blog, auth/billing, newsletter, and AI playground (chat, image generation, web content analyzer).

## Highlights
- Next.js 15 App Router (React 19, TypeScript strict) with next-intl (en, zh) and Tailwind/Radix-based UI.
- Better Auth with email verification, social login, admin banning, and locale-aware emails.
- Stripe Checkout/Portal for free/pro/lifetime plans; credits ledger available (disabled by default via `websiteConfig`).
- AI features: chat via ai-sdk (optional Perplexity search), multi-provider image generation (OpenAI, Fireworks, Replicate, Fal), and a Firecrawl-powered web content analyzer.
- MDX-driven blog/docs content with Fumadocs search; Resend-powered newsletter and email templates.
- S3-compatible storage uploads, optional analytics adapters, and Cloudflare-ready build scripts.

## Tech Stack
- App: Next.js 15, React 19, TypeScript, TailwindCSS + Radix primitives, motion helpers in `src/components/magicui` and `src/components/tailark`.
- Data: PostgreSQL with Drizzle ORM; ai-sdk; next-intl; better-auth; Stripe SDK; Resend; S3 client; Zod for validation; Biome for lint/format.

## Project Structure
- `src/app`: Locale-aware routes for marketing (home/blog/about/contact/roadmap/changelog/waitlist), AI pages (`/ai/*`), auth flows, dashboard/settings, admin users, and API routes (chat, generate-images, analyze-content, storage upload, search, Stripe webhook, credit distribution, ping).
- `src/components`: UI primitives (`ui/`), animations (`magicui/`, `tailark/`), data-table system, marketing blocks, admin/users, pricing + checkout, home/blog sections, email components.
- `src/ai`: Chat/image/text analyzers and provider configs.
- `src/lib`: Auth wiring, metadata, price/plan helpers, safe-action client, constants, premium access, captcha helpers.
- `src/actions`: Server actions for payments, credits, newsletter, captcha validation, user admin, payment completion, etc.
- `src/db`: Drizzle schema + migrations. `drizzle.config.ts` defines DB connection.
- `src/config`: Site toggles, price/credits/nav/footer/social configs. Storage, analytics, mail, newsletter, payment modules live under `src/*` peers.
- Content and docs live in `content/`; translations in `messages/`; additional specs/diagrams in `docs/`; static assets in `public/`; scripts in `scripts/`; Playwright spec in `e2e/`.

## Getting Started
1) Install pnpm deps: `pnpm install`.
2) Copy `env.example` to `.env.local` and fill required keys:
   - Core: `NEXT_PUBLIC_BASE_URL`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_DEMO_WEBSITE` (optional).
   - Auth/OAuth: `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`.
   - Email/Newsletter: `RESEND_API_KEY` (and from/reply addresses in `src/config/website.tsx`).
   - Storage: `STORAGE_REGION`, `STORAGE_BUCKET_NAME`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_ENDPOINT`, `STORAGE_PUBLIC_URL`.
   - Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs for plans/credit packages.
   - AI: `OPENAI_API_KEY`, `FIREWORKS_API_KEY`, `REPLICATE_API_TOKEN`, `FAL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `FIRECRAWL_API_KEY` (for web analyzer).
   - Extras: analytics IDs, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_CRISP_WEBSITE_ID`, affiliate IDs if used.
3) Run the app: `pnpm dev` (http://localhost:3005).
4) Optional: `pnpm content` to refresh MDX metadata; `pnpm email` to preview email templates on port 3333.

## Scripts
- Dev/build: `pnpm dev`, `pnpm build`, `pnpm start`.
- Quality: `pnpm lint` (Biome check/write), `pnpm format`.
- Database: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`.
- Tooling: `pnpm content`, `pnpm email`, `pnpm knip`, `pnpm list-users`, `pnpm list-contacts`.
- Cloudflare (opennext): `pnpm preview`, `pnpm deploy`, `pnpm upload`.
- E2E: `pnpm exec playwright test e2e/screenshots.spec.ts` (set `TEST_EMAIL`/`TEST_PASSWORD` for auth flows).

## Core Workflows
- Auth & Users: Better Auth configured in `src/lib/auth.ts` with email verification, social providers, and admin banning. Admin users table lives at `/admin/users` using `src/actions/get-users.ts` and the data-table system.
- Billing & Credits: Stripe checkout/portal actions in `src/actions` with plans defined in `src/config/price-config.tsx`. Credits ledger in `src/credits/*` and tables `user_credit`/`credit_transaction` (toggle via `websiteConfig.credits.enableCredits`).
- AI Demos: `/ai/chat` streams via `app/api/chat`; `/ai/image` calls `app/api/generate-images` (providers in `src/ai/image/lib/provider-config.ts`); `/ai/text` uses Firecrawl scraping + ai-sdk summarization via `app/api/analyze-content`. Video/audio pages are placeholders.
- Content/Docs: Blog posts, categories, authors in `content/blog` and `content/category` with translations in `messages/en.json` and `messages/zh.json`. Docs and search endpoint live in `content/docs` and `app/api/search` (Fumadocs + Orama with Mandarin tokenizer).
- Storage: S3-compatible uploads handled by `app/api/storage/upload` and `src/storage/provider/s3.ts`, limited to common image types and `MAX_FILE_SIZE` from `src/lib/constants.ts`.
- Newsletter/Email: Resend provider in `src/newsletter/provider/resend.ts` and email templates in `src/mail/templates`.
- Analytics: Adapters for Google, Umami, OpenPanel, Plausible, Ahrefs, Seline, DataFast, PostHog, Clarity in `src/analytics` (enable via env + `src/config/website.tsx`).

## Testing & QA
- Run `pnpm lint` before PRs. Manual QA for auth, billing, AI flows. Playwright screenshot spec available in `e2e/` when UI coverage is needed.

## Resources
- Repo working notes: `AGENTS.md`, `CLAUDE.md`.
- Contributor docs: `docs/README.md` and the guides under `docs/0-快速开始/`.
- License: see `LICENSE`.
