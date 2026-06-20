# Alpha-09 Fate Compass System

AI 時代生存指數｜命格指南針系統規格 V1.0

## 文件目的

本文件定義「AI 時代生存指數」從一次性測驗，升級成長期陪伴型產品的核心架構。

Alpha-09 的目標不是取代既有九大原型、六維人格引擎或好友圈，而是在其上建立：

- 生日資料分級
- 命格濾鏡
- 淺度報告裂變機制
- 深度報告付費機制
- 每日導航訂閱機制
- AI 指南針小助理
- 隱私與安全邊界

核心產品定位：

```text
免費測驗讓使用者知道自己是誰。
分享解鎖讓使用者看見自己目前怎麼走。
付費報告讓使用者知道接下來怎麼走。
訂閱陪伴讓使用者每天都有人幫他校準方向。
```

## 核心信念

本產品不是宣稱命運固定，也不是替使用者做人生決定。

本產品將生日、星座、傳統命理、人格測驗與 AI 時代任務系統視為「自我理解與行動導航工具」。

正式產品文案應避免：

- 你一定會怎樣
- 你的命就是如此
- 這是唯一正確答案
- 保證成功、保證財富、保證感情結果

正式產品文案應使用：

- 你目前可能更適合
- 這是一個可參考的方向
- 你可以先用小任務驗證
- 這份報告用來幫你校準行動

## 產品層級

### Layer 1: 免費結果

使用者完成測驗後立即取得。

內容：

- 九大 AI 原型
- 家徽
- 主人格
- 副人格
- 演化方向
- 六維分數
- 一句身份宣言
- 好友圈入口

目的：

- 降低進入門檻
- 形成「這很像我」的第一感
- 促成分享
- 收集基礎漏斗資料

資料需求：

- 不需要生日
- 不需要出生時間
- 不需要出生地
- 不需要登入

### Layer 2: 淺度報告

使用者透過分享解鎖。

建議解鎖條件：

```text
分享給 2 位好友
或產生 2 次有效邀請事件
```

內容：

- 星座濾鏡
- 當下狀態
- 原型變體稱號
- 六維分布簡析
- 一個 7 天小任務
- 好友方向雷達

目的：

- 裂變
- 提升分享動機
- 讓使用者感覺結果更個人化
- 引導到深度報告

資料需求：

- 生日月份
- 生日日期
- 不強制要求年份
- 不要求出生時間
- 不要求出生地

### Layer 3: 深度報告

付費解鎖。

內容：

- AI 原型深層分析
- 星座 / 生日濾鏡
- 當下狀態分析
- 三鏡深度評論
- 30 天導航
- 90 天方向建議
- AI 時代風險提醒
- 個人化行動計畫

三鏡深度評論：

```text
勢局之鏡：孫子兵法式策略視角
逍遙之鏡：莊子式自我轉化視角
成效之鏡：彼得杜拉克式管理視角
```

資料需求：

- 出生年月日
- 出生時間，可選但強烈建議
- 出生地，可選
- 目前人生狀態
- 使用者想問的一個問題

### Layer 4: 每日導航訂閱

月訂閱型陪伴服務。

內容：

- 今日能量
- 今日 AI 任務
- 今日適合做的事
- 今日不適合硬衝的事
- 今日一句提醒
- 每週方向校準
- 每月成長回顧
- 好友圈方向變化

目的：

- 增加黏性
- 形成每日使用習慣
- 讓付費從一次性報告延伸成長期陪伴
- 累積人格演化資料

## 生日資料分級

### Level 0: 無生日

可產生：

- 九大原型
- 六維分數
- 副人格
- 演化方向
- 好友圈分布

適用：

- 免費測驗
- 第一輪分享
- 封測低門檻版本

### Level 1: 月日

可產生：

- 星座濾鏡
- 原型 × 星座變體
- 淺度報告
- 分享卡文案變體

資料：

```text
birth_month
birth_day
```

### Level 2: 年月日

可產生：

- 生命週期感
- 年齡階段任務
- 長期成長路線
- 更精準的深度報告

資料：

```text
birth_year
birth_month
birth_day
```

### Level 3: 年月日 + 出生時間

可產生：

- 命盤型深度解讀
- 紫微鬥數方向
- 人類圖方向
- 更細的日常導航節奏

資料：

```text
birth_year
birth_month
birth_day
birth_time
```

