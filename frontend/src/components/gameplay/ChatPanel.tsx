import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, CheckCircle2, Info, Send, XCircle } from "lucide-react";
import type { ElementType } from "react";
import type { ChatEntry, Character, Step, Tone } from "./types";
import { Portrait } from "./CharacterDisplay";
import { useGuide } from "./guide";
import { BTN_DARK, FOCUS, LABEL, MUTED, SURFACE, SURFACE_INNER, TONE } from "./ui";

/**
 * Conversation façon messagerie : le personnage écrit, tu réponds, les
 * conséquences de ta réponse s'affichent dans le fil.
 *
 * FUTURE INTEGRATION IA :
 * quand un agent est branché (`supportsFreeText`), la saisie libre apparaît sous
 * les réponses proposées ; le fil, lui, ne change pas.
 */

const TONE_ICON: Record<Tone, ElementType> = {
    good: CheckCircle2,
    neutral: Info,
    warn: AlertTriangle,
    bad: XCircle,
};

/* ------------------------------------------------------------------ */
/* Fil de conversation                                                 */
/* ------------------------------------------------------------------ */

interface ChatLogProps {
    entries: ChatEntry[];
    characters: Record<string, Character>;
    /** Personnage en train de « répondre » (affiche les trois points). */
    typing?: Character | null;
}

const Bubble = ({ entry, characters }: { entry: Extract<ChatEntry, { kind: "say" }>; characters: Record<string, Character> }) => {
    if (entry.speakerId === "player") {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#2b2a26] px-4 py-2.5 text-base leading-relaxed text-[#f3ecd9]">
                    <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-[#e0b252]">Toi</p>
                    {entry.text}
                </div>
            </div>
        );
    }
    const character = characters[entry.speakerId];
    return (
        <div className="flex items-end gap-2.5">
            {character && <Portrait character={{ ...character, expression: entry.expression ?? "neutral" }} size="h-9 w-9" />}
            <div className={`${SURFACE_INNER} max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-base leading-relaxed`}>
                <p className={`mb-0.5 text-xs font-bold ${MUTED}`}>{character?.name ?? entry.speakerId}</p>
                {entry.text}
            </div>
        </div>
    );
};

