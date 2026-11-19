import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import type { Character, DecisionDefinition, DialogueLine } from "./types";
import { EXPRESSIONS, SURFACE, VERBS } from "./ui";
import { formatClock } from "./simulation";

interface DialoguePanelProps {
    lines: DialogueLine[];
    characters: Record<string, Character>;
    pendingDecision: DecisionDefinition | null;
    onChoose: (optionId: string) => void;
}

/**
 * Journal des communications + décision en attente.
 *
 * FUTURE INTEGRATION IA :
 * les répliques affichées ici viendront des agents. Le panneau ne dépend que
 * de `DialogueLine` : il suffira d'alimenter la liste.
 */
export const DialoguePanel = ({ lines, characters, pendingDecision, onChoose }: DialoguePanelProps) => {
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = logRef.current;
        if (node) node.scrollTop = node.scrollHeight;
    }, [lines.length, pendingDecision?.id]);

    return (
        <section className={`${SURFACE} flex min-h-0 flex-col`} aria-label="Communications">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-cyan-400">
                <MessageSquare size={16} />
                <span className="text-[10px] font-bold tracking-[0.16em]">COMMUNICATIONS</span>
            </div>

            <div ref={logRef} className="max-h-72 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                {lines.length === 0 && <p className="text-xs italic text-slate-500">Aucun échange pour le moment.</p>}
                {lines.map((line) => {
                    const isPlayer = line.speakerId === "player";
                    const speaker = characters[line.speakerId];
                    const ExpressionIcon = speaker ? (EXPRESSIONS[line.expression ?? "neutral"] ?? EXPRESSIONS.neutral).icon : null;
                    return (
                        <div key={line.id} className={`flex flex-col ${isPlayer ? "items-end" : "items-start"}`}>
                            <p className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                                <span className="font-semibold text-slate-300">{isPlayer ? "Toi" : (speaker?.name ?? line.speakerId)}</span>
                                {speaker && <span>· {speaker.role}</span>}
                                {ExpressionIcon && <ExpressionIcon size={11} />}
                                <span className="font-mono">{formatClock(line.clock)}</span>
                            </p>
                            <p
                                className={`max-w-[92%] rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                                    isPlayer
                                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-50"
                                        : "border-white/5 bg-[#0a121c] text-slate-200"
                                }`}
                            >
                                {line.text}
                            </p>
                        </div>
                    );
                })}
            </div>

            {pendingDecision && (
                <div className="border-t border-amber-400/30 bg-amber-400/5 p-4" role="group" aria-label="Décision en attente">
                    <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-amber-300">
                        DÉCISION · {pendingDecision.title.toUpperCase()}
                    </p>
                    <p className="mb-3 text-xs leading-relaxed text-slate-200">{pendingDecision.prompt}</p>

                    {/* FUTURE INTEGRATION BACKEND : transmettre le choix à la session. */}
                    <div className="space-y-2">
                        {pendingDecision.options.map((option) => {
                            const Verb = VERBS[option.verb];
                            const Icon = Verb.icon;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onChoose(option.id)}
                                    className="w-full rounded-lg border border-white/10 bg-[#0a121c] p-3 text-left transition-all hover:border-amber-400/50 hover:bg-amber-400/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                                >
                                    <span className="flex items-center gap-2 text-xs font-semibold">
                                        <Icon size={14} className="shrink-0 text-amber-300" />
                                        {option.label}
                                    </span>
                                    {option.hint && <span className="mt-1 block pl-[22px] text-[10px] text-slate-500">{option.hint}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
};

export default DialoguePanel;
