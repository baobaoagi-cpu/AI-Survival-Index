# Supabase Schema v1

第一版 schema 採用「前端不直連資料庫」的策略。前端呼叫 `apps/api`，API 使用伺服器端金鑰存取 Supabase。所有資料表已啟用 RLS，且沒有開放 anon 或 authenticated 直接存取 policy。

Migration:

- `supabase/migrations/202606200001_initial_schema.sql`

## Enum

### `archetype_key`

九大 AI 原型：

- `explorer`
- `craftsman`
- `guardian`
- `navigator`
- `strategist`
- `inventor`
- `trader`
- `mentor`
- `builder`

### `quiz_session_status`

- `started`
- `completed`
- `abandoned`

### `membership_status`

- `free`
- `trial`
- `active`
- `past_due`
- `cancelled`

## Tables

### `profiles`

LINE 使用者基本資料鏡像。

主要欄位：

- `line_user_id`
- `display_name`
- `picture_url`
- `locale`

用途：

- 綁定 LINE 使用者
- 未來好友圈與會員狀態都以 profile 為中心

### `quiz_sessions`

一次測驗流程。

主要欄位：

- `profile_id`
- `status`
- `primary_type`
- `secondary_type`
- `evolution_type`
- `archetype_scores`
- `started_at`
- `completed_at`

用途：

- 記錄使用者每次測驗
- 儲存完成後的三種結果類型

### `quiz_answers`

測驗答案明細。

主要欄位：

- `session_id`
- `scenario_id`
- `option_id`
- `archetype_key`
- `answered_at`

用途：

- 保留每題答案
- 未來可做題目分析與轉換率分析

### `archetype_results`

完成測驗後的結果快照。

主要欄位：

- `session_id`
- `profile_id`
- `primary_type`
- `secondary_type`
- `evolution_type`
- `archetype_scores`
- `share_card_url`

用途：

- 分享卡與結果頁讀取
- 避免使用者分享後結果被後續規則變更影響

### `friend_links`

LINE 好友圈關係。

主要欄位：

- `owner_profile_id`
- `friend_profile_id`
- `source`

用途：

- 建立「我的 AI 好友圈」或「家徽牆」
- 未來可從分享、邀請或 LINE OA 互動推導關係

### `share_events`

分享與邀請事件。

主要欄位：

- `profile_id`
- `session_id`
- `channel`
- `event_type`
- `metadata`

用途：

- 記錄 LIFF 分享、邀請、打開分享卡等事件
- 後續做 growth funnel 分析

### `memberships`

未來會員狀態。

主要欄位：

- `profile_id`
- `status`
- `provider`
- `provider_customer_id`
- `provider_subscription_id`
- `current_period_end`

用途：

- 預留未來付費會員
- 目前不接金流、不啟用付款流程

## RLS 策略

目前所有 table 已啟用 RLS。

第一版不建立 browser 直連 policy，原因是：

- LINE 身分應由 LIFF token 或 server 驗證
- Supabase service role 不應出現在前端
- 正式上線前，資料寫入應集中在 API 做驗證、計分、防作弊與事件紀錄

未來如果要讓前端直接讀部分資料，應另開只讀 policy，並用 Supabase Auth 或自訂 JWT 明確綁定 `profile_id`。
