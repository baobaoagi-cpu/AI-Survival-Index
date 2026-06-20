import { ARCHETYPE_KEYS } from "./archetypes.js";
import type { ArchetypeKey, ArchetypeScores, QuizAnswerInput, QuizResult, QuizScenario } from "./types.js";

export const QUIZ_SCENARIOS: QuizScenario[] = [
  {
    id: "scene-01-message",
    chapter: "一",
    chTitle: "AI 來信",
    line: "AI 說：明天的工作已完成。",
    options: [
      { id: "a", mood: "好奇", title: "我想做它想不到的事。", archetypeKey: "explorer" },
      { id: "b", mood: "打磨", title: "我要親手把它做好。", archetypeKey: "craftsman" },
      { id: "c", mood: "影響", title: "我想知道它改變了誰。", archetypeKey: "guardian" },
    ],
  },
  {
    id: "scene-02-system-change",
    chapter: "二",
    chTitle: "系統上線",
    line: "新系統上線，所有人看著你。",
    options: [
      { id: "a", mood: "帶領", title: "我來帶大家往前走。", archetypeKey: "navigator" },
      { id: "b", mood: "拆解", title: "先拆開，看懂規則。", archetypeKey: "strategist" },
      { id: "c", mood: "試作", title: "我先做一版可用流程。", archetypeKey: "craftsman" },
    ],
  },
  {
    id: "scene-03-risk-opportunity",
    chapter: "三",
    chTitle: "新機會",
    line: "高風險機會突然出現。",
    options: [
      { id: "a", mood: "冒險", title: "先試，答案會出現。", archetypeKey: "trader" },
      { id: "b", mood: "沉著", title: "先算清楚再出手。", archetypeKey: "strategist" },
      { id: "c", mood: "轉化", title: "我把風險變成實驗。", archetypeKey: "inventor" },
    ],
  },
  {
    id: "scene-04-friend-anxiety",
    chapter: "四",
    chTitle: "好友求救",
    line: "好友問：我會被取代嗎？",
    options: [
      { id: "a", mood: "傳授", title: "我教你讓 AI 幫忙。", archetypeKey: "mentor" },
      { id: "b", mood: "守護", title: "別怕，我陪你想辦法。", archetypeKey: "guardian" },
      { id: "c", mood: "方向", title: "我整理下一步路線。", archetypeKey: "navigator" },
    ],
  },
  {
    id: "scene-05-blank-canvas",
    chapter: "五",
    chTitle: "空白畫布",
    line: "一張空白畫布在你面前。",
    options: [
      { id: "a", mood: "創造", title: "做沒人做過的東西。", archetypeKey: "inventor" },
      { id: "b", mood: "築基", title: "先打造可長久的系統。", archetypeKey: "builder" },
      { id: "c", mood: "交換", title: "先找可流動的價值。", archetypeKey: "trader" },
    ],
  },
  {
    id: "scene-06-future-self",
    chapter: "六",
    chTitle: "未來回望",
    line: "十年後的你看著現在。",
    options: [
      { id: "a", mood: "勇敢", title: "我希望當時夠勇敢。", archetypeKey: "explorer" },
      { id: "b", mood: "留下", title: "我希望留下重要結構。", archetypeKey: "builder" },
      { id: "c", mood: "傳承", title: "我希望帶出更多人。", archetypeKey: "mentor" },
    ],
  },
];

export const EVOLUTION_BY_PRIMARY: Record<ArchetypeKey, ArchetypeKey> = {
  explorer: "inventor",
  craftsman: "builder",
  guardian: "mentor",
  navigator: "strategist",
  strategist: "navigator",
  inventor: "explorer",
  trader: "strategist",
  mentor: "navigator",
  builder: "guardian",
};

export function emptyScores(): ArchetypeScores {
  return Object.fromEntries(ARCHETYPE_KEYS.map((key) => [key, 0])) as ArchetypeScores;
}

export function scoreQuiz(inputs: QuizAnswerInput[]): QuizResult {
  const scores = emptyScores();
  const answers = inputs.map((input) => {
    const scenario = QUIZ_SCENARIOS.find((item) => item.id === input.scenarioId);
    if (!scenario) {
      throw new Error(`Unknown scenarioId: ${input.scenarioId}`);
    }
    const option = scenario.options.find((item) => item.id === input.optionId);
    if (!option) {
      throw new Error(`Unknown optionId: ${input.optionId} for ${input.scenarioId}`);
    }
    scores[option.archetypeKey] += 1;
    return { ...input, archetypeKey: option.archetypeKey };
  });

  const ranked = ARCHETYPE_KEYS.map((key, index) => ({ key, score: scores[key], index })).sort(
    (a, b) => b.score - a.score || a.index - b.index,
  );

  const primaryType = ranked[0]?.key ?? "explorer";
  const secondaryType =
    ranked.find((item) => item.key !== primaryType && item.score > 0)?.key ??
    ARCHETYPE_KEYS.find((key) => key !== primaryType) ??
    "navigator";
  const preferredEvolution = EVOLUTION_BY_PRIMARY[primaryType];
  const evolutionType =
    preferredEvolution !== primaryType && preferredEvolution !== secondaryType
      ? preferredEvolution
      : ranked.find((item) => ![primaryType, secondaryType].includes(item.key) && item.score > 0)?.key ??
        ARCHETYPE_KEYS.find((key) => ![primaryType, secondaryType].includes(key)) ??
        "navigator";

  return {
    answers,
    archetypeScores: scores,
    primaryType,
    secondaryType,
    evolutionType,
  };
}
