# Alpha-12 Social Compass System

## 目的

把「我的 AI 好友圈」從單純的好友家徽牆，升級成「社交指南針」。

產品要讓使用者一眼看見：

- 我自己是誰
- 我的朋友分布在哪些 AI 原型
- 有多少朋友已經開始校準方向
- 有多少朋友仍在迷霧中
- 深度報告與分享解鎖可以自然接到下一步

這一版只做前台與後台的 Alpha MVP，不新增資料庫 migration，不接付款，不顯示真實付費狀態。

## 導航狀態

`navigationStatus` 先分成四層：

| key | 顯示名稱 | 意義 | Alpha-12 推導規則 |
| --- | --- | --- | --- |
| `unknown` | 迷霧中 | 尚未完成測驗，或還沒有明確方向訊號 | 沒有測驗結果，也沒有報告意圖事件 |
| `archetyped` | 星軌區 | 已知道自己的 AI 原型 | 有 `archetype_results` |
| `oriented` | 已校準方向 | 已表達想看更多分析，開始往下一步走 | 有 `clicked_shallow_report_unlock` |
| `compass` | 指南針 | 已表達深度導航意圖 | 有 `clicked_deep_report_intent` |

正式版若接付款，`compass` 應改由付款成功或有效會員資格判斷，不應只看點擊意圖。

## 前台呈現

`我的AI朋友圈.dc.html` 的 fallback Alpha 版改成：

- 頁首：`SOCIAL COMPASS`
- 主標題：`我的 AI 指南針好友圈`
- 個人家徽卡：維持使用者主原型家徽
- 好友方向雷達：
  - 指南針中心
  - 已校準方向
  - 星軌區
  - 迷霧區
- 好友家徽牆：維持九大原型分布視覺
- CTA：
  - 啟動我的指南針
  - 分享我的 AI 指南針好友圈
  - 邀請朋友一起測測看

好友頁目前仍使用 mock data。正式版應從 API 回傳 owner 的 friend graph 與每位 friend 的 `navigationStatus`。

## 後台呈現

Admin 用戶清單新增「方向狀態」欄位。

API `/admin/users` 目前用既有資料推導：

```text
clicked_deep_report_intent -> compass
clicked_shallow_report_unlock -> oriented
latestResult exists -> archetyped
otherwise -> unknown
```

這讓封測期可以開始觀察：

- 有多少人只完成測驗
- 有多少人願意分享解鎖
- 有多少人想買深度報告
- 用戶的好友數與方向狀態是否互相影響

## 隱私與產品邊界

前台好友頁可以呈現「方向區域」，但不要公開顯示「已付費」字樣。

建議公開語言：

- 已校準方向
- 已啟動指南針
- 正在迷霧中

避免公開語言：

- 已付款
- 已購買
- 會員等級

付費狀態應只出現在本人帳戶、後台、或必要的權限判斷中。

## 後續資料庫建議

Alpha-12 暫不新增 migration。正式化時可新增：

```sql
alter table public.profiles
  add column if not exists navigation_status text not null default 'unknown';
```

或建立事件流表：

```sql
create table if not exists public.navigation_status_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  status text not null,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

若未來有付款與訂閱，建議由 membership / payment webhook 更新權限，再由 API 推導前台可見狀態。

## 下一步

1. 把好友頁 mock data 改成 `/friend-links` 或新 API 回傳。
2. 建立本人與好友的 `navigationStatus` 真實資料流。
3. 接 LIFF share 後，追蹤「分享 2 位好友」是否完成。
4. 深度報告付款成功後，才把使用者正式移入指南針中心。
