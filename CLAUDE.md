# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
MkSaaS Blog & AI Playground with PPT Template Management - A full-stack Next.js application combining a multi-language blog, AI demos, and a PowerPoint template marketplace with an admin dashboard.

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

### Core Features
- **App Router**: Next.js 15 with locales (`src/app/[locale]`), marketing pages (home/blog/about/contact/roadmap/changelog/waitlist), AI demos (`/ai/text`, `/ai/image`, `/ai/chat`, placeholder `/ai/video`, `/ai/audio`), auth flows, dashboard/settings, admin users table.
- **PPT Management System**: PowerPoint template marketplace with marketing pages (`/ppt`, `/ppt/[id]`, `/ppt/categories`, `/ppt/category/[name]`) and admin dashboard (`/admin/ppt`, `/admin/stats`) for template management, statistics, and user administration.
- **UI Components**: Radix/Tailwind primitives in `src/components/ui/`, animation helpers (`magicui/`, `tailark/`), data-table system, marketing blocks, admin/users, pricing + checkout buttons, home/blog sections, email layout components, PPT cards and search components.
- **AI Stack**:
  - Chat UI/route uses `ai` SDK with optional Perplexity when `webSearch` is true
  - Image playground calls `app/api/generate-images` with provider config in `src/ai/image/lib/provider-config.ts`
  - Web content analyzer scrapes via Firecrawl then summarizes with ai-sdk providers (`app/api/analyze-content`)

### Data Layer
- **Drizzle ORM** schema in `src/db/schema.ts`:
  - Auth tables: `user`, `session`, `account`, `verification`
  - Payment tables: `payment`, `user_credit`, `credit_transaction`
  - PPT table: `ppt` (id, title, category, author, description, slidesCount, fileSize, fileUrl, previewUrl, downloads, views, status, uploadedAt, createdAt, updatedAt)
- Safe actions in `src/actions` using `lib/safe-action`:
  - User actions: `src/actions/user/`
  - Admin actions: `src/actions/admin/`
  - PPT actions: `src/actions/ppt/` (CRUD operations for PPT templates)
  - PPT stats: `src/actions/ppt/stats.ts` (dashboard statistics)

### Auth & Security
- Better Auth in `src/lib/auth.ts` with admin plugin, email verification, optional newsletter auto-subscribe, and locale-aware emails.
- Role-based access control for admin features
- Protected routes under `src/app/[locale]/(protected)/`

### Payments & Credits
- Stripe checkout/portal actions; plans in `src/config/price-config.tsx` and flags in `src/config/website.tsx`.
- Credits helpers in `src/credits/*`; `websiteConfig.credits.enableCredits` is false by default.
- Support for subscription (monthly/yearly), one-time (lifetime), and credit packages.

### Storage & Media
- S3-compatible provider in `src/storage` powering upload API with size/type validation
- Settings in `src/storage/config/storage-config.ts` and `websiteConfig.storage`
- Used for PPT file uploads and preview images

### Content & Internationalization
- MDX blog/docs in `content/`, categories/authors there; translations in `messages/*.json`.
- Docs search endpoint uses Fumadocs + Orama with a Mandarin tokenizer (`app/api/search`).
- Default locale: English (`en`), also supports Chinese (`zh`).
- next-intl for internationalization throughout the app.

### Ads System
- **Components** in `src/components/ppt/ads/`:
  - `display-ad.tsx` - Display advertising component
  - `native-ad-card.tsx` - Native ad card for in-feed ads
  - `rewarded-video-ad.tsx` - Rewarded video ad implementation
- **Hooks** in `src/hooks/ads/`:
  - `use-rewarded-video.ts` - Hook for managing rewarded video ads

### Config
Site-level toggles and metadata in `src/config/website.tsx`; nav/footer/social/pricing/credits configs in `src/config/*.tsx`.

