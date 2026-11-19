/**
 * Moteur de simulation frontend : fonctions pures, sans backend.
 *
 * Il applique les règles décrites par une `MissionDefinition` :
 * actions, décisions, temps qui passe, événements, indicateurs, fin de mission.
 *
 * FUTURE INTEGRATION BACKEND :
 * `performAction` et `chooseDecision` sont les deux points où l'action du
 * joueur devra être transmise à la session côté serveur. Ici, la résolution
 * est locale et simulée (pré-alpha) : ce n'est pas une réponse d'agent IA.
 */

import type {
    ActionDefinition,
    ActionOutcome,
    Availability,
    Character,
    DialogueInput,
    EndCondition,
    GameContext,
    IndicatorView,
    MissionDefinition,
    OutcomeNotice,
    SimulationState,
    Tone,
} from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

/* ------------------------------------------------------------------ */
/* Formats                                                             */
/* ------------------------------------------------------------------ */

export function formatClock(total: number): string {
    const hours = Math.floor(total / 60) % 24;
    const minutes = total % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
    const safe = Math.max(0, Math.round(minutes));
    if (safe < 60) return `${safe} min`;
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Création de l'état                                                  */
/* ------------------------------------------------------------------ */

export function createInitialState(mission: MissionDefinition): SimulationState {
    const characters: Record<string, Character> = {};
    mission.characters.forEach((character) => {
        characters[character.id] = { ...character };
    });
    const indicators: Record<string, number> = {};
    mission.indicators.forEach((indicator) => {
        indicators[indicator.id] = indicator.initial;
    });
    const firstWorkspaceTool = mission.tools.find((tool) => tool.placement === "workspace") ?? mission.tools[0];

    return {
        phase: "briefing",
        clock: mission.startClock,
        indicators,
        flags: {},
        flagTimes: {},
        doneActions: [],
        findings: {},
        characters,
        activeToolId: firstWorkspaceTool.id,
        dialogue: [],
        journal: [],
        pendingDecisionId: null,
        firedEvents: [],
        blockedCount: 0,
        lastTurn: null,
        result: null,
        seq: 0,
    };
}

function cloneState(state: SimulationState): SimulationState {
    const characters: Record<string, Character> = {};
    Object.entries(state.characters).forEach(([id, character]) => {
        characters[id] = { ...character };
    });
    return {
        ...state,
        indicators: { ...state.indicators },
        flags: { ...state.flags },
        flagTimes: { ...state.flagTimes },
        doneActions: [...state.doneActions],
        findings: { ...state.findings },
        characters,
        dialogue: [...state.dialogue],
        journal: [...state.journal],
        firedEvents: [...state.firedEvents],
    };
}

/* ------------------------------------------------------------------ */
/* Contexte, disponibilité                                             */
/* ------------------------------------------------------------------ */

export function buildContext(state: SimulationState, mission: MissionDefinition): GameContext {
    return {
        clock: state.clock,
        remaining: Math.max(0, mission.deadlineClock - state.clock),
        env: mission.environment(state.clock),
        indicators: state.indicators,
        has: (flag) => !!state.flags[flag],
        since: (flag) => (state.flags[flag] ? state.clock - (state.flagTimes[flag] ?? state.clock) : -1),
        isDone: (id) => state.doneActions.includes(id),
        doneCount: (ids) => ids.filter((id) => state.doneActions.includes(id)).length,
    };
}

export interface ActionStatus {
    done: boolean;
    availability: Availability;
}

export function getActionStatus(
    state: SimulationState,
    mission: MissionDefinition,
    action: ActionDefinition,
): ActionStatus {
    const ctx = buildContext(state, mission);
    const done = action.doneWhen ? action.doneWhen(ctx) : state.doneActions.includes(action.id);

    if (state.result) return { done, availability: { ok: false, reason: "La mission est terminée." } };
    if (state.pendingDecisionId) {
        return {
            done,
            availability: { ok: false, reason: "Une décision t'attend dans le panneau Communications." },
        };
    }
    if (done) return { done, availability: { ok: false, reason: "Déjà fait." } };
    return { done, availability: action.availability ? action.availability(ctx) : { ok: true } };
}

/* ------------------------------------------------------------------ */
/* Mutations internes (sur un brouillon cloné)                         */
/* ------------------------------------------------------------------ */

function pushDialogue(draft: SimulationState, lines: DialogueInput[], clock: number) {
    let lastCharacterId: string | null = null;
    lines.forEach((line) => {
        draft.seq += 1;
        draft.dialogue.push({ ...line, id: draft.seq, clock });
        const character = draft.characters[line.speakerId];
        if (character) {
            character.dialogue = line.text;
            character.expression = line.expression ?? "neutral";
            lastCharacterId = character.id;
        }
    });
    if (lastCharacterId) {
        Object.values(draft.characters).forEach((character) => {
            character.status = character.id === lastCharacterId ? "speaking" : "idle";
        });
    }
}

function applyEffects(
    draft: SimulationState,
    outcome: ActionOutcome,
    label: string,
    flagClock: number,
    lineClock: number,
): Record<string, number> {
    const applied: Record<string, number> = {};
    Object.entries(outcome.deltas ?? {}).forEach(([id, delta]) => {
        if (!(id in draft.indicators)) return;
        const before = draft.indicators[id];
        const after = clamp(before + delta);
        draft.indicators[id] = after;
        applied[id] = after - before;
    });
    outcome.setFlags?.forEach((flag) => {
        if (!draft.flags[flag]) {
            draft.flags[flag] = true;
            draft.flagTimes[flag] = flagClock;
        }
    });
    outcome.clearFlags?.forEach((flag) => {
        delete draft.flags[flag];
        delete draft.flagTimes[flag];
    });
    pushDialogue(draft, outcome.dialogue ?? [], lineClock);
    if (outcome.blocked) draft.blockedCount += 1;
    if (outcome.decisionId) draft.pendingDecisionId = outcome.decisionId;
    draft.seq += 1;
    draft.journal.push({ id: draft.seq, clock: lineClock, label, text: outcome.text, tone: outcome.tone });
    return applied;
}

function setResult(draft: SimulationState, end: EndCondition, clock: number) {
    draft.result = { status: end.status, reason: end.reason };
    pushDialogue(draft, end.dialogue ?? [], clock);
    draft.pendingDecisionId = null;
}

function checkEnd(draft: SimulationState, mission: MissionDefinition) {
    if (draft.result) return;
    const end = mission.evaluateEnd(buildContext(draft, mission));
    if (end) setResult(draft, end, draft.clock);
}

/** Cumule les deltas appliqués pendant un tour. */
function sumInto(total: Record<string, number>, applied: Record<string, number>) {
    Object.entries(applied).forEach(([id, value]) => {
        total[id] = (total[id] ?? 0) + value;
    });
}

/** Fait passer le temps minute par minute ; s'interrompt si une décision s'ouvre. */
function advanceTime(
    draft: SimulationState,
    mission: MissionDefinition,
    minutes: number,
    notices: OutcomeNotice[],
    totals: Record<string, number>,
): number {
    let spent = 0;
    for (let step = 0; step < minutes; step += 1) {
        draft.clock += 1;
        spent += 1;

        for (let guard = 0; guard < 5; guard += 1) {
            const ctx = buildContext(draft, mission);
            const due = mission.events.find((event) => !draft.firedEvents.includes(event.id) && event.when(ctx));
            if (!due) break;
            draft.firedEvents.push(due.id);
            const outcome = due.resolve(ctx);
            const applied = applyEffects(draft, outcome, outcome.title ?? "Événement", draft.clock, draft.clock);
            notices.push({
                id: `${due.id}-${draft.seq}`,
                source: "event",
                title: outcome.title ?? "Événement",
                text: outcome.text,
                tone: outcome.tone,
            });
            sumInto(totals, applied);
        }

        checkEnd(draft, mission);
        if (draft.pendingDecisionId || draft.result) break;
    }
    return spent;
}

interface CommitMeta {
    label: string;
    cost: number;
    /** Identifiant d'action à marquer comme faite (et dont on garde le finding). */
    actionId?: string;
    repeatable?: boolean;
}

function commit(
    state: SimulationState,
    mission: MissionDefinition,
    outcome: ActionOutcome,
    meta: CommitMeta,
): SimulationState {
    const draft = cloneState(state);
    const totals: Record<string, number> = {};
    draft.seq += 1;
    const turnId = draft.seq;
    const notices: OutcomeNotice[] = [];

    const cost = outcome.blocked ? 0 : outcome.timeCost ?? meta.cost;
    const applied = applyEffects(draft, outcome, meta.label, draft.clock + cost, draft.clock);
    sumInto(totals, applied);
    notices.push({
        id: `action-${turnId}`,
        source: "action",
        title: outcome.title ?? meta.label,
        text: outcome.text,
        tone: outcome.tone,
    });

    if (!outcome.blocked && meta.actionId && !meta.repeatable) draft.doneActions.push(meta.actionId);
    if (!outcome.blocked && meta.actionId && outcome.finding) draft.findings[meta.actionId] = outcome.finding;

    if (outcome.end) setResult(draft, outcome.end, draft.clock);
    checkEnd(draft, mission);

    let spent = 0;
    if (draft.result) {
        draft.clock += cost;
        spent = cost;
    } else if (cost > 0 && !draft.pendingDecisionId) {
        spent = advanceTime(draft, mission, cost, notices, totals);
    }

    draft.lastTurn = { id: turnId, notices, deltas: totals, minutes: spent };
    return draft;
}

/* ------------------------------------------------------------------ */
/* API publique                                                        */
/* ------------------------------------------------------------------ */

export function startMission(state: SimulationState, mission: MissionDefinition): SimulationState {
    if (state.phase !== "briefing") return state;
    const draft = cloneState(state);
    draft.phase = "playing";
    pushDialogue(draft, mission.openingDialogue, draft.clock);
    return draft;
}

export function selectTool(state: SimulationState, toolId: string): SimulationState {
    return state.activeToolId === toolId ? state : { ...state, activeToolId: toolId };
}

export function performAction(state: SimulationState, mission: MissionDefinition, actionId: string): SimulationState {
    if (state.phase !== "playing") return state;
    const action = mission.actions.find((candidate) => candidate.id === actionId);
    if (!action) return state;
    if (!getActionStatus(state, mission, action).availability.ok) return state;

    // FUTURE INTEGRATION BACKEND : transmettre l'action du joueur à la session.
    // FUTURE INTEGRATION IA : laisser l'agent générer la réaction contextualisée.
    const outcome = action.resolve(buildContext(state, mission));
    return commit(state, mission, outcome, {
        label: action.label,
        cost: action.cost,
        actionId: action.id,
        repeatable: action.once === false,
    });
}

export function chooseDecision(
    state: SimulationState,
    mission: MissionDefinition,
    optionId: string,
): SimulationState {
    if (state.phase !== "playing" || !state.pendingDecisionId || state.result) return state;
    const decision = mission.decisions.find((candidate) => candidate.id === state.pendingDecisionId);
    const option = decision?.options.find((candidate) => candidate.id === optionId);
    if (!decision || !option) return state;

    // FUTURE INTEGRATION BACKEND : transmettre le choix du joueur à la session.
    const outcome = option.resolve(buildContext(state, mission));
    const cleared: SimulationState = { ...state, pendingDecisionId: null };
    return commit(cleared, mission, outcome, { label: `${decision.title} — ${option.label}`, cost: option.cost ?? 0 });
}

export function showDebrief(state: SimulationState): SimulationState {
    return state.result ? { ...state, phase: "debrief" } : state;
}

/* ------------------------------------------------------------------ */
/* Vues dérivées pour l'interface                                      */
/* ------------------------------------------------------------------ */

const levelFor = (percent: number): Tone => (percent >= 60 ? "good" : percent >= 35 ? "warn" : "bad");

export function getIndicatorViews(state: SimulationState, mission: MissionDefinition): IndicatorView[] {
    const deltas = state.lastTurn?.deltas ?? {};

    const gauges: IndicatorView[] = mission.indicators.map((definition) => {
        const value = Math.round(state.indicators[definition.id]);
        const delta = Math.round(deltas[definition.id] ?? 0);
        return {
            id: definition.id,
            label: definition.label,
            meaning: definition.meaning,
            icon: definition.icon,
            display: `${value}%`,
            percent: value,
            level: levelFor(value),
            deltaLabel: delta === 0 ? undefined : `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`,
            deltaTone: delta === 0 ? undefined : delta > 0 ? "good" : "bad",
        };
    });

    const total = mission.deadlineClock - mission.startClock;
    const remaining = Math.max(0, mission.deadlineClock - state.clock);
    const timePercent = Math.round((remaining / total) * 100);
    const spent = state.lastTurn?.minutes ?? 0;

    const timeView: IndicatorView = {
        id: "time",
        label: "Temps",
        meaning: "Temps restant avant la fin de la fenêtre d'astreinte. Chaque action en consomme.",
        icon: "clock",
        display: formatDuration(remaining),
        percent: timePercent,
        level: timePercent > 40 ? "good" : timePercent > 15 ? "warn" : "bad",
        deltaLabel: spent > 0 ? `−${spent} min` : undefined,
        deltaTone: spent > 0 ? "warn" : undefined,
    };

    return [...gauges, timeView];
}

export function getProgress(state: SimulationState, mission: MissionDefinition) {
    const ctx = buildContext(state, mission);
    const objectives = mission.objectives.map((objective) => ({
        id: objective.id,
        label: objective.label,
        done: objective.isComplete(ctx),
    }));
    return { objectives, done: objectives.filter((o) => o.done).length, total: objectives.length };
}

export function getMissionInfo(state: SimulationState, mission: MissionDefinition) {
    const ctx = buildContext(state, mission);
    const visible = mission.infoItems.filter((item) => !item.revealWhen || item.revealWhen(ctx));
    return { visible, hiddenCount: mission.infoItems.length - visible.length };
}

export function getDebrief(state: SimulationState, mission: MissionDefinition) {
    if (!state.result) return null;
    const ctx = buildContext(state, mission);
    const trackedVerbs = ["examine", "verify", "consult"];
    const missed = mission.actions
        .filter((action) => action.tracked ?? trackedVerbs.includes(action.verb))
        .filter((action) => !state.doneActions.includes(action.id))
        .map((action) => action.label);

    return {
        result: state.result,
        content: mission.debrief({ ctx, result: state.result, blockedAttempts: state.blockedCount, missed }),
        indicators: getIndicatorViews(state, mission),
        journal: state.journal,
        missed,
    };
}
