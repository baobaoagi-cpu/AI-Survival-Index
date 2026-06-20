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
  dimensionProfile: DimensionScores;
  imagePaths: {
    portrait: string;
    shareCard: string;
    placeholder: string;
  };
};

export type DimensionKey = "explore" | "action" | "risk" | "create" | "influence" | "build";

export type DimensionScores = Record<DimensionKey, number>;

export type DimensionEffect = Partial<Record<DimensionKey, number>>;

export type QuizOption = {
  id: "a" | "b" | "c";
  mood: string;
  title: string;
  archetypeKey: ArchetypeKey;
  dimensionEffect: DimensionEffect;
  secondaryArchetype?: ArchetypeKey;
  imagePath?: string;
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

export type ArchetypeMatch = {
  key: ArchetypeKey;
  name: string;
  distance: number;
  similarityScore: number;
};

export type QuizResult = {
  answers: Array<
    QuizAnswerInput & {
      archetypeKey: ArchetypeKey;
      secondaryArchetype?: ArchetypeKey;
      dimensionEffect: DimensionEffect;
    }
  >;
  archetypeScores: ArchetypeScores;
  dimensionScores: DimensionScores;
  archetypeMatches: ArchetypeMatch[];
  primaryType: ArchetypeKey;
  secondaryType: ArchetypeKey;
  evolutionType: ArchetypeKey;
};
