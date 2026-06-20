export type ZodiacKey =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type ZodiacModifier = {
  key: ZodiacKey;
  name: string;
  dateRange: string;
  element: "fire" | "earth" | "air" | "water";
  energy: string;
  aiTrait: string;
  variantPrefix: string;
  shortInsight: string;
  risk: string;
};

export const ZODIAC_MODIFIERS: ZodiacModifier[] = [
  {
    key: "aries",
    name: "牡羊座",
    dateRange: "03/21-04/19",
    element: "fire",
    energy: "啟動、衝刺、開局",
    aiTrait: "快速試錯，敢先開第一槍",
    variantPrefix: "啟動型",
    shortInsight: "你適合用快速行動打開局面，再用 AI 幫你補上節奏。",
    risk: "太快行動，忽略後續維護。",
  },
  {
    key: "taurus",
    name: "金牛座",
    dateRange: "04/20-05/20",
    element: "earth",
    energy: "穩定、累積、耐心",
    aiTrait: "把 AI 工具變成穩定資產",
    variantPrefix: "穩固型",
    shortInsight: "你適合把 AI 變成可累積的流程，而不是一次性的玩具。",
    risk: "過度求穩，錯過窗口。",
  },
  {
    key: "gemini",
    name: "雙子座",
    dateRange: "05/21-06/20",
    element: "air",
    energy: "資訊、連結、切換",
    aiTrait: "快速吸收工具與資訊流",
    variantPrefix: "多線型",
    shortInsight: "你適合用 AI 整理資訊、連結人脈，快速找出新路線。",
    risk: "分心太多，難以沉澱。",
  },
  {
    key: "cancer",
    name: "巨蟹座",
    dateRange: "06/21-07/22",
    element: "water",
    energy: "照顧、安全、情感",
    aiTrait: "用 AI 保護與支持重要的人",
    variantPrefix: "守護型",
    shortInsight: "你適合用 AI 建立安全感，讓自己和身邊的人不被浪潮丟下。",
    risk: "過度顧慮他人而延遲自己。",
  },
  {
    key: "leo",
    name: "獅子座",
    dateRange: "07/23-08/22",
    element: "fire",
    energy: "表達、舞台、創造",
    aiTrait: "把 AI 變成影響力放大器",
    variantPrefix: "發光型",
    shortInsight: "你適合用 AI 放大表達，讓你的作品被更多人看見。",
    risk: "太在意被看見，忽略基本功。",
  },
  {
    key: "virgo",
    name: "處女座",
    dateRange: "08/23-09/22",
    element: "earth",
    energy: "精準、修正、優化",
    aiTrait: "把 AI 流程打磨到可複製",
    variantPrefix: "精準型",
    shortInsight: "你適合用 AI 修正流程，把混亂變成可重複的系統。",
    risk: "過度修正，遲遲不發布。",
  },
  {
    key: "libra",
    name: "天秤座",
    dateRange: "09/23-10/22",
    element: "air",
    energy: "平衡、協調、審美",
    aiTrait: "在工具、人與關係之間找到平衡",
    variantPrefix: "協調型",
    shortInsight: "你適合用 AI 協調資訊與關係，把複雜選項變得清楚。",
    risk: "為了平衡而不敢選邊。",
  },
  {
    key: "scorpio",
    name: "天蠍座",
    dateRange: "10/23-11/21",
    element: "water",
    energy: "深潛、洞察、轉化",
    aiTrait: "用 AI 挖出事情底層的規則",
    variantPrefix: "深潛型",
    shortInsight: "你適合用 AI 深挖問題底層，把隱藏規則變成力量。",
    risk: "過度深挖，讓自己卡在懷疑裡。",
  },
  {
    key: "sagittarius",
    name: "射手座",
    dateRange: "11/22-12/21",
    element: "fire",
    energy: "遠方、信念、探索",
    aiTrait: "用 AI 打開新的世界觀與路線",
    variantPrefix: "遠征型",
    shortInsight: "你適合用 AI 擴大視野，把遠方的可能變成可走的路。",
    risk: "看太遠，忽略眼前交付。",
  },
  {
    key: "capricorn",
    name: "摩羯座",
    dateRange: "12/22-01/19",
    element: "earth",
    energy: "階梯、責任、成就",
    aiTrait: "把 AI 變成長期成就系統",
    variantPrefix: "登峰型",
    shortInsight: "你適合用 AI 建立階梯，把長期目標拆成可完成的任務。",
    risk: "責任過重，失去彈性。",
  },
  {
    key: "aquarius",
    name: "水瓶座",
    dateRange: "01/20-02/18",
    element: "air",
    energy: "未來、社群、異想",
    aiTrait: "把 AI 用在新制度與新社群",
    variantPrefix: "未來型",
    shortInsight: "你適合用 AI 試作新制度，讓未來想法先在小圈子運轉。",
    risk: "太前衛，別人跟不上。",
  },
  {
    key: "pisces",
    name: "雙魚座",
    dateRange: "02/19-03/20",
    element: "water",
    energy: "直覺、想像、共感",
    aiTrait: "用 AI 轉譯感受、故事與靈感",
    variantPrefix: "靈感型",
    shortInsight: "你適合用 AI 把模糊感受變成故事、作品或可分享的訊息。",
    risk: "邊界太鬆，行動不夠落地。",
  },
];

export function findZodiacByBirthday(month: number, day: number): ZodiacModifier | undefined {
  const value = month * 100 + day;
  if (value >= 321 && value <= 419) return byKey("aries");
  if (value >= 420 && value <= 520) return byKey("taurus");
  if (value >= 521 && value <= 620) return byKey("gemini");
  if (value >= 621 && value <= 722) return byKey("cancer");
  if (value >= 723 && value <= 822) return byKey("leo");
  if (value >= 823 && value <= 922) return byKey("virgo");
  if (value >= 923 && value <= 1022) return byKey("libra");
  if (value >= 1023 && value <= 1121) return byKey("scorpio");
  if (value >= 1122 && value <= 1221) return byKey("sagittarius");
  if (value >= 1222 || value <= 119) return byKey("capricorn");
  if (value >= 120 && value <= 218) return byKey("aquarius");
  if (value >= 219 && value <= 320) return byKey("pisces");
  return undefined;
}

function byKey(key: ZodiacKey): ZodiacModifier | undefined {
  return ZODIAC_MODIFIERS.find((zodiac) => zodiac.key === key);
}