## API Routes
Key API endpoints under `src/app/api`:
- `/api/chat` - AI chat with optional web search
- `/api/generate-images` - Image generation with multiple providers
- `/api/analyze-content` - Web content analyzer using Firecrawl
- `/api/search` - Docs search with Orama
- `/api/distribute-credits` - Credit distribution endpoint
- `/api/ping` - Health check endpoint
- `/api/storage/upload` - File upload endpoint for S3-compatible storage
- `/api/webhooks/stripe` - Stripe webhook handler

## Routes & UI Structure

### Marketing Routes (`src/app/[locale]/(marketing)/`)
- **Home**: Landing page with hero, features, pricing, blog highlights
- **Blog**: `/blog`, `/blog/[...slug]`, `/blog/category/[slug]`, `/blog/page/[page]`
- **PPT Templates**:
  - `/ppt` - PPT template listing with search and filters
  - `/ppt/[id]` - Individual PPT template detail page
  - `/ppt/categories` - Category overview
  - `/ppt/category/[name]` - Templates filtered by category
- **Pages**: `/about`, `/contact`, `/pricing`, `/roadmap`, `/changelog`, `/waitlist`
- **AI Demos**: `/ai/text`, `/ai/image`, `/ai/chat`, `/ai/video` (placeholder), `/ai/audio` (placeholder)

### Protected Routes (`src/app/[locale]/(protected)/`)
- **Dashboard**: `/dashboard` - User dashboard overview
- **Settings**:
  - `/settings/profile` - Profile management
  - `/settings/billing` - Stripe billing management
  - `/settings/credits` - Credit balance and history
  - `/settings/security` - Password and security settings
  - `/settings/notifications` - Notification preferences
- **Admin** (admin role required):
  - `/admin/users` - User management with data table
  - `/admin/ppt/list` - PPT template list management
  - `/admin/ppt/list/[id]/edit` - Edit PPT template
  - `/admin/stats` - Dashboard statistics and analytics
  - `/admin/settings` - Admin settings
- **Payment**: `/payment` - Payment completion flow

### Auth Routes (`src/app/[locale]/auth/`)
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset form
- `/auth/error` - Auth error page

## Directory Structure
- `src/app/` - Next.js app router pages and layouts
- `src/components/` - Reusable React components
  - `ui/` - Base UI components (Radix primitives)
  - `magicui/`, `tailark/`, `animate-ui/`, `diceui/` - Animation and special effect components
  - `ppt/` - PPT-specific components (cards, search, filters, ads, download flow)
  - `admin/` - Admin dashboard components
  - `auth/` - Authentication components
  - `blog/` - Blog-specific components
  - `home/` - Landing page components
  - `layout/` - Layout components (headers, footers, navigation)
  - `data-table/` - Data table system for admin pages
- `src/lib/` - Utility functions and shared code
  - `ppt/` - PPT-related utilities and helpers
  - `constants/` - Application constants
  - `docs/` - Documentation utilities
  - `mock-data/` - Mock data for development
  - `types/` - Shared type definitions
  - `urls/` - URL helpers
- `src/db/` - Database schema and migrations using Drizzle ORM
- `src/stores/` - Zustand state management
- `src/actions/` - Server actions
  - `user/` - User-related actions
  - `admin/` - Admin-specific actions
  - `ppt/` - PPT CRUD and stats actions
- `src/hooks/` - Custom React hooks
  - `ppt/` - PPT-related hooks (use-create-ppt, use-update-ppt, use-delete-ppt, use-get-ppts, use-get-ppt)
  - `admin/` - Admin hooks (use-ban-user, use-adjust-credits, use-get-dashboard-stats)
  - `user/` - User hooks (use-get-user, use-update-user, use-update-settings)
  - `ads/` - Ad-related hooks (use-rewarded-video)
- `src/types/` - TypeScript type definitions
- `src/schemas/` - Zod validation schemas
- `src/i18n/` - Internationalization setup (next-intl)
- `src/mail/` - Email templates (React Email) and mail functionality
  - `templates/` - Email template components
  - `provider/` - Email service provider integration
