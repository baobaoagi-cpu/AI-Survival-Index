# Zodiac And State Result Bible V1

本文件定義 Alpha-10 的星座濾鏡與當下狀態系統。

## 核心公式

```text
AI 原型 = 你的 AI 生存策略
星座濾鏡 = 你的能量表達方式
當下狀態 = 你現在正在面對的局
```

淺層結果的基本組合：

```text
9 AI 原型 × 12 星座 × 3 當下狀態 = 324 種結果
```

這 324 種結果不應全部手寫長報告，而是透過模組化資料組合：

- archetype core
- zodiac modifier
- state modifier
- title template
- mission template

## 12 星座濾鏡

### Aries 牡羊座

- element: fire
- energy: 啟動、衝刺、開局
- aiTrait: 快速試錯，敢先開第一槍
- variantPrefix: 啟動型
- risk: 太快行動，忽略後續維護

### Taurus 金牛座

- element: earth
- energy: 穩定、累積、耐心
- aiTrait: 把 AI 工具變成穩定資產
- variantPrefix: 穩固型
- risk: 過度求穩，錯過窗口

### Gemini 雙子座

- element: air
- energy: 資訊、連結、切換
- aiTrait: 快速吸收工具與資訊流
- variantPrefix: 多線型
- risk: 分心太多，難以沉澱

### Cancer 巨蟹座

- element: water
- energy: 照顧、安全、情感
- aiTrait: 用 AI 保護與支持重要的人
- variantPrefix: 守護型
- risk: 過度顧慮他人而延遲自己

### Leo 獅子座

- element: fire
- energy: 表達、舞台、創造
- aiTrait: 把 AI 變成影響力放大器
- variantPrefix: 發光型
- risk: 太在意被看見，忽略基本功

### Virgo 處女座

- element: earth
- energy: 精準、修正、優化
- aiTrait: 把 AI 流程打磨到可複製
- variantPrefix: 精準型
- risk: 過度修正，遲遲不發布

### Libra 天秤座

- element: air
- energy: 平衡、協調、審美
- aiTrait: 在工具、人與關係之間找到平衡
- variantPrefix: 協調型
- risk: 為了平衡而不敢選邊

### Scorpio 天蠍座

- element: water
- energy: 深潛、洞察、轉化
- aiTrait: 用 AI 挖出事情底層的規則
- variantPrefix: 深潛型
- risk: 過度深挖，讓自己卡在懷疑裡

### Sagittarius 射手座

- element: fire
- energy: 遠方、信念、探索
- aiTrait: 用 AI 打開新的世界觀與路線
- variantPrefix: 遠征型
- risk: 看太遠，忽略眼前交付

### Capricorn 摩羯座

- element: earth
- energy: 階梯、責任、成就
- aiTrait: 把 AI 變成長期成就系統
- variantPrefix: 登峰型
- risk: 責任過重，失去彈性

### Aquarius 水瓶座

- element: air
- energy: 未來、社群、異想
- aiTrait: 把 AI 用在新制度與新社群
- variantPrefix: 未來型
- risk: 太前衛，別人跟不上

### Pisces 雙魚座

- element: water
- energy: 直覺、想像、共感
- aiTrait: 用 AI 轉譯感受、故事與靈感
- variantPrefix: 靈感型
- risk: 邊界太鬆，行動不夠落地

## 3 當下狀態

### oriented 已定向

使用者已經大概知道下一步，需要加速與執行。

報告語氣：

- 肯定
- 聚焦
- 給節奏
- 給風險提醒

主要 CTA：

```text
啟動 30 天指南針
```

### crossroads 十字路口

使用者看見幾條路，但還沒決定。

報告語氣：

- 陪伴
- 釐清
- 給取捨框架
- 給 7 天小實驗

主要 CTA：

```text
用三鏡報告幫我判斷
```

### inertia 慣性循環

使用者卡在舊模式，或正在用舊方法硬撐。

報告語氣：

- 溫和但直接
- 拆解阻力
- 給低成本破局任務
- 避免責備

主要 CTA：

```text
解鎖破局任務
```

## 組合文案規則

### 變體稱號

```text
{zodiac.variantPrefix} + {archetype.name}
```

範例：

```text
深潛型 AI 探險家
精準型 AI 工匠
未來型 AI 發明家
```

### 一句話結果

```text
你不是單純的 {archetype.name}，
你會用 {zodiac.energy} 的方式，
在 {state.meaning} 中找到下一步。
```

### 淺度報告最小結構

```yaml
variantTitle:
oneLineInsight:
currentStateReading:
strength:
risk:
sevenDayMission:
sharePrompt:
deepReportTeaser:
```

## 封測使用方式

封測階段先不要要求使用者輸入完整出生資料。

建議流程：

1. 完成測驗。
2. 顯示九大原型結果。
3. 問「要不要加入生日，生成星座濾鏡？」
4. 只收月 / 日。
5. 問「你現在比較像哪種狀態？」
6. 產生淺度結果預覽。
7. 引導分享 2 位好友解鎖完整淺度報告。
8. 引導「我想買深度報告」。

