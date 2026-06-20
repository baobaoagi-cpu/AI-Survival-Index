export type CurrentStateKey = "oriented" | "crossroads" | "inertia";

export type StateModifier = {
  key: CurrentStateKey;
  name: string;
  userText: string;
  meaning: string;
  tone: string;
  risk: string;
  neededSupport: string;
  missionStyle: string;
  primaryCta: string;
  oneLine: string;
};

export const STATE_MODIFIERS: StateModifier[] = [
  {
    key: "oriented",
    name: "已定向",
    userText: "我大概知道下一步",
    meaning: "已經看見方向，需要加速與執行",
    tone: "肯定、聚焦、給節奏",
    risk: "太快進入執行，忽略環境變化。",
    neededSupport: "行動節奏、風險提醒、30 天計畫。",
    missionStyle: "連續執行與進度追蹤。",
    primaryCta: "啟動 30 天指南針",
    oneLine: "你不是沒有方向，現在需要的是穩定推進。",
  },
  {
    key: "crossroads",
    name: "十字路口",
    userText: "我正在幾個選項之間猶豫",
    meaning: "看見幾條路，但還沒決定要往哪裡走",
    tone: "陪伴、釐清、給取捨框架",
    risk: "想太多而錯過可以驗證的小行動。",
    neededSupport: "局勢判斷、選項比較、7 天小實驗。",
    missionStyle: "小規模試走與結果比較。",
    primaryCta: "用三鏡報告幫我判斷",
    oneLine: "你不是沒有答案，你需要先用小實驗排除雜訊。",
  },
  {
    key: "inertia",
    name: "慣性循環",
    userText: "我有點卡住，還在用舊方法硬撐",
    meaning: "卡在熟悉模式裡，需要一次低成本破局",
    tone: "溫和但直接、拆解阻力、避免責備",
    risk: "繼續消耗力氣，卻沒有真正改變路線。",
    neededSupport: "破局任務、低成本行動、心理阻力拆解。",
    missionStyle: "最小可行改變。",
    primaryCta: "解鎖破局任務",
    oneLine: "你不是沒有能力，你只是需要先打斷舊迴圈。",
  },
];

export function findStateModifier(key: CurrentStateKey): StateModifier | undefined {
  return STATE_MODIFIERS.find((state) => state.key === key);
}

