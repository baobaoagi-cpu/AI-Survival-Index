# AI Survival Index Product Roadmap V1

本文件把接下來的產品路線圖依照輕重緩急排序，目標是從「本機 Alpha 可跑」推進到「封閉測試可驗證商業模式」。

## 北極星目標

```text
讓使用者完成測驗後，覺得這是我；
看見好友圈後，覺得我也該找到方向；
看到深度導航後，願意付費或持續訂閱。
```

## 優先級原則

1. 先驗證使用者是否願意完成、分享、解鎖。
2. 先做資料結構與內容系統，再做大量 UI 分支。
3. 先收購買意圖，再接金流。
4. 先用可控規則生成淺層結果，再用 API 生成深度報告。
5. 前台不碰 service role，所有敏感資料都經由 API。

## Phase 1: Result Modifier Foundation

狀態：開始落實。

目標：

- 建立星座濾鏡資料。
- 建立當下狀態資料。
- 建立 9 原型 × 12 星座 × 3 狀態的組合規則。
- 讓淺度報告、深度報告、分享卡、每日指南針都能使用同一套資料。

交付物：

- `docs/zodiac-state-result-bible-v1.md`
- `data/zodiac-modifiers.js`
- `data/state-modifiers.js`
- `packages/shared/src/zodiac-modifiers.ts`
- `packages/shared/src/state-modifiers.ts`

驗收：

- shared package build 通過。
- 星座與狀態資料可被 API / Web / Admin 共用。
- 不破壞現有測驗流程。

## Phase 2: Report Unlock MVP

目標：

- 在結果頁加入「分享 2 位好友解鎖淺度報告」。
- 在結果頁加入「我想買深度報告」。
- 不接金流，先記錄 intent。
- Admin 顯示淺度解鎖與深度購買意圖。

資料：

- `report_unlocks`
- `deep_report_intents`
- `share_events`

驗收：

- 使用者可點擊分享解鎖入口。
- 使用者可點擊深度報告購買意圖。
- Dashboard 能看到轉換率。

## Phase 3: Social Compass MVP

目標：

- 把好友圈升級為指南針 / 星軌 / 迷霧三層。
- 不顯示誰付費，只顯示誰已啟動指南針。
- 形成社交焦慮與分享動機。

狀態：

```text
unknown: 迷霧中
archetyped: 已知道原型
oriented: 已校準方向
compass: 已啟動指南針
```

驗收：

- 好友圈可看見朋友方向狀態分布。
- Admin 可看每個使用者 navigation_status。
- 付費狀態不直接暴露在前台。

## Phase 4: Production Frontend And LIFF Entry

目標：

- Cloudflare Pages 正式前台上線。
- Railway API 正式接 Cloudflare origin。
- LINE LIFF endpoint 指向 Cloudflare。
- 分享 toast 改成 LIFF 分享。

驗收：

- 手機 LINE 內可完成測驗。
- Cloudflare 前台可寫入 Railway API。
- Supabase 有正式封測資料。

## Phase 5: Deep Report Prompt Engine

目標：

- 建立三鏡深度報告 prompt。
- 以孫子兵法式、莊子式、杜拉克式三個角度產出付費報告。
- 先產生報告預覽，再做完整報告。

報告結構：

- 勢局之鏡
- 逍遙之鏡
- 成效之鏡
- 三鏡合議
- 7 天任務
- 30 天計畫
- 90 天方向

驗收：

- 深度報告 JSON schema 固定。
- 同一份輸入可重複產出穩定格式。
- Admin 可看到生成狀態與錯誤。

## Phase 6: Payment MVP

目標：

- 接一個正式金流。
- 深度報告付款後解鎖。
- 付款狀態與 navigation_status 串接。

驗收：

- 未付款只能看預覽。
- 已付款可看完整深度報告。
- 前台只顯示「已啟動指南針」，不顯示付款資訊。

## Phase 7: Daily Companion Subscription

目標：

- 建立 AI 指南針小助理。
- 每日任務、每週校準、每月回顧。
- 未來接 LINE OA push。

驗收：

- 使用者每天有一則今日指南針。
- 可記錄任務完成與反思。
- Admin 可看留存與任務完成率。

## 近期衝刺順序

```text
1. Alpha-10 星座與狀態資料
2. Alpha-11 淺度報告 / 深度報告意圖
3. Alpha-12 好友圈指南針化
4. Cloudflare Pages 正式前台
5. LIFF 分享與入口
6. 深度報告生成
7. 金流
8. 訂閱陪伴
```

