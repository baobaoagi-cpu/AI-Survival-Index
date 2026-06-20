# AI Survival Index

AI 時代生存指數 Alpha product workspace.

## Structure

- `AI時代生存指數.dc.html` and related `.dc.html` files: current local Alpha prototype.
- `apps/api`: Hono API for quiz scoring and Supabase persistence.
- `apps/web`: formal frontend shell for future LIFF/PWA migration.
- `packages/shared`: archetype data, quiz scenarios, and scoring engine.
- `supabase`: schema migration and remote bootstrap SQL.
- `assets/archetypes`: locked crest assets.
- `docs/product-advisory-board.md`: product, architecture, UX, analytics, and growth decision rules.

## Local Development

```bash
pnpm install
pnpm supabase:start
pnpm dev:api
node serve-alpha.js
```

Useful local URLs:

- Alpha HTML: `http://127.0.0.1:8765/`
- API health: `http://127.0.0.1:8080/health`
- Supabase Studio: `http://127.0.0.1:55323`

## API Environment

`apps/api` requires server-side Supabase credentials:

```env
PORT=8080
APP_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8765,http://127.0.0.1:8765
SUPABASE_URL=https://zcgsshcowoosunbfsvqp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SESSION_SECRET=replace-with-a-long-random-string
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code, Cloudflare Pages frontend variables, or committed files.

## Admin MVP

Local admin console:

```bash
pnpm dev:api
pnpm dev:admin
```

Default local URL:

- Admin: `http://127.0.0.1:5174/`
- Login: `admin / admin123`

The browser admin app never talks to Supabase directly. It calls `apps/api`
under `/admin/*`, and the API uses server-side Supabase credentials.

Current MVP modules:

- Dashboard
- User list
- Quiz session records
- Question-to-image mapping
- Friend graph table

The dashboard funnel requires the `user_events` table. Apply:

- `supabase/migrations/20260620033307_add_user_events.sql`

or rerun the idempotent remote bootstrap:

- `supabase/remote_bootstrap.sql`

## Closed Beta Readiness

Before inviting testers, verify:

- Cloudflare Pages serves `manifest.webmanifest`, `sw.js`, and `tracking.js`.
- Railway API accepts `POST /events`.
- Supabase has `public.user_events`.
- Admin Dashboard shows the funnel instead of the "event table not enabled" message.
- The full user flow writes both quiz results and behavior events.

## Railway API Deploy

This repo includes `railway.json` pointing Railway to `apps/api/Dockerfile`.

Set Railway service variables:

```env
APP_ORIGIN=https://your-cloudflare-pages-domain
SUPABASE_URL=https://zcgsshcowoosunbfsvqp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
```

Railway supplies `PORT` automatically.

## Cloudflare Pages Frontend Deploy

Deploy the current playable Alpha HTML prototype to Cloudflare Pages.

Recommended Pages settings:

```text
Type: Pages
Repository: baobaoagi-cpu/AI-Survival-Index
Production branch: main
Root directory: /
Build command: pnpm build:alpha-pages
Build output directory: dist-alpha
```

Set this Cloudflare Pages build environment variable:

```env
AI_SURVIVAL_API_BASE_URL=https://ai-survivalapi-production.up.railway.app
```

After Cloudflare gives the Pages domain, add it to the Railway API `APP_ORIGIN`
variable together with any existing origins.

## Supabase

Remote bootstrap SQL:

- `supabase/remote_bootstrap.sql`

Full migration:

- `supabase/migrations/202606200001_initial_schema.sql`
