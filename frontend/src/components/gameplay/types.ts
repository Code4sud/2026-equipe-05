/**
 * Types du moteur de gameplay (frontend uniquement).
 *
 * Principe : des « rencontres » à la Papers, Please. Un personnage vient te
 * parler selon le contexte ; tu réponds (choix, ou texte libre quand un agent IA
 * sera branché) ; un « répondant » décide de la réaction du personnage, des
 * conséquences et de l'évolution des jauges. Le moteur applique ce résultat.
 *
 * Tout ce qui est propre à un métier ou à un scénario vit dans `missions/`.
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

export type Tone = "good" | "neutral" | "warn" | "bad";

/** Réplique d'un personnage (ou du joueur, `speakerId: "player"`). */
export interface DialogueInput {
  speakerId: string;
  text: string;
  expression?: Expression;
}

/* ------------------------------------------------------------------ */
/* Contexte lu par les règles de la mission                            */
/* ------------------------------------------------------------------ */

export interface GameContext {
  indicators: Record<string, number>;
  /** Un drapeau a-t-il été posé par une réponse précédente ? */
  has: (flag: string) => boolean;
  /** Une rencontre a-t-elle déjà eu lieu ? */
  isDone: (encounterId: string) => boolean;
  /** Option choisie lors d'une rencontre (`null` si pas encore jouée). */
  choice: (encounterId: string) => string | null;
}

/* ------------------------------------------------------------------ */
/* Rencontres, réponses, conséquences                                  */
/* ------------------------------------------------------------------ */

export interface Consequence {
  tone: Tone;
  title?: string;
  text: string;
}

/**
 * Résultat d'une réponse du joueur : c'est CE QUE DOIT RENVOYER le répondant
 * (scénario local aujourd'hui, agent IA demain).
 */
export interface Outcome {
  /** Ce que répond le personnage (une ou plusieurs répliques). */
  reaction: { text: string; expression?: Expression }[];
  /** Conséquence expliquée au joueur, en clair. */
  consequence: Consequence;
  /** Variation des jauges, par identifiant (ex. `{ safety: -15 }`). */
  deltas?: Record<string, number>;
  /** Drapeaux posés : ils servent aux objectifs et aux rencontres suivantes. */
  setFlags?: string[];
  /** Impose la rencontre suivante (sinon le scénario choisit selon le contexte). */
  next?: string;
}

export interface ReplyOption {
  id: string;
  /** Ce que dit le joueur, à la première personne. */
  label: string;
  /**
   * Mots-clés (sans accents, en minuscules) utilisés UNIQUEMENT par le scénario
   * local pour rapprocher une phrase libre de cette réponse. Un agent IA n'en a pas besoin.
   */
  keywords?: string[];
  outcome: Outcome | ((ctx: GameContext) => Outcome);
}

export interface Encounter {
  id: string;
  /** Qui vient te parler. */
  characterId: string;
  /** Heure affichée (« 06:40 »). */
  time: string;
  /** La situation, en quelques mots (« Appel du responsable »). */
  title: string;
  /** D'où te parle le personnage (« Atelier maintenance · radio »). */
  place?: string;
  /** Objectif de la mission que cette situation fait avancer. */
  objectiveId?: string;
  /** « Dans ce métier… » : ce que cette situation apprend sur le travail réel. */
  metier?: string;
  /** Ce que dit le personnage en arrivant (peut dépendre du contexte). */
  opening: DialogueInput[] | ((ctx: GameContext) => DialogueInput[]);
  replies: ReplyOption[];
  /** Condition d'apparition (par défaut : toujours, dans l'ordre de la mission). */
  when?: (ctx: GameContext) => boolean;
}

export type PlayerReply = { kind: "choice"; optionId: string; label: string } | { kind: "free"; text: string };

/* ------------------------------------------------------------------ */
/* Répondant : le point d'entrée de l'IA                               */
/* ------------------------------------------------------------------ */

export interface ChatTranscriptLine {
  speakerId: string;
  text: string;
}

export interface ResponderInput {
  mission: MissionDefinition;
  encounter: Encounter;
  character: Character;
  /** Conversation jusqu'ici (répliques seulement). */
  transcript: ChatTranscriptLine[];
  reply: PlayerReply;
  ctx: GameContext;
}

/**
 * Celui qui décide de la réaction du personnage et des conséquences.
 *
 * FUTURE INTEGRATION IA :
 * implémenter cette interface avec l'appel à l'agent (réponse du personnage,
 * conséquences, variation des jauges) et passer `supportsFreeText: true` pour
 * afficher la saisie libre. Le moteur et l'interface n'ont pas à changer.
 */
