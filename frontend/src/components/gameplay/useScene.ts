import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatEntry, Expression, Step } from "./types";

/**
 * Découpe la rencontre en cours en « répliques » affichées une à une, comme dans
 * un jeu : le personnage parle, tu avances (Entrée / clic), puis tes réponses
 * apparaissent ; après ta réponse il réagit, puis la conséquence s'affiche.
 */

export type Beat =
    | { id: number; kind: "char"; speakerId: string; text: string; expression: Expression }
    | { id: number; kind: "player"; text: string }
    | { id: number; kind: "consequence"; entry: Extract<ChatEntry, { kind: "consequence" }>; objectives: string[] };

export function buildBeats(chat: ChatEntry[]): Beat[] {
    let start = 0;
    chat.forEach((entry, index) => {
        if (entry.kind === "scene") start = index + 1;
    });
    const beats: Beat[] = [];
    chat.slice(start).forEach((entry) => {
        if (entry.kind === "say") {
            beats.push(
                entry.speakerId === "player"
                    ? { id: entry.id, kind: "player", text: entry.text }
                    : { id: entry.id, kind: "char", speakerId: entry.speakerId, text: entry.text, expression: entry.expression ?? "neutral" },
            );
        } else if (entry.kind === "consequence") {
            beats.push({ id: entry.id, kind: "consequence", entry, objectives: [] });
        } else if (entry.kind === "objective") {
            const last = beats[beats.length - 1];
            if (last?.kind === "consequence") last.objectives.push(entry.text);
        }
    });
    return beats;
}

export function useScene(chat: ChatEntry[], step: Step, encounterId: string | null) {
    const beats = useMemo(() => buildBeats(chat), [chat]);
    const [cursor, setCursor] = useState(0);
    const lastIndex = beats.length - 1;

    // Nouvelle rencontre : on repart de la première réplique.
    useEffect(() => {
        setCursor(0);
    }, [encounterId]);

    // Selon l'étape : ta réponse, puis la première réplique de réaction.
    useEffect(() => {
        if (step === "thinking") {
            const lastPlayer = beats.map((beat) => beat.kind).lastIndexOf("player");
            if (lastPlayer >= 0) setCursor(lastPlayer);
        } else if (step === "reacted") {
            const lastPlayer = beats.map((beat) => beat.kind).lastIndexOf("player");
            setCursor(Math.min(lastPlayer + 1, Math.max(lastIndex, 0)));
        } else {
            setCursor((current) => Math.min(current, Math.max(lastIndex, 0)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, beats.length]);

    const safeCursor = Math.min(cursor, Math.max(lastIndex, 0));
    const advance = useCallback(() => {
        if (step === "thinking") return;
        setCursor((current) => Math.min(current + 1, Math.max(lastIndex, 0)));
    }, [step, lastIndex]);

    return { beats, cursor: safeCursor, beat: beats[safeCursor] ?? null, atLast: safeCursor >= lastIndex, advance };
}

/** Dernière réplique du personnage avant la position `index` (pour garder sa bulle pendant la conséquence). */
export function lastCharBeatUpTo(beats: Beat[], index: number): Extract<Beat, { kind: "char" }> | null {
    for (let i = Math.min(index, beats.length - 1); i >= 0; i -= 1) {
        const beat = beats[i];
        if (beat.kind === "char") return beat;
    }
    return null;
}
