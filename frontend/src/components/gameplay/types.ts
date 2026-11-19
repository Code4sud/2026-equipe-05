/**
 * Types du moteur de gameplay (frontend uniquement).
 *
 * Tout ce qui est spécifique à un métier ou à un scénario vit dans `missions/`.
 * Ce fichier ne décrit que des structures génériques et réutilisables.
 */

/* ------------------------------------------------------------------ */
/* Personnages — contrat d'affichage générique                         */
/* ------------------------------------------------------------------ */

export type Expression = "neutral" | "happy" | "concerned" | "angry" | "surprised" | "thinking";
export type CommStatus = "speaking" | "listening" | "idle";

/**
 * FUTURE INTEGRATION IA :
 * Ce contrat sera alimenté par les personnages générés côté agents
 * (identité, avatar, expression, dialogue). Aucun champ n'est lié à un métier.
 */
export interface Character {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  expression: Expression;
  dialogue: string;
  status: CommStatus;
}

/* ------------------------------------------------------------------ */
/* Dialogue                                                            */
/* ------------------------------------------------------------------ */

/** `character.id`, ou "player" pour le joueur. */
export type SpeakerId = string;

export interface DialogueInput {
  speakerId: SpeakerId;
  text: string;
  expression?: Expression;
}

export interface DialogueLine extends DialogueInput {
  id: number;
  clock: number;
}

/* ------------------------------------------------------------------ */
/* Contexte lu par les règles de la mission                            */
/* ------------------------------------------------------------------ */

export type Tone = "good" | "neutral" | "warn" | "bad";

export interface GameContext {
  /** Heure courante, en minutes depuis minuit. */
  clock: number;
  /** Minutes restantes avant la fin de la fenêtre de mission. */
  remaining: number;
  /** Conditions extérieures calculées par la mission (vent, vagues…). */
  env: Record<string, number>;
  indicators: Record<string, number>;
  has: (flag: string) => boolean;
  /** Minutes écoulées depuis qu'un drapeau a été posé (-1 s'il ne l'est pas). */
  since: (flag: string) => number;
  isDone: (actionId: string) => boolean;
  doneCount: (actionIds: string[]) => number;
}

/* ------------------------------------------------------------------ */
/* Actions, décisions, événements                                      */
/* ------------------------------------------------------------------ */

export type ActionVerb =
  | "examine"
  | "verify"
  | "consult"
  | "communicate"
  | "procedure"
  | "intervene"
  | "wait"
  | "accept"
  | "refuse"
  | "validate";

export type ResultStatus = "success" | "partial" | "failure";

export interface EndCondition {
  status: ResultStatus;
  reason: string;
  dialogue?: DialogueInput[];
}

export interface ActionOutcome {
  title?: string;
  /** Conséquence lisible affichée au joueur. */
  text: string;
  tone: Tone;
  deltas?: Record<string, number>;
  setFlags?: string[];
  clearFlags?: string[];
  dialogue?: DialogueInput[];
  /** Information révélée dans l'outil qui porte l'action. */
  finding?: { title: string; text: string };
  /** Action refusée : aucun temps consommé, l'action reste disponible. */
  blocked?: boolean;
  /** Remplace le coût en minutes de l'action. */
  timeCost?: number;
  /** Ouvre une décision à choix. */
  decisionId?: string;
  end?: EndCondition;
}

export interface Availability {
  ok: boolean;
  reason?: string;
}

export interface ActionDefinition {
  id: string;
  verb: ActionVerb;
  label: string;
  description: string;
  /** Outil qui porte l'action (voir `ToolDefinition.id`). */
  toolId: string;
  /** Interlocuteur visé (actions de communication). */
  characterId?: string;
  /** Coût en minutes. */
  cost: number;
  /** `false` : l'action peut être répétée. Par défaut : une seule fois. */
  once?: boolean;
  /** Compte dans le bilan « ce que tu n'as pas exploré ». */
  tracked?: boolean;
  /** État « fait » calculé (actions répétables). */
  doneWhen?: (ctx: GameContext) => boolean;
  availability?: (ctx: GameContext) => Availability;
  resolve: (ctx: GameContext) => ActionOutcome;
}

export interface DecisionOption {
  id: string;
  verb: ActionVerb;
  label: string;
  hint?: string;
  cost?: number;
  resolve: (ctx: GameContext) => ActionOutcome;
}

