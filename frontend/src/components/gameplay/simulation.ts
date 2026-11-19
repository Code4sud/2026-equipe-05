import type {
    ChatEntry,
    ChatTranscriptLine,
    DebriefContent,
    DialogueInput,
    Encounter,
    GameContext,
    IndicatorView,
    MissionDefinition,
    Outcome,
    PlayerReply,
    ReplyOption,
    SimulationState,
    Tone,
} from "./types";

/**
 * Moteur de simulation : fonctions pures, sans React ni réseau.
 *
 * Boucle : briefing → (rencontre → réponse → réaction + conséquences) × N → bilan.
 * Le moteur ne décide jamais de la réaction d'un personnage : il applique le
 * `Outcome` fourni par le répondant (voir `Responder` dans `types.ts`).
 *
 * FUTURE INTEGRATION BACKEND :
 * l'état pourrait être persisté / validé côté serveur ; les fonctions ci-dessous
 * en décrivent déjà toutes les transitions.
 */

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/* ------------------------------------------------------------------ */
/* Création                                                            */
/* ------------------------------------------------------------------ */

export function createInitialState(mission: MissionDefinition): SimulationState {
    const characters: SimulationState["characters"] = {};
    mission.characters.forEach((character) => {
        characters[character.id] = { ...character };
    });
    const indicators: Record<string, number> = {};
    mission.indicators.forEach((indicator) => {
        indicators[indicator.id] = indicator.initial;
    });
    return {
        phase: "briefing",
        step: "asking",
        characters,
        encounterId: null,
        nextEncounterId: null,
        chat: [],
        indicators,
        lastDeltas: {},
        flags: [],
        choices: {},
        journal: [],
        result: null,
        error: null,
        nextId: 1,
    };
}

/* ------------------------------------------------------------------ */
/* Contexte lu par le scénario                                         */
/* ------------------------------------------------------------------ */

export function buildContext(state: SimulationState): GameContext {
    return {
        indicators: state.indicators,
        has: (flag) => state.flags.includes(flag),
        isDone: (encounterId) => encounterId in state.choices,
        choice: (encounterId) => state.choices[encounterId] ?? null,
    };
}

export const getEncounter = (mission: MissionDefinition, id: string | null): Encounter | undefined =>
    id ? mission.encounters.find((encounter) => encounter.id === id) : undefined;

/** Prochaine rencontre : celle imposée par la réponse, sinon la première éligible dans l'ordre de la mission. */
export function pickNextEncounter(state: SimulationState, mission: MissionDefinition, forcedId?: string): string | null {
    const ctx = buildContext(state);
    if (forcedId) {
        const forced = getEncounter(mission, forcedId);
        if (forced && !ctx.isDone(forced.id)) return forced.id;
    }
    const next = mission.encounters.find((encounter) => !ctx.isDone(encounter.id) && (encounter.when?.(ctx) ?? true));
    return next?.id ?? null;
}

export const resolveOutcome = (option: ReplyOption, ctx: GameContext): Outcome =>
    typeof option.outcome === "function" ? option.outcome(ctx) : option.outcome;

export const resolveOpening = (encounter: Encounter, ctx: GameContext): DialogueInput[] =>
    typeof encounter.opening === "function" ? encounter.opening(ctx) : encounter.opening;

/** Conversation en texte brut, destinée au répondant. */
export const buildTranscript = (state: SimulationState): ChatTranscriptLine[] =>
    state.chat.flatMap((entry): ChatTranscriptLine[] => (entry.kind === "say" ? [{ speakerId: entry.speakerId, text: entry.text }] : []));

/* ------------------------------------------------------------------ */
/* Transitions                                                         */
/* ------------------------------------------------------------------ */