### Level 4: 年月日 + 出生時間 + 出生地

可產生：

- 更完整的命盤參考
- 時區與地理位置校正
- 高階付費報告

資料：

```text
birth_year
birth_month
birth_day
birth_time
birth_place
timezone
```

## 命格模組

Alpha-09 只定義資料與產品邏輯，不在本輪實作完整命理計算。

未來可接入的模組：

- Western Zodiac
- 紫微鬥數
- 人類圖
- 易經 / 卜卦
- 生日數字學
- AI 原型六維引擎
- 三鏡深度報告

所有模組必須服從同一個輸出原則：

```text
輸出不是命令，而是行動建議。
輸出不是定論，而是導航參考。
```

## 結果組合模型

基礎組合：

```text
9 AI 原型 × 12 星座 × 3 當下狀態 = 324 種淺層結果
```

完整組合會再加入：

- 副人格
- 演化方向
- 六維高低
- 混合濃度
- 生日資料等級
- 深度報告提問
- 好友圈方向狀態

不建議預先手寫所有完整組合。

建議使用模組化內容庫：

- archetype core copy
- zodiac modifiers
- state modifiers
- archetype × zodiac title
- archetype × state mission
- zodiac × state tone
- advisor lens prompts

## 當下狀態

三種狀態：

```text
oriented: 已定向
crossroads: 十字路口
inertia: 慣性循環
```

### oriented 已定向

使用者感覺：

- 我大概知道下一步
- 我需要的是加速與執行
- 我想確認這個方向對不對

產品回應：

- 給任務
- 給節奏
- 給風險提醒
- 給 30 天計畫

### crossroads 十字路口

使用者感覺：

- 我有幾個選項
- 我不知道該怎麼選
- 我怕選錯方向

產品回應：

- 給取捨框架
- 給局勢判斷
- 給小實驗
- 給 7 天驗證任務

### inertia 慣性循環

使用者感覺：

- 我有點卡住
- 我知道該改，但動不起來
- 我一直用舊方式硬撐

產品回應：

- 給破局任務
- 給低成本行動
- 給心理阻力拆解
- 給最小可行改變

## 指南針狀態

好友圈不應直接顯示誰付費，應顯示誰已找到方向。

資料狀態：

```text
unknown: 迷霧中
archetyped: 已知道原型
oriented: 已校準方向
compass: 已啟動指南針
```

前台語言：

- 迷霧中：尚未完成測驗或還沒找到方向
- 星軌上：已知道自己的 AI 原型
- 已定向：已完成狀態校準
- 指南針：已啟動深度導航

商業對應：

```text
membership.status = active
navigation_status = compass
```

前台不顯示「已付費」。

## AI 指南針小助理

小助理是訂閱服務的核心人格界面。

定位：

```text
陪使用者每天校準方向的 AI 導航員。
```

小助理不應像一般客服，也不應只像算命師。它應該結合：

- AI 時代任務教練
- 命格導航員
- 原型成長陪伴者
- 好友圈動態提醒者

每日輸出格式：

```yaml
date:
archetype:
zodiac:
state:
daily_energy:
today_opportunity:
today_risk:
ai_task:
avoid:
one_sentence:
reflection_question:
```

範例：

```text
今日你的探索能量偏高，但建造能量偏低。
適合測試新工具，不適合重開大型專案。
今日 AI 任務：用 15 分鐘試一個新工具，寫下它能替你省下什麼。
```

## 收費模型

### Report Fee 報告費

一次性付費。

使用者購買：

- 深度報告
- 三鏡評論
- 30 天導航
- 90 天建議

適合：

- 初期封測驗證
- 尚未建立每日陪伴習慣前
- 高價值一次性轉換

### Monthly Companion 訂閱陪伴費

月費。

使用者購買：

- 每日導航
- 每週校準
- 每月回顧
- 持續任務系統
- 好友圈方向變化

適合：

- 產品成熟後
- 有足夠留存資料後
- LINE OA / LIFF 串接完成後

## 深度報告架構

### Section 1: 你的 AI 原型座標

- 主人格
- 副人格
- 演化方向
- 六維分數
- 混合濃度

### Section 2: 你的命格濾鏡

- 星座 / 生日濾鏡
- 生命階段提示
- 目前狀態
- 你的優勢節奏
- 你的阻力模式

### Section 3: 勢局之鏡

孫子兵法式策略視角。

回答：

