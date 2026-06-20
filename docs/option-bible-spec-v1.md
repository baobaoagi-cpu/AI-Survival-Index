# AI 時代生存指數

# Option Bible 開發規格書 V1.0

文件目的：

建立《AI 時代生存指數》的核心人格引擎。

本文件優先級高於：

- 題目設計
- 圖片設計
- UI 設計
- 分享機制

原因：

所有圖片、所有題目、所有人格分類，最終都必須建立在同一套人格模型之上。

---

# 核心原則

不要直接設計：

- 九大原型
- 18 個選項
- 18 張圖片

先設計：

## 人格維度系統

因為：

```text
人格原型
=
人格維度的組合結果
```

---

# 第一層：人格維度系統

建立六大人格維度。

---

## D1 探索（Explore）

問題：

面對未知時的態度。

量尺：

```text
保守 ←────→ 探索
```

高分特徵：

- 好奇
- 喜歡新事物
- 願意嘗試

低分特徵：

- 偏好熟悉
- 重視穩定
- 不喜歡改變

---

## D2 行動（Action）

問題：

面對問題時的反應。

量尺：

```text
思考 ←────→ 行動
```

高分特徵：

- 先做再說
- 快速實驗

低分特徵：

- 先分析
- 先理解

---

## D3 風險（Risk）

問題：

面對不確定性時的選擇。

量尺：

```text
安全 ←────→ 冒險
```

高分特徵：

- 願意下注
- 接受失敗

低分特徵：

- 降低風險
- 保守決策

---

## D4 創造（Create）

問題：

價值來自哪裡？

量尺：

```text
優化 ←────→ 創造
```

高分特徵：

- 喜歡創新
- 發明新東西

低分特徵：

- 喜歡改良
- 喜歡完善

---

## D5 影響（Influence）

問題：

注意力放在哪裡？

量尺：

```text
自我 ←────→ 他人
```

高分特徵：

- 喜歡帶領
- 喜歡教學
- 喜歡影響他人

低分特徵：

- 專注自己
- 深度工作

---

## D6 建造（Build）

問題：

成果如何留下？

量尺：

```text
解題 ←────→ 建系統
```

高分特徵：

- 建立流程
- 建立平台
- 建立結構

低分特徵：

- 解決當下問題
- 專案導向

---

# 第二層：九大原型

九大原型不是人格分類。

九大原型是：

```text
人格座標
```

---

每個原型都必須有：

```yaml
id:
name:

identity:

core_desire:

core_fear:

superpower:

shadow:

growth_path:

best_partner:

dimension_profile:
```

---

範例：

AI探險家

dimension_profile:

```yaml
探索: 95
行動: 80
風險: 75
創造: 65
影響: 35
建造: 30
```

---

# 第三層：Option Bible

所有選項都必須遵守以下格式。

禁止直接寫：

```text
A = AI探險家
B = AI工匠
C = AI守護者
```

---

每個選項必須先定義：

```yaml
scene_id:

option_id:

option_text:

emotion:

value:

dimension_effect:

primary_archetype:

secondary_archetype:

visual_mood:

visual_symbol:
```

---

範例：

scene-01

AI已幫你完成工作

---

option-A

```yaml
emotion:
  興奮

value:
  可能性

dimension_effect:
  探索: +3
  創造: +2
  風險: +1

primary_archetype:
  AI探險家

secondary_archetype:
  AI發明家

visual_mood:
  希望
  興奮
  期待

visual_symbol:
  光
  星圖
  羅盤
```

---

# 第四層：人格計算器

計分規則：

使用者不直接獲得人格。

而是累積六大人格維度。

---

例如：

最終結果：

```yaml
探索: 73
行動: 61
風險: 52
創造: 68
影響: 31
建造: 42
```

---

系統根據人格座標庫推導：

主人格：

AI探險家

副人格：

AI發明家

演化方向：

AI領航員

---

# 第五層：圖片生成原則

圖片不決定人格。

人格決定圖片。

---

圖片工廠必須讀取：

```text
Option Bible
↓
人格維度
↓
原型聖經
↓
生成圖片
```

---

禁止：

先畫圖

再定人格

---

正確流程：

```text
人格模型
↓
Option Bible
↓
圖片規格
↓
圖片生成
```

---

# 開發順序

Phase 1

人格維度系統

---

Phase 2

九大原型聖經

---

Phase 3

18 個選項 Option Bible

---

Phase 4

人格計算器

---

Phase 5

圖片工廠

---

Phase 6

MCP 自動生成圖片

---

核心信念：

不要問：

「使用者是哪一型？」

要問：

「使用者正在變成誰？」

---

# 技術遷移備註

目前 `packages/shared` 的 quiz engine 仍是 Alpha 版本：

```text
選項
→ 直接累積 archetype key
→ 推出 primary / secondary / evolution
```

下一步應遷移為：

```text
選項
→ 累積 dimension_effect
→ 得到六維人格座標
→ 與九大原型 dimension_profile 比對
→ 推出 primary / secondary / evolution
```

必要新增資料結構：

```text
packages/shared/src/dimensions.ts
packages/shared/src/option-bible.ts
packages/shared/src/personality-calculator.ts
```

必要回傳欄位：

```yaml
dimensionScores:
  explore:
  action:
  risk:
  create:
  influence:
  build:

primaryType:
secondaryType:
evolutionType:
```

必要資料庫延伸：

```text
quiz_sessions.dimension_scores jsonb
archetype_results.dimension_scores jsonb
quiz_answers.dimension_effect jsonb
```

封閉測試前可以先保留現有 Alpha 計分，但圖片、題目、下一版 quiz engine 必須依照本文件重建。