function openEncounter(state: SimulationState, mission: MissionDefinition, encounterId: string): SimulationState {
    const encounter = getEncounter(mission, encounterId);
    if (!encounter) return state;
    const ctx = buildContext(state);
    const lines = resolveOpening(encounter, ctx);
    let nextId = state.nextId;
    const chat: ChatEntry[] = [...state.chat, { id: nextId++, kind: "scene", time: encounter.time, text: encounter.title }];
    lines.forEach((line) => {
        chat.push({ id: nextId++, kind: "say", speakerId: line.speakerId, text: line.text, expression: line.expression });
    });

    const characters = { ...state.characters };
    Object.keys(characters).forEach((id) => {
        characters[id] = { ...characters[id], status: "idle" };
    });
    const speaker = characters[encounter.characterId];
    const last = lines[lines.length - 1];
    if (speaker) {
        characters[speaker.id] = {
            ...speaker,
            status: "speaking",
            expression: last?.expression ?? "neutral",
            dialogue: last?.text ?? "",
        };
    }

    return { ...state, encounterId, nextEncounterId: null, chat, characters, nextId, step: "asking", lastDeltas: {}, error: null };
}

export function startMission(state: SimulationState, mission: MissionDefinition): SimulationState {
    if (state.phase !== "briefing") return state;
    const firstId = pickNextEncounter(state, mission);
    if (!firstId) return state;
    return openEncounter({ ...state, phase: "playing" }, mission, firstId);
}

/** Le joueur a répondu : sa réplique s'affiche, le personnage « réfléchit ». */
export function beginReply(state: SimulationState, mission: MissionDefinition, reply: PlayerReply): SimulationState {
    if (state.phase !== "playing" || state.step !== "asking") return state;
    const encounter = getEncounter(mission, state.encounterId);
    if (!encounter) return state;
    const text = reply.kind === "choice" ? reply.label : reply.text.trim();
    if (!text) return state;

    const characters = { ...state.characters };
    const speaker = characters[encounter.characterId];
    if (speaker) characters[speaker.id] = { ...speaker, status: "listening", expression: "thinking" };

    return {
        ...state,
        step: "thinking",
        error: null,
        characters,
        chat: [...state.chat, { id: state.nextId, kind: "say", speakerId: "player", text }],
        nextId: state.nextId + 1,
    };
}

/** Le répondant n'a pas pu répondre : on retire la réplique du joueur et on lui laisse réessayer. */
export function cancelReply(state: SimulationState, mission: MissionDefinition, error: string): SimulationState {
    if (state.step !== "thinking") return state;
    const chat = [...state.chat];
    for (let i = chat.length - 1; i >= 0; i -= 1) {
        const entry = chat[i];
        if (entry.kind === "say" && entry.speakerId === "player") {
            chat.splice(i, 1);
            break;
        }
    }
    const encounter = getEncounter(mission, state.encounterId);
    const characters = { ...state.characters };
    const speaker = encounter ? characters[encounter.characterId] : undefined;
    if (speaker) characters[speaker.id] = { ...speaker, status: "speaking" };
    return { ...state, step: "asking", chat, characters, error };
}

