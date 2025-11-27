# Repository Guidelines

Working notes for the MkSaaS blog + AI tools codebase. Keep changes small, typed, and production-friendly.

## Quick Orientation
- Stack: Next.js 15 App Router (React 19, TypeScript strict) with pnpm. i18n via next-intl (en, zh). Dev server runs on port 3005.
- Data: PostgreSQL via Drizzle; Better Auth with admin plugin and optional email verification; Stripe Checkout/Portal; credits ledger in `user_credit` + `credit_transaction` (disabled by default in `websiteConfig`).
- Services: Resend for email/newsletter, S3/R2 storage driver, ai-sdk providers (OpenAI, Fireworks, Replicate, Fal, DeepSeek/Gemini/OpenRouter) plus Firecrawl scraping for the web content analyzer.
- Content: MDX blog/docs under `content/`; translations in `messages/`; diagrams and specs in `docs/`; static assets in `public/`.

## Project Structure
- `src/app`: App Router routes (locale-aware), marketing pages, AI demos, auth flows, dashboard/admin, API routes (chat, image/text analysis, storage upload, Stripe webhook, search, credit distribution, ping).
- `src/components`: UI primitives (`ui/`), animations (`magicui/`, `tailark/`), data tables, marketing blocks, admin/users table, home/blog sections, pricing/checkout, email layouts.
- `src/ai`: Chat, image, and web-content analyzer components/utilities; provider config for image models; error handling.
- `src/lib`: Auth wiring, metadata, price/plan helpers, constants, demo flags, safe-action client, URL helpers, formatter, captcha, premium access.
- `src/actions`: Server actions for payments, credits, newsletter, captcha validation, user admin table, etc.
- `src/db`: Drizzle schema and migrations; config in `drizzle.config.ts`.
- `src/config`: Site toggles (pricing, credits, navbar/footer/social), feature flags in `website.tsx`.
- `src/storage`, `src/analytics`, `src/mail`, `src/newsletter`, `src/payment`, `scripts/`, `e2e/` round out infra/tooling.

## Commands
- Install: `pnpm install`; run dev: `pnpm dev` (port 3005). Build/start: `pnpm build && pnpm start`.
- Lint/format: `pnpm lint` (Biome check/write) and `pnpm format`.
- DB: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`.
- Content/email: `pnpm content` to process MDX frontmatter; `pnpm email` for email previews on 3333.
- Cloudflare (opennext): `pnpm preview` / `pnpm deploy` / `pnpm upload`. Utilities: `pnpm list-users`, `pnpm list-contacts`, `pnpm knip`.
- E2E: `pnpm exec playwright test e2e/screenshots.spec.ts` (set `TEST_EMAIL`/`TEST_PASSWORD` when auth is required).

## Style & Patterns
- Biome defaults: 2-space indent, single quotes, trailing commas where allowed. Kebab-case files, PascalCase components, camelCase identifiers; prefer named exports.
- Keep server logic in `src/actions` or `"use server"` modules; avoid client hooks on the server. Use `safe-action` wrappers for validated server actions.
- Co-locate feature assets under their route/domain folder; reuse primitives from `src/components/ui` and keep tailwind tokens consistent.

## Testing & QA
- No dedicated unit test suite today; rely on `pnpm lint`, manual QA around auth/billing/AI flows, and the Playwright screenshot spec when relevant.
- Update or add focused specs alongside features (`*.spec.tsx`/`*.test.tsx`) if you introduce logic-heavy changes; document the run command in PRs.

## Configuration & Secrets
- Copy `env.example` to `.env.local`. Critical vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, Google/GitHub OAuth keys, Resend keys/from email, Stripe secret/webhook IDs plus price IDs, S3/R2 credentials, captcha (Turnstile), analytics IDs, Crisp, and AI keys (`OPENAI_API_KEY`, `FIREWORKS_API_KEY`, `REPLICATE_API_TOKEN`, `FAL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `FIRECRAWL_API_KEY`).
- `NEXT_PUBLIC_BASE_URL` should match the served host; flip `NEXT_PUBLIC_DEMO_WEBSITE` when masking live data. Disable image optimization with `DISABLE_IMAGE_OPTIMIZATION=true` if needed.

## Feature Notes
- Auth: Better Auth with admin plugin, email verification, and optional auto-newsletter opt-in. Cookies carry locale hints for email templates.
- Payments: Stripe Checkout/Portal via actions (`create-checkout-session`, `create-customer-portal-session`); plans defined in `src/config/price-config.tsx` and `websiteConfig`.
- Credits: Ledger helpers in `src/credits/`; opt-in via `websiteConfig.credits.enableCredits` with gift credits on signup and package pricing in `src/config/credits-config.tsx`.
- AI: Chat (`/ai/chat`, API `app/api/chat`), image playground (`/ai/image`, API `app/api/generate-images`), web content analyzer (`/ai/text`, API `app/api/analyze-content` using Firecrawl + AI providers). Video/audio pages are present as placeholders.
- Storage: S3-compatible provider in `src/storage` powering `app/api/storage/upload` with basic size/type checks.
- Content/Docs: Blog and docs are MDX-driven (`content/`); docs search powered by Fumadocs + Orama (Mandarin tokenizer). Translations live in `messages/en.json` and `messages/zh.json`.