export interface DecisionDefinition {
  id: string;
  /** Interlocuteur qui pose la question (optionnel). */
  characterId?: string;
  title: string;
  prompt: string;
  options: DecisionOption[];
}

export interface EventDefinition {
  id: string;
  /** Se déclenche une fois, dès que la condition devient vraie. */
  when: (ctx: GameContext) => boolean;
  resolve: (ctx: GameContext) => ActionOutcome;
}

/* ------------------------------------------------------------------ */
/* Outils, mission, indicateurs                                        */
/* ------------------------------------------------------------------ */

export interface ToolDefinition {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  kind: "dashboard" | "documents" | "radio" | "commands";
  description: string;
  /** `workspace` : onglet de l'espace de travail. `actions` : zone d'action. */
  placement: "workspace" | "actions";
}

export interface IndicatorDefinition {
  id: string;
  label: string;
  /** Ce que mesure l'indicateur, en une phrase. */
  meaning: string;
  icon: string;
  initial: number;
}

export interface IndicatorView {
  id: string;
  label: string;
  meaning: string;
  icon: string;
  display: string;
  percent: number;
  level: Tone;
  deltaLabel?: string;
  deltaTone?: Tone;
}

export interface Readout {
  id: string;
  label: string;
  value: string;
  tone: Tone;
  hint?: string;
}

export interface ReadinessItem {
  id: string;
  label: string;
  status: "ok" | "ko" | "unknown";
  detail?: string;
}

export interface ObjectiveDefinition {
  id: string;
  label: string;
  isComplete: (ctx: GameContext) => boolean;
}

export interface MissionInfoItem {
  id: string;
  kind: "constraint" | "risk" | "info";
  text: string;
  revealWhen?: (ctx: GameContext) => boolean;
}

export interface BriefingContent {
  eyebrow: string;
  headline: string;
  narrative: string[];
  roleSummary: string;
  objectives: string[];
  howToPlay: { title: string; text: string }[];
}

export interface DebriefSkill {
  label: string;
  score: number;
  comment: string;
}

export interface DebriefContent {
  headline: string;
  summary: string;
  skills: DebriefSkill[];
  insights: string[];
}

export interface DebriefInput {
  ctx: GameContext;
  result: EndCondition;
  blockedAttempts: number;
  missed: string[];
}

export interface MissionDefinition {
  id: string;
  title: string;
  role: string;
  sector: string;
  location: string;
  summary: string;
  startClock: number;
  deadlineClock: number;
  briefing: BriefingContent;
  indicators: IndicatorDefinition[];
  characters: Character[];
  openingDialogue: DialogueInput[];
  tools: ToolDefinition[];
  actions: ActionDefinition[];
  decisions: DecisionDefinition[];
  events: EventDefinition[];
  objectives: ObjectiveDefinition[];
  infoItems: MissionInfoItem[];
  environment: (clock: number) => Record<string, number>;
  readouts: (ctx: GameContext) => Readout[];
  readiness: (ctx: GameContext) => ReadinessItem[];
  evaluateEnd: (ctx: GameContext) => EndCondition | null;
  debrief: (input: DebriefInput) => DebriefContent;
}

/* ------------------------------------------------------------------ */
/* État de la simulation                                               */
/* ------------------------------------------------------------------ */

export type Phase = "briefing" | "playing" | "debrief";

export interface JournalEntry {
  id: number;
  clock: number;
  label: string;
  text: string;
  tone: Tone;
}

export interface OutcomeNotice {
  id: string;
  source: "action" | "event";
  title: string;
  text: string;
  tone: Tone;
}

export interface TurnSummary {
  id: number;
  notices: OutcomeNotice[];
  deltas: Record<string, number>;
  minutes: number;
}

export interface SimulationState {
  phase: Phase;
  clock: number;
  indicators: Record<string, number>;
  flags: Record<string, boolean>;
  flagTimes: Record<string, number>;
  doneActions: string[];
  findings: Record<string, { title: string; text: string }>;
  characters: Record<string, Character>;
  activeToolId: string;
  dialogue: DialogueLine[];
  journal: JournalEntry[];
  pendingDecisionId: string | null;
  firedEvents: string[];
  blockedCount: number;
  lastTurn: TurnSummary | null;
  result: EndCondition | null;
  seq: number;
}
