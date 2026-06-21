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

- `dimensionScores`
- `archetypeMatches`
- `persisted`
- `sessionId`
- `profileId`

`dimensionScores` is persisted to `quiz_sessions.dimension_scores` and `archetype_results.dimension_scores`. Answer-level `dimensionEffect` is persisted to `quiz_answers.dimension_effect`.

### `POST /line/webhook`

Placeholder endpoint. LINE signature verification is still TODO.

### `POST /friends/invite`

Creates a server-side invite code before LINE share opens. New share links use:

```text
https://liff.line.me/<LIFF_ID>?invite=<inviteCode>
```

This prevents broken shares that do not carry an owner reference.

### `POST /friends/referral`

Creates a real friend relationship after a shared LIFF link is opened.

The preferred flow sends `inviteCode` from the share URL and the current LINE
profile through temporary Alpha headers. Legacy `referrerProfileId` links are
still supported for old shares.

- `x-line-user-id`
- `x-line-display-name`
- `x-line-picture-url`

The API resolves the invite owner, upserts the current profile, and writes reciprocal links:

- `friend_links.owner_profile_id`
- `friend_links.friend_profile_id`
- the reverse `friend_links(friend_profile_id, owner_profile_id)` row

LINE does not expose a user's full friend list to LIFF. The friend wall is
therefore built from invite/share relationships, not from the user's complete
LINE contact list. `/friends/wall` reads both outgoing and incoming links so
legacy one-way invite records still appear on both users' walls.

### `GET /friends/wall`

Returns the current user's friend type distribution.

Input:

- `profileId` query string, preferred when available
- or `x-line-user-id` / `lineUserId` as Alpha fallback

Response includes:

- `owner`
- `friends`
- `distribution`
- `totals`

This powers the frontend page now labeled `我的好友類型分佈`.

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
