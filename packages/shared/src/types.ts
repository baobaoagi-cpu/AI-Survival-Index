export type ArchetypeKey =
  | "explorer"
  | "craftsman"
  | "guardian"
  | "navigator"
  | "strategist"
  | "inventor"
  | "trader"
  | "mentor"
  | "builder";

export type Archetype = {
  key: ArchetypeKey;
  id: string;
  name: string;
  title: string;
  shortDescription: string;
  manifesto: string;
  coreDesire: string;
  coreFear: string;
  superPower: string;
  shadow: string;
  growthPath: string;
  bestPartner: string;
  symbol: string;
  colorHue: number;
  element: string;
  animal: string;
  imagePaths: {
    portrait: string;
    shareCard: string;
    placeholder: string;
  };
};

export type QuizOption = {
  id: "a" | "b" | "c";
  mood: string;
  title: string;
  archetypeKey: ArchetypeKey;
};

export type QuizScenario = {
  id: string;
  chapter: string;
  chTitle: string;
  line: string;
  options: QuizOption[];
};

export type QuizAnswerInput = {
  scenarioId: string;
  optionId: QuizOption["id"];
};

export type ArchetypeScores = Record<ArchetypeKey, number>;

export type QuizResult = {
  answers: Array<QuizAnswerInput & { archetypeKey: ArchetypeKey }>;
  archetypeScores: ArchetypeScores;
  primaryType: ArchetypeKey;
  secondaryType: ArchetypeKey;
  evolutionType: ArchetypeKey;
};
