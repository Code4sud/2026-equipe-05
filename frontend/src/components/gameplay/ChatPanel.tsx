import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, CheckCircle2, ChevronRight, HardHat, Info, Send, XCircle } from "lucide-react";
import type { ElementType } from "react";
import type { ChatEntry, Character, Tone } from "./types";
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
/* Carte de conséquence                                                */
/* ------------------------------------------------------------------ */

interface ConsequenceCardProps {
    tone: Tone;
    title?: string;
    text: string;
    deltas: { label: string; delta: number }[];
    /** Objectifs tout juste atteints. */
    objectives?: string[];
    /** « Dans ce métier… » : ce que la situation apprend du travail réel. */
    metier?: string;
}

export const ConsequenceCard = ({ tone: toneKey, title, text, deltas, objectives = [], metier }: ConsequenceCardProps) => {
    const tone = TONE[toneKey];
    const Icon = TONE_ICON[toneKey];
    return (
        <div className={`rounded-lg border-2 px-4 py-3 ${tone.border} ${tone.bg}`}>
            <p className={`flex items-center gap-2 text-base font-bold ${tone.text}`}>
                <Icon size={18} className="shrink-0" /> {title ?? "Conséquence"}
            </p>
            <p className="mt-1 text-base leading-relaxed">{text}</p>
            {deltas.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2" aria-label="Effets sur les jauges">
                    {deltas.map((delta) => (
                        <li
                            key={delta.label}
                            className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${delta.delta > 0 ? "bg-[#cfe6c6] text-[#1f5a2c]" : "bg-[#f0c9c4] text-[#8a2620]"}`}
                        >
                            {delta.label} {delta.delta > 0 ? "+" : "−"}
                            {Math.abs(delta.delta)}
                        </li>
                    ))}
                </ul>
            )}
            {objectives.map((objective) => (
                <p key={objective} className="mt-2 flex items-center gap-2 rounded-full bg-[#2f6b3a] px-3 py-1 text-sm font-bold text-white">
                    <BadgeCheck size={16} className="shrink-0" /> Objectif atteint : {objective}
                </p>
            ))}
            {metier && (
                <p className="mt-3 flex items-start gap-2 border-t border-black/10 pt-2.5 text-sm leading-relaxed">
                    <HardHat size={17} className="mt-0.5 shrink-0 text-[#6b6657]" />
                    <span>
                        <span className="font-bold">Dans ce métier : </span>
                        {metier}
                    </span>
                </p>
            )}
        </div>
    );
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
                        case "consequence":
                            return <ConsequenceCard key={entry.id} tone={entry.tone} title={entry.title} text={entry.text} deltas={entry.deltas} />;
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
        </section>
    );
};

/* ------------------------------------------------------------------ */
/* Zone de réponse                                                     */
/* ------------------------------------------------------------------ */

/**
 * - `continue`    : il reste des répliques à lire (Entrée / clic) ;
 * - `replies`     : à toi : trois réponses prêtes + ta propre réponse ;
 * - `thinking`    : le personnage réfléchit ;
 * - `consequence` : carte de conséquence, puis personne suivante.
 */
export type ReplyMode = "continue" | "replies" | "thinking" | "consequence";

interface ReplyPickerProps {
    mode: ReplyMode;
    /** Interlocuteur actuel (pour « Marc réfléchit… »). */
    speakerName: string;
    replies: { id: string; label: string }[];
    supportsFreeText: boolean;
    /** Précision affichée sous le champ libre (ex. limites du scénario local). */
    freeTextHint?: string;
    error: string | null;
    /** `true` s'il reste une rencontre ; sinon le bouton mène au bilan. */
    hasNext: boolean;
    consequence?: ConsequenceCardProps | null;
    onChoose: (optionId: string, label: string) => void;
    onFree: (text: string) => void;
    onContinue: () => void;
    onNext: () => void;
}

export const ReplyPicker = ({ mode, speakerName, replies, supportsFreeText, freeTextHint, error, hasNext, consequence, onChoose, onFree, onContinue, onNext }: ReplyPickerProps) => {
    const { active: guideActive } = useGuide();
    const [text, setText] = useState("");
    const nextRef = useRef<HTMLButtonElement>(null);

    // Raccourcis : 1, 2, 3… choisissent la réponse correspondante (pas pendant la visite guidée).
    useEffect(() => {
        if (mode !== "replies" || guideActive) return;
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
    }, [mode, guideActive, replies, onChoose]);

    // « Personne suivante » prend le focus : Entrée suffit pour enchaîner.
    useEffect(() => {
        if (mode === "consequence" && !guideActive) nextRef.current?.focus({ preventScroll: true });
    }, [mode, guideActive]);

    // Le texte libre reste en place si le scénario ne l'a pas compris ; il se vide une fois la réponse prise en compte.
    useEffect(() => {
        if (mode === "consequence") setText("");
    }, [mode]);

    const submitFree = (event: FormEvent) => {
        event.preventDefault();
        if (!text.trim()) return;
        onFree(text);
    };

    return (
        <section className={`${SURFACE} p-3.5`} aria-label="Ta réponse">
            {mode === "continue" && (
                <button
                    type="button"
                    onClick={onContinue}
                    className={`${BTN_DARK} flex w-full items-center justify-center gap-2 !py-2.5 text-sm sm:text-base`}
                >
                    Suite <ChevronRight size={18} />
                    <kbd className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] font-bold">Entrée</kbd>
                </button>
            )}

            {mode === "replies" && (
                <>
                    <p className={`${LABEL} mb-2`}>TA RÉPONSE</p>
                    {error && (
                        <p role="alert" className="mb-2 rounded-md border border-[#e0a8a2] bg-[#f4dad6] px-3 py-1.5 text-xs text-[#8a2620]">
                            {error}
                        </p>
                    )}
                    <ul className="space-y-2">
                        {replies.map((reply, index) => (
                            <li key={reply.id}>
                                <button
                                    type="button"
                                    onClick={() => onChoose(reply.id, reply.label)}
                                    className={`${SURFACE_INNER} flex w-full items-start gap-2.5 p-2.5 sm:p-3 text-left text-sm sm:text-base leading-snug transition-colors hover:border-[#2b2a26] hover:bg-white ${FOCUS}`}
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2b2a26] font-mono text-xs font-bold text-[#f3ecd9]">
                                        {index + 1}
                                    </span>
                                    <span className="pt-0.5">{reply.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {supportsFreeText && (
                        <form onSubmit={submitFree} className="mt-3 border-t border-[#ddd2b6] pt-2.5">
                            <label htmlFor="free-reply" className={`${LABEL} mb-1.5 block`}>
                                OU ÉCRIS TA PROPRE RÉPONSE
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="free-reply"
                                    value={text}
                                    onChange={(event) => setText(event.target.value)}
                                    autoComplete="off"
                                    placeholder="Avec tes mots…"
                                    className={`${SURFACE_INNER} min-w-0 flex-1 px-3 py-2 text-sm sm:text-base ${FOCUS}`}
                                />
                                <button type="submit" disabled={!text.trim()} className={`${BTN_DARK} flex items-center gap-1.5 !py-2 text-xs sm:text-sm`}>
                                    <Send size={14} /> Envoyer
                                </button>
                            </div>
                            {freeTextHint && <p className="mt-1 text-[11px] text-[#8b8570]">{freeTextHint}</p>}
                        </form>
                    )}
                </>
            )}

            {mode === "thinking" && (
                <p className={`py-3 text-center text-sm ${MUTED}`} aria-live="polite">
                    {speakerName} réfléchit à ta réponse…
                </p>
            )}

            {mode === "consequence" && (
                <div className="space-y-2.5">
                    {consequence && <ConsequenceCard {...consequence} />}
                    <button
                        ref={nextRef}
                        type="button"
                        onClick={onNext}
                        className={`${BTN_DARK} flex w-full items-center justify-center gap-2 !bg-[#e0b252] !py-2.5 text-sm sm:text-base !text-[#14171a] hover:!bg-[#efc566]`}
                    >
                        {hasNext ? "Étape suivante" : "Voir le bilan"} <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </section>
    );
};