- `src/newsletter/` - Newsletter functionality
  - `provider/` - Newsletter provider integration (Resend)
- `src/payment/` - Stripe payment integration
  - `provider/` - Payment provider implementation
- `src/analytics/` - Analytics and tracking
- `src/storage/` - S3-compatible file storage integration
  - `config/` - Storage configuration
  - `provider/` - Storage provider implementation
- `src/notification/` - Discord/Feishu notification handlers
- `src/credits/` - Credit system helpers
- `src/ai/` - AI-related code
  - `chat/` - Chat functionality
  - `image/` - Image generation
  - `text/` - Text analysis
- `src/assets/` - Static assets (fonts, etc.)
- `src/styles/` - Global styles
- `content/` - MDX content files (blog, docs)
- `messages/` - Translation files (en.json, zh.json)
- `public/` - Static public files
- `scripts/` - Utility scripts
- `e2e/` - Playwright E2E tests
- `docs/` - Project documentation
- `分析过程/`, `微信开发/`, `广告-博文/` - Development analysis and documentation (Chinese)

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
- **Animations**: Motion (Framer Motion), various custom animation libraries
- **Data Fetching**: TanStack Query (React Query)
- **URL State**: nuqs for URL-based state management

## Testing & QA
- No automated unit suite; rely on `pnpm lint`, manual flows for auth/billing/AI/PPT.
- Playwright screenshots: `pnpm exec playwright test e2e/screenshots.spec.ts`.
- Keep server/client boundaries clean; prefer `safe-action` for mutations and add minimal zod validation when touching inputs.

## Development Workflow
1. Use TypeScript for all new code
2. Follow Biome formatting rules (configured in `biome.json`)
3. Write server actions in `src/actions/` using `next-safe-action`
4. Use Zustand for client-side state management
5. Use TanStack Query for server state (see hooks pattern in `src/hooks/`)
6. Implement database changes through Drizzle migrations (`pnpm db:generate` then `pnpm db:migrate`)
7. Use Radix UI components for consistent UI
8. Follow the established directory structure
9. Update content collections when adding new content (`pnpm content`)
10. Use environment variables from `env.example`
11. For PPT features, follow the existing patterns in `src/actions/ppt/`, `src/hooks/ppt/`, and `src/components/ppt/`

## PPT Management System

### Key Features
- **Template Listing**: Browse PPT templates with search, filters, and category navigation
- **Template Details**: View individual template information, preview, and download
- **Admin Dashboard**: Manage templates, view statistics, and moderate content
- **Download Flow**: Authenticated download system with optional ad rewards
- **Statistics**: Track downloads, views, and template performance

### PPT Components
- **Marketing Components** (`src/components/ppt/`):
  - `ppt-card.tsx` - Template card for listing pages
  - `search-filters.tsx` - Search and filter controls
  - `search-sidebar.tsx` - Sidebar filters for template browsing
  - `navigation-header.tsx` - Navigation header for PPT pages
- **Download Flow** (`src/components/ppt/download/`):
  - Download modals and flow components
- **Ads** (`src/components/ppt/ads/`):
  - Display ads, native ads, rewarded video ads
- **Auth** (`src/components/ppt/auth/`):
  - Login/signup modals for download flow
- **Admin** (`src/components/ppt/admin/`):
  - Admin-specific PPT management components

### PPT Hooks Pattern
All PPT hooks use TanStack Query for data fetching and mutations:
- `use-get-ppts.ts` - Fetch PPT list with filters and pagination
- `use-get-ppt.ts` - Fetch single PPT template
- `use-create-ppt.ts` - Create new PPT template (admin)
- `use-update-ppt.ts` - Update PPT template (admin)
- `use-delete-ppt.ts` - Delete PPT template (admin)
- `use-get-dashboard-stats.ts` - Fetch dashboard statistics (admin)

