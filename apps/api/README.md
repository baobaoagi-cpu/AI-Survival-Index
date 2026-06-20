# API

Cloud Run backend for LINE, quiz persistence, and crest-wall data.

Responsibilities:

- Verify LINE webhook signatures.
- Validate LIFF/user payloads sent by the frontend.
- Score quiz answers via `@ai-survival/shared`.
- Write quiz sessions and result records to Supabase using server-side credentials.
- Keep service-role secrets out of the browser.

## Routes

### `POST /quiz/score`

Scores quiz answers with `@ai-survival/shared`.

If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, the route also writes:

- `profiles`
- `quiz_sessions`
- `quiz_answers`
- `archetype_results`

Temporary local headers:

- `x-line-user-id`
- `x-line-display-name`
- `x-line-picture-url`

These headers are placeholders for the future LIFF token verification step. Do not treat them as trusted identity in production.

Response includes the quiz result plus:

- `persisted`
- `sessionId`
- `profileId`

### `POST /line/webhook`

Placeholder endpoint. LINE signature verification is still TODO.

## Local Supabase

This workspace uses non-default local Supabase ports to avoid conflicts with other local projects:

- API: `http://127.0.0.1:55321`
- Studio: `http://127.0.0.1:55323`
- Database: `postgresql://postgres:postgres@127.0.0.1:55322/postgres`

Run from the workspace root:

```bash
pnpm supabase:start
pnpm supabase:status
pnpm dev:api
```
