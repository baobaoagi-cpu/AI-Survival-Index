# Alpha-11 Report Unlock MVP

本文件定義結果頁的兩個封測轉換入口。

Alpha-11 不接金流，不真正解鎖報告，不接 LINE LIFF 分享計數。此階段只驗證使用者意願。

## 入口一：分享 2 位好友解鎖淺度報告

前台文案：

```text
分享 2 位好友解鎖淺度報告
```

目的：

- 驗證使用者是否願意用分享換報告。
- 為未來 LINE LIFF 分享裂變做準備。
- 估算淺度報告對分享率的提升。

事件：

```text
clicked_shallow_report_unlock
```

metadata：

```json
{
  "unlockType": "share_2_friends",
  "reportContext": "primary:secondary:evolution"
}
```

封測提示：

```text
已記錄：你想用分享解鎖淺度報告。LIFF 分享上線後會計算 2 位好友。
```

## 入口二：我想買深度報告

前台文案：

```text
我想買深度報告
```

目的：

- 驗證付費意圖。
- 在接金流前先量測深度報告需求。
- 作為定價與報告內容優先級依據。

事件：

```text
clicked_deep_report_intent
```

metadata：

```json
{
  "product": "deep_report",
  "reportContext": "primary:secondary:evolution"
}
```

封測提示：

```text
已記錄：你想買深度報告。封測階段先不收款。
```

## Admin Dashboard

Dashboard 漏斗新增：

- 淺度解鎖意圖
- 深度購買意圖

## 後續開發

下一輪可以新增正式資料表：

```text
report_unlocks
deep_report_intents
```

但 Alpha-11 暫時使用既有 `user_events`，避免封測前過早擴張 schema。