- 你現在面對的是什麼局？
- 你的資源在哪裡？
- 你不該硬打哪一場？
- 你該如何找到勝勢？

### Section 4: 逍遙之鏡

莊子式自我轉化視角。

回答：

- 你目前執著在哪裡？
- 你真正害怕的是什麼？
- 哪個舊身份可以先放下？
- 你可以如何變得更自由？

### Section 5: 成效之鏡

彼得杜拉克式管理視角。

回答：

- 你能貢獻什麼？
- 你的時間應該放在哪裡？
- 哪個成果最值得追？
- 下一步可執行行動是什麼？

### Section 6: 三鏡合議

輸出：

- 一句總結
- 7 天任務
- 30 天計畫
- 90 天方向
- 一個不能再逃避的問題

## 資料結構草案

### user_birth_profiles

```sql
profile_id uuid
birth_year int null
birth_month int not null
birth_day int not null
birth_time text null
birth_place text null
timezone text null
data_level int not null
consent_version text not null
created_at timestamptz
updated_at timestamptz
```

### result_modifiers

```sql
id uuid
type text -- zodiac, state, advisor, cycle
key text
name text
payload jsonb
created_at timestamptz
updated_at timestamptz
```

### report_unlocks

```sql
id uuid
profile_id uuid
session_id uuid
unlock_type text -- shallow_share, deep_paid, subscription
status text -- pending, unlocked, expired
metadata jsonb
created_at timestamptz
updated_at timestamptz
```

### deep_reports

```sql
id uuid
profile_id uuid
session_id uuid
prompt_version text
model text
input_snapshot jsonb
report jsonb
created_at timestamptz
```

### daily_compass_entries

```sql
id uuid
profile_id uuid
date date
input_snapshot jsonb
entry jsonb
created_at timestamptz
```

## API 草案

### POST /birth-profile

儲存生日資料與同意版本。

### POST /report/shallow/unlock

檢查分享條件，解鎖淺度報告。

### POST /report/deep/intent

記錄使用者想買深度報告的意願。

### POST /report/deep/generate

付費後生成深度報告。

### GET /daily-compass/today

取得今日指南針。

### POST /daily-compass/reflection

記錄今日反思與任務完成狀態。

## 隱私與同意

生日、出生時間、出生地都屬於高敏感度個人資料。

產品必須遵守：

- 使用者可不填
- 填寫前清楚說明用途
- 不把出生時間公開到好友圈
- 不把付費狀態直接公開
- 不把 service role 暴露到前端
- 允許使用者刪除生日資料
- Admin 後台只顯示必要欄位

建議同意文案：

```text
填寫生日資料可以讓你的 AI 指南針報告更個人化。
你可以只填月日，也可以略過。
資料只用於生成你的個人報告與每日導航，不會公開給其他使用者。
```

## 封測 MVP 範圍

本階段先做：

- 免費結果維持現狀
- 結果頁新增「加入生日，生成星座濾鏡」
- 結果頁新增「分享 2 位好友解鎖淺度報告」
- 結果頁新增「我想買深度報告」
- 後台記錄 deep report intent
- 後台記錄 shallow unlock intent
- 不接金流
- 不接完整命盤計算
- 不接每日訂閱推播

暫不做：

- 真實紫微鬥數計算
- 真實人類圖計算
- 自動卜卦
- LINE Push Message
- LINE Pay
- 訂閱扣款

## 驗收標準

Alpha-09 完成時應具備：

1. 生日資料分級規格完成。
2. 淺度報告與深度報告邊界清楚。
3. 三鏡深度報告格式固定。
4. 每日指南針小助理格式固定。
5. 好友圈指南針狀態不直接暴露付費狀態。
6. 資料庫與 API 草案可供下一輪開發。
7. 隱私與同意文案已列入產品規格。

## 下一步建議

### Alpha-10: Zodiac And State Modifier Bible

建立：

- `data/zodiac-modifiers.js`
- `data/state-modifiers.js`
- 12 星座濾鏡
- 3 當下狀態
- 324 種結果標題與一句話模板

### Alpha-11: Report Unlock MVP

建立：

- 分享解鎖淺度報告
- 深度報告購買意圖
- Admin 轉換率顯示

### Alpha-12: Deep Report Prompt Engine

建立：

- 三鏡 prompt
- 深度報告 JSON schema
- 付費前預覽文案
- 付費後完整報告生成流程

