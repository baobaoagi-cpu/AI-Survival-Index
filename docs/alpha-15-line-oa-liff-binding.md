# Alpha-15 LINE OA And LIFF Binding

## Goal

Make the game ready to run as a LINE Login / LIFF entry and prepare the LINE Official Account webhook foundation.

This phase does not add payment, push campaigns, or full friend graph import. It only establishes the login and webhook base safely.

## Roles

```text
Cloudflare Pages
-> hosts the LIFF frontend

Railway API
-> receives quiz/events/admin requests
-> receives LINE OA webhook
-> verifies LINE webhook signature

Supabase
-> stores profiles, quiz sessions, results, user events, and future friend links

LINE OA / LINE Developers
-> provides Messaging API channel, LIFF app, and share/login behavior
```

## Required LINE Console Setup

### 1. LINE Official Account Manager

Use the OA shown in the screenshots:

```text
智能天命管理局
```

This is the user-facing account.

### 2. LINE Developers

Create or open the Provider that owns this OA.

Create / configure:

1. Messaging API channel
2. LINE Login channel
3. LIFF app under the LINE Login channel

## Required URLs

### Railway API

```text
https://ai-survivalapi-production.up.railway.app
```

Webhook URL:

```text
https://ai-survivalapi-production.up.railway.app/line/webhook
```

Health check:

```text
https://ai-survivalapi-production.up.railway.app/line/health
```

### Cloudflare Pages Frontend

Use the final Cloudflare Pages URL as the LIFF endpoint.

Example:

```text
https://YOUR-CLOUDFLARE-PAGES-DOMAIN/AI時代生存指數.dc.html
```

## Railway Environment Variables

Set these on Railway API service:

```env
LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...
APP_ORIGIN=https://YOUR-CLOUDFLARE-PAGES-DOMAIN,http://127.0.0.1:8765,http://localhost:8765
```

Do not put these values in frontend code or commit them.

## Cloudflare Pages Environment Variables

Set these in Cloudflare Pages build environment:

```env
AI_SURVIVAL_API_BASE_URL=https://ai-survivalapi-production.up.railway.app
AI_SURVIVAL_LIFF_ID=...
AI_SURVIVAL_REQUIRE_LINE_LOGIN=true
```

Local Alpha can leave `AI_SURVIVAL_LIFF_ID` empty and `AI_SURVIVAL_REQUIRE_LINE_LOGIN=false`.

## Implemented In This Repo

### Frontend

Added:

```text
line-liff.js
```

It:

- loads the LIFF SDK only when a LIFF ID exists
- calls `liff.init()`
- redirects to LINE Login when `AI_SURVIVAL_REQUIRE_LINE_LOGIN=true`
- saves LINE profile fields into localStorage:
  - `AI_SURVIVAL_LINE_USER_ID`
  - `AI_SURVIVAL_LINE_DISPLAY_NAME`
  - `AI_SURVIVAL_LINE_PICTURE_URL`
- exposes `window.AI_SURVIVAL_LINE.share()` for future `shareTargetPicker()`

### API

Updated:

```text
apps/api/src/routes/line.ts
```

It now:

- exposes `/line/health`
- verifies `X-Line-Signature`
- rejects invalid webhook calls
- stores LINE webhook events into `user_events`

### Build

Updated:

```text
scripts/build-alpha-pages.cjs
```

It now emits runtime config:

```js
window.AI_SURVIVAL_API_BASE_URL
window.AI_SURVIVAL_LIFF_ID
window.AI_SURVIVAL_REQUIRE_LINE_LOGIN
```

## Manual Console Steps Still Required

The user must still do these in LINE / Cloudflare / Railway dashboards:

1. Copy Messaging API channel secret into Railway as `LINE_CHANNEL_SECRET`.
2. Copy Messaging API channel access token into Railway as `LINE_CHANNEL_ACCESS_TOKEN`.
3. Set LINE webhook URL to Railway `/line/webhook`.
4. Enable webhook usage in LINE Developers / OA settings.
5. Create LIFF app and set endpoint to Cloudflare Pages frontend URL.
6. Copy LIFF ID into Cloudflare Pages as `AI_SURVIVAL_LIFF_ID`.
7. Set `AI_SURVIVAL_REQUIRE_LINE_LOGIN=true` on Cloudflare Pages.
8. Redeploy Cloudflare Pages.
9. Open the LIFF URL inside LINE and confirm login/profile sync.

## Acceptance Criteria

1. `/line/health` returns `webhookConfigured: true` after Railway env is set.
2. LINE webhook verification succeeds in LINE Developers console.
3. Opening the Cloudflare LIFF URL requires LINE Login.
4. Completing the quiz stores a real LINE user id in Supabase profiles.
5. Admin users list shows LINE display name and picture when available.

## Not Yet Implemented

- Real `shareTargetPicker()` replacement for share toasts.
- Share unlock counting for 2 friends.
- Friend graph inference from invite codes.
- OA push message strategy.
- Rich menu.
- Postback handling.
