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
- `docs/option-bible-spec-v1.md`: six-dimension personality engine and Option Bible source of truth.
- `docs/archetype-bible-v1.md`: nine archetypes, dimension coordinates, growth routes, and visual identity rules.
- `docs/archetype-mission-system-v1.md`: today, 7-day, 30-day, and 90-day mission design for each archetype.
- `docs/option-image-prompt-bible.md`: 18 option image prompts for quiz choice illustrations.
- `docs/alpha-09-fate-compass-system.md`: birthday data tiers, fate compass reports, paid deep report, and daily companion model.
- `docs/product-roadmap-v1.md`: prioritized roadmap from closed beta to paid deep reports and subscription companion.
- `docs/zodiac-state-result-bible-v1.md`: zodiac modifiers, current-state modifiers, and 324-result composition rules.
- `docs/alpha-11-report-unlock-mvp.md`: shallow report share-unlock intent and deep report purchase-intent tracking.
- `docs/alpha-12-social-compass-system.md`: social compass states for friend wall, admin monitoring, and paid-navigation readiness.
- `docs/alpha-13-quiz-choice-clarity-ux.md`: quiz page clarity rules for question-vs-choice separation.
- `docs/alpha-14-option-image-integration-and-funnel-health.md`: 18 quiz option image slots and Admin funnel health checks.

## Alpha-05 Quiz Engine

Quiz scoring now uses the six-dimension personality model:

```text
option
-> dimension_effect
-> dimensionScores
-> compare with archetype dimensionProfile
-> primaryType / secondaryType / evolutionType
```

The API and frontend still keep legacy compatibility fields:

- `answers`
- `archetypeScores`
- `primaryType`
- `secondaryType`
- `evolutionType`

New Alpha-05 fields:

- `dimensionScores`
- `archetypeMatches`

Alpha-07 persists these fields in Supabase:

- `quiz_sessions.dimension_scores jsonb`
- `archetype_results.dimension_scores jsonb`
- `quiz_answers.dimension_effect jsonb`

## Alpha-06 Fallback And Admin Analytics

The playable Alpha HTML now has a browser-side dimension fallback. If `/quiz/score`
is unavailable, the quiz page still calculates:

- `dimensionScores`
- `archetypeMatches`
- `primaryType`
- `secondaryType`
- `evolutionType`

The Admin Dashboard now computes analytics from `quiz_answers`:

- average six-dimension distribution
- average archetype similarity
- per-session dimension scores
- per-session top archetype matches

These analytics use stored JSONB fields when available and fall back to answer-level
calculation for older rows.

## Alpha-11 Report Unlock MVP

The result page now has two closed-beta conversion entrances:

- `分享 2 位好友解鎖淺度報告`
- `我想買深度報告`

Both are intent-only actions. They do not collect payment and do not truly unlock report content yet.

Tracked events:

- `clicked_shallow_report_unlock`
- `clicked_deep_report_intent`

Admin Dashboard includes both events in the funnel.

## Alpha-12 Social Compass MVP

The friend wall now frames the social graph as a compass:

- `unknown`: 迷霧中
- `archetyped`: 星軌區
- `oriented`: 已校準方向
- `compass`: 指南針

Admin `/admin/users` derives `navigationStatus` from existing quiz results and report-intent events. This is an Alpha proxy only; production paid status should come from membership or payment records.

## Alpha-13 Quiz Choice Clarity UX

The quiz page now separates:

- question number
- scenario card
- explicit three-choice instruction
- A / B / C choice cards with `選這個 →`

This is a frontend-only UX pass. Scoring, API writes, and localStorage compatibility are unchanged.

## Alpha-14 Option Image Integration And Funnel Health

The quiz page now has a replaceable visual slot for all 18 answer options:

- `assets/scenes/options/scene-01-a.png`
- ...
- `assets/scenes/options/scene-06-c.png`

Placeholder PNGs are present so the local Alpha does not show broken images. Final generated images should overwrite the same filenames.

Admin now shows:

- API / Supabase / event tracking health
- 18 option image configured status
- option-level image paths in the question asset table

Answer events also include `displayIndex`, `imagePath`, and `dimensionEffect`.

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