### PPT Actions
Server actions in `src/actions/ppt/`:
- `ppt.ts` - CRUD operations for PPT templates
- `stats.ts` - Statistical queries for admin dashboard
- `user.ts` - User-specific PPT actions

### Database Schema
PPT table includes:
- Basic info: id, title, category, author, description
- Metadata: slidesCount, fileSize, fileUrl, previewUrl
- Metrics: downloads, views
- Status: status (draft/published), uploadedAt, createdAt, updatedAt
- Indexes on: category, status, createdAt, downloads

## Important Notes

### Feature Flags
Honor toggles in `websiteConfig` (e.g., docs enable, credits enable, analytics toggles). Check `websiteConfig.metadata.images` and `next.config.ts` when modifying assets.

### Emails/Newsletter
Templates in `src/mail/templates` and `src/newsletter/provider/resend.ts`; consider Resend rate limits noted in `lib/auth.ts`.

### Payments/Credits
Update Drizzle migrations alongside schema changes and sync price IDs in env + `src/config/price-config.tsx`/`credits-config.tsx`.

### Internationalization
- Default locale is English (`en`), also supports Chinese (`zh`)
- Translations in `messages/*.json`
- Use next-intl's `useTranslations` hook for all user-facing text
- PPT features support full i18n

### Image Optimization
Disabled by default (`unoptimized: true` in next.config.ts) to avoid Vercel limits.

### Docker
Set `DOCKER_BUILD=true` for standalone output.

### Safe Actions
Use `next-safe-action` from `src/lib/safe-action.ts` for all server mutations. All PPT actions follow this pattern.

### Content Management
Run `pnpm content` after modifying MDX files to regenerate Fumadocs metadata.

### State Management Patterns
- **Server State**: Use TanStack Query (React Query) via custom hooks
- **Client State**: Use Zustand stores in `src/stores/`
- **URL State**: Use nuqs for URL-based state (filters, pagination, etc.)
- **Form State**: Use React Hook Form with Zod validation

### Admin Access
- Admin routes are protected by role-based middleware
- Admin users have access to `/admin/*` routes
- User management includes ban/unban functionality with reason tracking
- Credit adjustment functionality for admin users

### File Upload & Storage
- All file uploads go through `/api/storage/upload`
- S3-compatible storage configured via environment variables
- PPT files and preview images stored in configured bucket
- File size and type validation handled server-side

### Migration Notes
The PPT management system was migrated from a v0 prototype. When working with PPT features:
1. All components use `@/` imports, not relative paths
2. Mock data has been removed; use real server actions
3. Layout components integrate with the main app layout system
4. I18n is fully integrated; avoid hardcoded strings
5. Follow the established data-table pattern for list views

## Common Patterns

### Adding a New PPT Feature
1. Define schema in `src/schemas/` (if needed)
2. Create server action in `src/actions/ppt/`
3. Create custom hook in `src/hooks/ppt/` using TanStack Query
4. Create UI components in `src/components/ppt/`
5. Add route in `src/app/[locale]/(marketing)/ppt/` or `src/app/[locale]/(protected)/admin/ppt/`
6. Add translations to `messages/en.json` and `messages/zh.json`

### Adding a New Admin Feature
1. Create protected route under `src/app/[locale]/(protected)/admin/`
2. Use data-table system for list views (see existing admin pages)
3. Implement server actions with proper authorization checks
4. Add role-based access control in layout or middleware
5. Follow the page client + hook pattern for state management

### Working with Translations
1. Add keys to both `messages/en.json` and `messages/zh.json`
2. Use `useTranslations()` hook in components
3. For server components, use `getTranslations()` from next-intl
4. Maintain consistent key structure across locale files

## Additional Documentation
- Project migration tasks: `迁移目标任务.md` (Chinese)
- Agent workflows: `AGENTS.md`
- README: `README.md`
- Docs folder: `docs/` contains detailed guides and specifications
