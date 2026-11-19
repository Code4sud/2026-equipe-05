import { useEffect, useRef } from "react";
import { History } from "lucide-react";
import type { Character, DialogueLine } from "./types";
import { MUTED, SURFACE } from "./ui";
import { formatClock } from "./simulation";

interface DialoguePanelProps {
    lines: DialogueLine[];
    characters: Record<string, Character>;
}

/**
 * Historique des échanges (replié par défaut : la réplique en cours est déjà
 * affichée sur la scène d'appel).
 *
 * FUTURE INTEGRATION IA :
 * les répliques affichées ici viendront des agents. Le panneau ne dépend que
 * de `DialogueLine` : il suffira d'alimenter la liste.
 */
export const DialoguePanel = ({ lines, characters }: DialoguePanelProps) => {
    const logRef = useRef<HTMLOListElement>(null);

    useEffect(() => {
        const node = logRef.current;
        if (node) node.scrollTop = node.scrollHeight;
    }, [lines.length]);

    return (
        <details className={`${SURFACE} group`} aria-label="Historique des échanges">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-semibold">
                <History size={16} className={MUTED} />
                Historique des échanges
                <span className={`ml-auto text-xs font-normal ${MUTED}`}>{lines.length} message{lines.length > 1 ? "s" : ""}</span>
            </summary>

            <ol ref={logRef} className="max-h-72 space-y-3 overflow-y-auto border-t border-[#ddd2b6] px-5 py-4">
                {lines.length === 0 && <li className={`text-sm italic ${MUTED}`}>Aucun échange pour le moment.</li>}
                {lines.map((line) => {
                    const isPlayer = line.speakerId === "player";
                    const speaker = characters[line.speakerId];
                    return (
                        <li key={line.id} className={`flex flex-col ${isPlayer ? "items-end" : "items-start"}`}>
                            <p className={`mb-1 flex items-center gap-1.5 text-xs ${MUTED}`}>
                                <span className="font-semibold text-[#2b2a26]">{isPlayer ? "Toi" : (speaker?.name ?? line.speakerId)}</span>
                                <span className="font-mono">{formatClock(line.clock)}</span>
                            </p>
                            <p
                                className={`max-w-[92%] rounded-md border px-3 py-2 text-sm leading-relaxed ${
                                    isPlayer ? "border-[#a9c4d6] bg-[#e1ebf2]" : "border-[#ddd2b6] bg-[#faf6ea]"
                                }`}
                            >
                                {line.text}
                            </p>
                        </li>
                    );
                })}
            </ol>
        </details>
    );
};

export default DialoguePanel;
