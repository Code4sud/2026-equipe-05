import { useCallback, useEffect, useReducer, useRef } from "react";
import { advance, applyOutcome, beginReply, buildContext, buildTranscript, cancelReply, createInitialState, getEncounter, startMission } from "./simulation";
import { scriptedResponder } from "./scriptedResponder";
import type { MissionDefinition, Outcome, PlayerReply, Responder, SimulationState } from "./types";

type Command =
    | { type: "start" }
    | { type: "begin"; reply: PlayerReply }
    | { type: "outcome"; outcome: Outcome; reply: PlayerReply }
    | { type: "cancel"; error: string }
    | { type: "advance" }
    | { type: "restart" };

interface Options {
    responder?: Responder;
    /** Durée minimale de « l'écriture » du personnage, pour un rythme de conversation (ms). */
    thinkingMs?: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Hook d'état local : la simulation tourne dans React ; le répondant décide des conséquences. */
export function useSimulation(mission: MissionDefinition, { responder = scriptedResponder, thinkingMs = 800 }: Options = {}) {
    const [state, dispatch] = useReducer(
        (current: SimulationState, command: Command): SimulationState => {
            switch (command.type) {
                case "start":
                    return startMission(current, mission);
                case "begin":
                    return beginReply(current, mission, command.reply);
                case "outcome":
                    return applyOutcome(current, mission, command.outcome, command.reply);
                case "cancel":
                    return cancelReply(current, mission, command.error);
                case "advance":
                    return advance(current, mission);
                case "restart":
                    return createInitialState(mission);
                default:
                    return current;
            }
        },
        mission,
        createInitialState,
    );

    // Dernier état connu, lu au moment de répondre ; `token` invalide les réponses en retard (recommencer, quitter).
    const latest = useRef(state);
    latest.current = state;
    const token = useRef(0);
    useEffect(
        () => () => {
            token.current += 1;
        },
        [],
    );

    const reply = useCallback(
        async (playerReply: PlayerReply) => {
            const current = latest.current;
            if (current.phase !== "playing" || current.step !== "asking") return;
            if (playerReply.kind === "free" && !playerReply.text.trim()) return;
            const encounter = getEncounter(mission, current.encounterId);
            const character = encounter ? current.characters[encounter.characterId] : undefined;
            if (!encounter || !character) return;

            const mine = ++token.current;
            dispatch({ type: "begin", reply: playerReply });
            try {
                const [outcome] = await Promise.all([
                    responder.respond({
                        mission,
                        encounter,
                        character,
                        transcript: buildTranscript(current),
                        reply: playerReply,
                        ctx: buildContext(current),
                    }),
                    wait(thinkingMs),
                ]);
                if (mine === token.current) dispatch({ type: "outcome", outcome, reply: playerReply });
            } catch (error) {
                if (mine === token.current) {
                    dispatch({ type: "cancel", error: error instanceof Error ? error.message : "Pas de réponse, réessaie." });
                }
            }
        },
        [mission, responder, thinkingMs],
    );

    return {
        state,
        supportsFreeText: responder.supportsFreeText,
        start: useCallback(() => dispatch({ type: "start" }), []),
        reply,
        next: useCallback(() => dispatch({ type: "advance" }), []),
        restart: useCallback(() => {
            token.current += 1;
            dispatch({ type: "restart" });
        }, []),
    };
}