export const ChatLog = ({ entries, characters, typing }: ChatLogProps) => {
    const box = useRef<HTMLDivElement>(null);

    // Toujours montrer le dernier message.
    useEffect(() => {
        const node = box.current;
        if (node) node.scrollTop = node.scrollHeight;
    }, [entries.length, typing]);

    return (
        <section className={`${SURFACE} flex flex-col`} aria-label="Conversation">
            <div ref={box} role="log" aria-live="polite" className="max-h-[44vh] min-h-[220px] space-y-3 overflow-y-auto p-4">
                {entries.map((entry) => {
                    switch (entry.kind) {
                        case "scene":
                            return (
                                <p
                                    key={entry.id}
                                    className="flex items-center gap-3 pt-2 text-xs font-bold uppercase tracking-wider text-[#8b8570]"
                                >
                                    <span className="h-px flex-1 bg-[#d6cbb0]" />
                                    <span>
                                        {entry.time} · {entry.text}
                                    </span>
                                    <span className="h-px flex-1 bg-[#d6cbb0]" />
                                </p>
                            );
                        case "say":
                            return <Bubble key={entry.id} entry={entry} characters={characters} />;
                        case "consequence": {
                            const tone = TONE[entry.tone];
                            const Icon = TONE_ICON[entry.tone];
                            return (
                                <div key={entry.id} className={`rounded-lg border-2 px-4 py-3 ${tone.border} ${tone.bg}`}>
                                    <p className={`flex items-center gap-2 text-sm font-bold ${tone.text}`}>
                                        <Icon size={17} className="shrink-0" /> {entry.title ?? "Conséquence"}
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed">{entry.text}</p>
                                    {entry.deltas.length > 0 && (
                                        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Effets sur les jauges">
                                            {entry.deltas.map((delta) => (
                                                <li
                                                    key={delta.label}
                                                    className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                                                        delta.delta > 0 ? "bg-[#cfe6c6] text-[#1f5a2c]" : "bg-[#f0c9c4] text-[#8a2620]"
                                                    }`}
                                                >
                                                    {delta.label} {delta.delta > 0 ? "+" : "−"}
                                                    {Math.abs(delta.delta)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        }
                        case "objective":
                            return (
                                <p
                                    key={entry.id}
                                    className="flex items-center justify-center gap-2 rounded-full bg-[#2f6b3a] px-4 py-1.5 text-sm font-bold text-white"
                                >
                                    <BadgeCheck size={17} /> Objectif atteint : {entry.text}
                                </p>
                            );
                        default:
                            return null;
                    }
                })}

                {typing && (
                    <div className="flex items-end gap-2.5" aria-label={`${typing.name} écrit…`}>
                        <Portrait character={typing} size="h-9 w-9" />
                        <div className={`${SURFACE_INNER} rounded-2xl rounded-bl-sm px-4 py-3`}>
                            <span className="flex gap-1" aria-hidden>
                                {[0, 1, 2].map((dot) => (
                                    <span
                                        key={dot}
                                        className="h-2 w-2 rounded-full bg-[#8b8570] motion-safe:animate-bounce"
                                        style={{ animationDelay: `${dot * 120}ms` }}
                                    />
                                ))}
                            </span>
                            <span className="sr-only">{typing.name} écrit…</span>
                        </div>
                    </div>
                )}
            </div>
            <p className="border-t border-[#ddd2b6] px-4 py-2 text-xs text-[#8b8570]">
                Pré-alpha : les réponses des personnages sont écrites à la main (pas encore d'agent IA).
            </p>
        </section>
    );
};

/* ------------------------------------------------------------------ */
/* Zone de réponse                                                     */
/* ------------------------------------------------------------------ */

interface ReplyPickerProps {
    step: Step;
    /** Interlocuteur actuel (pour « Marc écrit… »). */
    speakerName: string;
    replies: { id: string; label: string }[];
    supportsFreeText: boolean;
    error: string | null;
    /** `true` s'il reste une rencontre ; sinon le bouton mène au bilan. */
    hasNext: boolean;
    onChoose: (optionId: string, label: string) => void;
    onFree: (text: string) => void;
    onNext: () => void;
}

export const ReplyPicker = ({ step, speakerName, replies, supportsFreeText, error, hasNext, onChoose, onFree, onNext }: ReplyPickerProps) => {
    const { active: guideActive } = useGuide();
    const [text, setText] = useState("");
    const nextRef = useRef<HTMLButtonElement>(null);

    // Raccourcis : 1, 2, 3… choisissent la réponse correspondante (pas pendant la visite guidée).
    useEffect(() => {
        if (step !== "asking" || guideActive) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const target = event.target as { tagName?: string } | null;
            if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
            const index = Number(event.key) - 1;
            if (Number.isInteger(index) && index >= 0 && index < replies.length) {
                event.preventDefault();
                onChoose(replies[index].id, replies[index].label);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [step, guideActive, replies, onChoose]);

    // Le bouton « Continuer » prend le focus : Entrée suffit pour enchaîner.
    useEffect(() => {
        if (step === "reacted" && !guideActive) nextRef.current?.focus({ preventScroll: true });
    }, [step, guideActive]);

    const submitFree = (event: FormEvent) => {
        event.preventDefault();
        if (!text.trim()) return;
        onFree(text);
        setText("");
    };

    return (
        <section className={`${SURFACE} p-4`} aria-label="Ta réponse">
            {step === "asking" && (
                <>
                    <p className={`${LABEL} mb-3`}>TA RÉPONSE</p>
                    {error && (
                        <p role="alert" className="mb-3 rounded-md border border-[#e0a8a2] bg-[#f4dad6] px-3 py-2 text-sm text-[#8a2620]">
                            {error}
                        </p>
                    )}
                    <ul className="space-y-2.5">
                        {replies.map((reply, index) => (
                            <li key={reply.id}>
                                <button
                                    type="button"
                                    onClick={() => onChoose(reply.id, reply.label)}
                                    className={`${SURFACE_INNER} flex w-full items-start gap-3 p-3.5 text-left text-base leading-snug transition-colors hover:border-[#2b2a26] hover:bg-white ${FOCUS}`}
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2b2a26] font-mono text-sm font-bold text-[#f3ecd9]">
                                        {index + 1}
                                    </span>
                                    <span className="pt-0.5">{reply.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {supportsFreeText && (
                        <form onSubmit={submitFree} className="mt-3 flex gap-2">
                            <input
                                value={text}
                                onChange={(event) => setText(event.target.value)}
                                aria-label="Écris ta propre réponse"
                                placeholder="Ou écris ta propre réponse…"
                                className={`${SURFACE_INNER} min-w-0 flex-1 px-3 py-2 text-base ${FOCUS}`}
                            />
                            <button type="submit" disabled={!text.trim()} className={`${BTN_DARK} flex items-center gap-2`}>
                                <Send size={15} /> Envoyer
                            </button>
                        </form>
                    )}
                </>
            )}

            {step === "thinking" && (
                <p className={`py-3 text-center text-sm ${MUTED}`} aria-live="polite">
                    {speakerName} réfléchit à ta réponse…
                </p>
            )}

            {step === "reacted" && (
                <button
                    ref={nextRef}
                    type="button"
                    onClick={onNext}
                    className={`${BTN_DARK} flex w-full items-center justify-center gap-2 !bg-[#e0b252] !py-3 text-base !text-[#14171a] hover:!bg-[#efc566]`}
                >
                    {hasNext ? "Personne suivante" : "Voir le bilan"} <ArrowRight size={18} />
                </button>
            )}
        </section>
    );
};
