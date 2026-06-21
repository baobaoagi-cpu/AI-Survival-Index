# Alpha Share Invite System v1

## Purpose

The share invite system prevents "friends played but did not appear in my friend types" failures.

The product must not rely only on a raw `profileId` URL parameter. Every deliberate share should create a trackable invite code that connects:

```text
owner profile -> shared invite -> invited LINE user -> friend_links -> friend's latest archetype result
```

## Product Rules

1. Sharing must create a server-side invite before opening LINE share.
2. Shared URLs should prefer `?invite=<code>`.
3. Legacy `?ref=<profileId>` remains supported for old links.
4. If LINE share cannot open, the copied fallback URL must still contain `invite` or `ref`.
5. If an invited friend already completed the quiz before, opening a new invite and logging in should still create the friend relationship.
6. The friend wall is not the user's full LINE contact list. It is the set of users who entered through the owner's invite links and logged in.

## Owner Share Flow

```text
Tap "分享好友"
-> LIFF profile is ready
-> POST /friends/invite
-> API upserts owner profile
-> API creates share_invites row
-> frontend builds LIFF URL with ?invite=<code>
-> liff.shareTargetPicker opens LINE friend/group picker
```

## Friend Open Flow

```text
Open LIFF URL with ?invite=<code>
-> frontend stores AI_SURVIVAL_INVITE_CODE
-> POST /friends/invite/open increments open_count
-> LIFF login gets friend's LINE profile
-> POST /friends/referral with inviteCode
-> API resolves invite owner
-> API upserts friend profile
-> API upserts friend_links(owner, friend)
```

## Friend Quiz Completion Flow

```text
POST /quiz/score with answers + inviteCode
-> API scores quiz
-> API writes quiz_sessions / quiz_answers / archetype_results
-> API resolves invite owner again
-> API upserts friend_links again as a safety net
-> API increments completed_count
```

## Data Model

### `share_invites`

```text
id
invite_code
owner_profile_id
channel
source
metadata
open_count
accept_count
completed_count
last_opened_at
last_accepted_at
last_completed_at
expires_at
created_at
updated_at
```

`invite_code` is public. `owner_profile_id` stays server-side.

## API

### `POST /friends/invite`

Creates an invite for the current LINE user.

Required headers:

```text
x-line-user-id
x-line-display-name
x-line-picture-url
```

Body:

```json
{
  "source": "share_button",
  "metadata": {}
}
```

Response:

```json
{
  "persisted": true,
  "inviteCode": "ABCD2345",
  "ownerProfileId": "uuid"
}
```

### `POST /friends/invite/open`

Records that an invite URL was opened.

Body:

```json
{
  "inviteCode": "ABCD2345"
}
```

### `POST /friends/referral`

Creates or repairs the friend relationship.

Preferred body:

```json
{
  "inviteCode": "ABCD2345",
  "source": "line_liff_invite"
}
```

Legacy body:

```json
{
  "referrerProfileId": "uuid",
  "source": "line_liff_login"
}
```

## Frontend Storage

```text
AI_SURVIVAL_INVITE_CODE
AI_SURVIVAL_REFERRER_PROFILE_ID
AI_SURVIVAL_LAST_CREATED_INVITE_CODE
profileId
AI_SURVIVAL_PROFILE_LINE_USER_ID
```

## Current Limitations

1. LINE does not tell us which friend the user selected in the share picker.
2. Invite completion means "someone opened and logged in through the invite", not "the original selected recipient accepted".
3. Invite metric increments are Alpha-grade and not designed for high-concurrency counting yet.
4. There is no visible invite history dashboard yet.

## Acceptance Criteria

1. New share links contain `invite`.
2. Old `ref` links still work.
3. Friend login creates `friend_links`.
4. Friend quiz completion creates or repairs `friend_links`.
5. Friend wall displays invited friends after they log in or complete the quiz.
6. Copied fallback links are not missing tracking codes.

## Next Step

Add an Admin "Invite Funnel" view:

```text
invite_code
owner
created_at
open_count
accept_count
completed_count
linked friend profiles
```