export interface Responder {
  supportsFreeText: boolean;
  respond: (input: ResponderInput) => Promise<Outcome>;
}

/* ------------------------------------------------------------------ */
/* Jauges, objectifs                                                   */
/* ------------------------------------------------------------------ */

export interface IndicatorDefinition {
  id: string;
  label: string;
  meaning: string;
  /** Clé d'icône (voir `ui.ts`). */
  icon: string;
  initial: number;
  /** Si elle tombe à 0, la mission s'arrête. */
  critical?: boolean;
}

export interface IndicatorView {
  id: string;
  label: string;
  meaning: string;
  icon: string;
  value: number;
  percent: number;
  display: string;
  level: Tone;
  deltaLabel?: string;
  deltaTone?: Tone;
}

export interface ObjectiveDefinition {
  id: string;
  label: string;
  isComplete: (ctx: GameContext) => boolean;
}

/* ------------------------------------------------------------------ */
/* Contenus de mission : prise de poste, guide, bilan                  */
/* ------------------------------------------------------------------ */

export interface BriefingContent {
  eyebrow: string;
  headline: string;
  narrative: string[];
  roleSummary: string;
  objectives: string[];
}

/**
 * Étape de la visite guidée vocale. Chaque étape met une zone de l'écran en
 * lumière (les autres sont floutées) pendant que la « boîte vocale » parle.
 *
 * `targetId` : identifiant d'une `GuideZone`.
 *   - une zone connue → seule cette zone reste nette ;
 *   - `null`          → tout est flouté (accueil) ;
 *   - `"all"`         → tout est net (conclusion).
 *
 * FUTURE INTEGRATION IA : `speech` pourrait venir du scénario de la session
 * (voire d'un agent « commandant »), et la voix d'un service de synthèse.
 */
export interface GuideStep {
  id: string;
  targetId: string | null;
  title: string;
  /** Où regarder, en une courte phrase. */
  where?: string;
  speech: string;
}

export type ResultStatus = "success" | "partial" | "failure";

export interface EndResult {
  status: ResultStatus;
  reason: string;
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

export interface JournalEntry {
  id: number;
  time: string;
  label: string;
  text: string;
  tone: Tone;
}

export interface DebriefInput {
  result: EndResult;
  ctx: GameContext;
  journal: JournalEntry[];
}

export interface MissionDefinition {
  id: string;
  title: string;
  role: string;
  sector: string;
  location: string;
  summary: string;
  briefing: BriefingContent;
  /** Visite guidée vocale de l'écran de jeu (optionnelle). */
  guide?: GuideStep[];
  indicators: IndicatorDefinition[];
  characters: Character[];
  encounters: Encounter[];
  objectives: ObjectiveDefinition[];
  /** Fin de mission : `completed` (plus de rencontre) ou `critical` (une jauge critique à 0). */
  evaluateEnd: (ctx: GameContext, cause: "completed" | "critical") => EndResult;
  debrief: (input: DebriefInput) => DebriefContent;
}

/* ------------------------------------------------------------------ */
/* État de la simulation                                               */
/* ------------------------------------------------------------------ */

export type Phase = "briefing" | "playing" | "debrief";

/**
 * - `asking`   : le personnage a parlé, le joueur choisit sa réponse ;
 * - `thinking` : réponse envoyée, le répondant prépare la réaction ;
 * - `reacted`  : réaction et conséquences affichées, on peut continuer.
 */
export type Step = "asking" | "thinking" | "reacted";

export type ChatEntry =
  | { id: number; kind: "scene"; time: string; text: string }
  | { id: number; kind: "say"; speakerId: string; text: string; expression?: Expression }
  | { id: number; kind: "consequence"; tone: Tone; title?: string; text: string; deltas: { label: string; delta: number }[] }
  | { id: number; kind: "objective"; text: string };

export interface SimulationState {
  phase: Phase;
  step: Step;
  characters: Record<string, Character>;
  encounterId: string | null;
  /** Rencontre déjà décidée pour la suite (`null` : plus de rencontre, bilan). */
  nextEncounterId: string | null;
  chat: ChatEntry[];
  indicators: Record<string, number>;
  /** Variations de la dernière réponse (pour les pastilles +/- sur les jauges). */
  lastDeltas: Record<string, number>;
  flags: string[];
  /** Options choisies par rencontre. */
  choices: Record<string, string>;
  journal: JournalEntry[];
  result: EndResult | null;
  /** Message d'erreur du répondant (réponse impossible à obtenir). */
  error: string | null;
  nextId: number;
}