/** Applique le résultat décidé par le répondant : réaction, conséquences, jauges, drapeaux, objectifs. */
export function applyOutcome(state: SimulationState, mission: MissionDefinition, outcome: Outcome, reply: PlayerReply): SimulationState {
    if (state.phase !== "playing" || state.step !== "thinking") return state;
    const encounter = getEncounter(mission, state.encounterId);
    if (!encounter) return state;

    const before = buildContext(state);
    let nextId = state.nextId;
    const chat: ChatEntry[] = [...state.chat];

    outcome.reaction.forEach((line) => {
        chat.push({ id: nextId++, kind: "say", speakerId: encounter.characterId, text: line.text, expression: line.expression });
    });

    const indicators = { ...state.indicators };
    const lastDeltas: Record<string, number> = {};
    Object.entries(outcome.deltas ?? {}).forEach(([id, delta]) => {
        if (!(id in indicators) || delta === 0) return;
        const next = clamp(indicators[id] + delta);
        lastDeltas[id] = next - indicators[id];
        indicators[id] = next;
    });

    const deltaList = Object.entries(lastDeltas)
        .filter(([, delta]) => delta !== 0)
        .map(([id, delta]) => ({ label: mission.indicators.find((indicator) => indicator.id === id)?.label ?? id, delta }));
    chat.push({ id: nextId++, kind: "consequence", ...outcome.consequence, deltas: deltaList });

    const flags = Array.from(new Set([...state.flags, ...(outcome.setFlags ?? [])]));
    const replyLabel = reply.kind === "choice" ? reply.label : reply.text.trim();
    const choices = { ...state.choices, [encounter.id]: reply.kind === "choice" ? reply.optionId : "free" };

    const characters = { ...state.characters };
    const speaker = characters[encounter.characterId];
    const lastLine = outcome.reaction[outcome.reaction.length - 1];
    if (speaker) {
        characters[speaker.id] = {
            ...speaker,
            status: "speaking",
            expression: lastLine?.expression ?? "neutral",
            dialogue: lastLine?.text ?? speaker.dialogue,
        };
    }

    let next: SimulationState = {
        ...state,
        step: "reacted",
        chat,
        indicators,
        lastDeltas,
        flags,
        choices,
        characters,
        nextId,
        error: null,
        journal: [
            ...state.journal,
            { id: state.journal.length + 1, time: encounter.time, label: encounter.title, text: `« ${replyLabel} » — ${outcome.consequence.text}`, tone: outcome.consequence.tone },
        ],
    };

    // Objectifs tout juste atteints
    const after = buildContext(next);
    mission.objectives.forEach((objective) => {
        if (!objective.isComplete(before) && objective.isComplete(after)) {
            next = { ...next, chat: [...next.chat, { id: next.nextId, kind: "objective", text: objective.label }], nextId: next.nextId + 1 };
        }
    });

    // Jauge critique à zéro : fin immédiate
    const critical = mission.indicators.some((indicator) => indicator.critical && next.indicators[indicator.id] <= 0);
    if (critical) {
        return { ...next, nextEncounterId: null, result: mission.evaluateEnd(buildContext(next), "critical") };
    }
    return { ...next, nextEncounterId: pickNextEncounter(next, mission, outcome.next) };
}

/** « Continuer » : ouvre la rencontre suivante, ou passe au bilan. */
export function advance(state: SimulationState, mission: MissionDefinition): SimulationState {
    if (state.phase !== "playing" || state.step !== "reacted") return state;
    if (state.result || !state.nextEncounterId) {
        const result = state.result ?? mission.evaluateEnd(buildContext(state), "completed");
        return { ...state, phase: "debrief", result };
    }
    return openEncounter(state, mission, state.nextEncounterId);
}

/* ------------------------------------------------------------------ */
/* Lecture                                                             */
/* ------------------------------------------------------------------ */

const levelOf = (value: number): Tone => (value >= 60 ? "good" : value >= 30 ? "warn" : "bad");
const signed = (delta: number) => `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;

export function getIndicatorViews(state: SimulationState, mission: MissionDefinition): IndicatorView[] {
    return mission.indicators.map((indicator) => {
        const value = state.indicators[indicator.id] ?? indicator.initial;
        const delta = state.lastDeltas[indicator.id] ?? 0;
        return {
            id: indicator.id,
            label: indicator.label,
            meaning: indicator.meaning,
            icon: indicator.icon,
            value,
            percent: value,
            display: `${value}`,
            level: levelOf(value),
            deltaLabel: delta !== 0 ? signed(delta) : undefined,
            deltaTone: delta > 0 ? "good" : delta < 0 ? "bad" : undefined,
        };
    });
}

export function getProgress(state: SimulationState, mission: MissionDefinition) {
    const ctx = buildContext(state);
    const objectives = mission.objectives.map((objective) => ({ id: objective.id, label: objective.label, done: objective.isComplete(ctx) }));
    return { done: objectives.filter((objective) => objective.done).length, total: objectives.length, objectives };
}

export function getDebrief(state: SimulationState, mission: MissionDefinition): { result: NonNullable<SimulationState["result"]>; content: DebriefContent; indicators: IndicatorView[]; journal: SimulationState["journal"] } | null {
    if (!state.result) return null;
    return {
        result: state.result,
        content: mission.debrief({ result: state.result, ctx: buildContext(state), journal: state.journal }),
        indicators: getIndicatorViews({ ...state, lastDeltas: {} }, mission),
        journal: state.journal,
    };
}

/** Heure affichée en haut : celle de la rencontre en cours. */
export const getCurrentTime = (state: SimulationState, mission: MissionDefinition): string =>
    getEncounter(mission, state.encounterId)?.time ?? "";
