import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, Radio, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import type { GuideStep } from "./types";
import { FOCUS } from "./ui";

/**
 * Boîte vocale du commandement : lit chaque étape à voix haute sur un ton de
 * briefing, affiche les sous-titres, et attend que le joueur confirme
 * (Entrée / Espace / bouton « Compris ») avant de passer à la rubrique suivante.
 *
 * Voix : synthèse vocale du navigateur (Web Speech API), 100 % locale. Les
 * phrases sont lues une à une avec un rythme et une hauteur adaptés (ordres
 * courts et appuyés, exclamations plus vives, questions montantes) pour donner
 * un ton de commandement. La qualité dépend de la voix française installée
 * sur l'appareil ; sans synthèse vocale, les sous-titres restent affichés.
 *
 * FUTURE INTEGRATION IA : remplacer `speakSentences` par un service de voix
 * (ou des enregistrements) et la source des textes par le scénario / l'agent.
 */

interface VoiceBoxProps {
    steps: GuideStep[];
    index: number;
    onNext: () => void;
    onPrev: () => void;
    /** `completed` : le joueur est allé au bout de la visite. */
    onClose: (completed: boolean) => void;
}

/* ------------------------------------------------------------------ */
/* Synthèse vocale                                                     */
/* ------------------------------------------------------------------ */

const synth = (): SpeechSynthesis | null =>
    typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined"
        ? window.speechSynthesis
        : null;

/** Découpe un texte en phrases en gardant la ponctuation (elle règle l'intonation). */
export const splitSentences = (text: string): string[] =>
    (text.match(/[^.!?…]+(?:[.!?…]+|$)/g) ?? [text]).map((sentence) => sentence.trim()).filter(Boolean);

/** Voix française de préférence masculine/grave (adaptée à un commandant), sinon la première française. */
const pickVoice = (): SpeechSynthesisVoice | null => {
    const api = synth();
    if (!api) return null;
    const french = api.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("fr"));
    if (french.length === 0) return null;
    const preferred = french.find((voice) => /thomas|paul|henri|nicolas|male|homme|daniel/i.test(voice.name));
    return preferred ?? french.find((voice) => voice.lang.toLowerCase() === "fr-fr") ?? french[0];
};

/** Réglages d'intonation selon la phrase : ordre bref, exclamation, question ou phrase posée. */
export const prosodyFor = (sentence: string): { rate: number; pitch: number } => {
    const words = sentence.split(/\s+/).length;
    if (sentence.endsWith("?")) return { rate: 1.0, pitch: 1.2 };
    if (sentence.endsWith("!")) return words <= 4 ? { rate: 0.98, pitch: 0.95 } : { rate: 1.12, pitch: 1.12 };
    return { rate: 1.02, pitch: 0.92 };
};

/** Lit les phrases à la suite. Renvoie une fonction d'annulation. */
const speakSentences = (sentences: string[], onSentence: (index: number) => void, onEnd: () => void): (() => void) => {
    const api = synth();
    if (!api) return () => undefined;

    let cancelled = false;
    api.cancel();
    const voice = pickVoice();

    // Petit délai : certains navigateurs ignorent un speak() émis juste après cancel().
    const timer = window.setTimeout(() => {
        sentences.forEach((sentence, i) => {
            const utterance = new SpeechSynthesisUtterance(sentence);
            utterance.lang = "fr-FR";
            if (voice) utterance.voice = voice;
            const { rate, pitch } = prosodyFor(sentence);
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = 1;
            utterance.onstart = () => {
                if (!cancelled) onSentence(i);
            };
            if (i === sentences.length - 1) {
                utterance.onend = () => {
                    if (!cancelled) onEnd();
                };
                utterance.onerror = utterance.onend;
            }
            api.speak(utterance);
        });
    }, 60);

    return () => {
        cancelled = true;
        window.clearTimeout(timer);
        api.cancel();
    };
};

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

const INTERACTIVE = "button, a, input, select, textarea, summary, [role='tab']";

export const VoiceBox = ({ steps, index, onNext, onPrev, onClose }: VoiceBoxProps) => {
    const step = steps[index];
    const isLast = index === steps.length - 1;
    const supported = useMemo(() => synth() !== null, []);
    const [muted, setMuted] = useState(false);
    const [replay, setReplay] = useState(0);
    const [spokenIndex, setSpokenIndex] = useState(-1);
    const [speaking, setSpeaking] = useState(false);
    const confirmRef = useRef<HTMLButtonElement>(null);

    const sentences = useMemo(() => splitSentences(step.speech), [step.speech]);

    // Lecture à voix haute à chaque nouvelle étape (ou « Réécouter »).
    useEffect(() => {
        setSpokenIndex(-1);
        if (!supported || muted) {
            setSpeaking(false);
            return;
        }
        setSpeaking(true);
        const cancel = speakSentences(
            sentences,
            (i) => setSpokenIndex(i),
            () => {
                setSpeaking(false);
                setSpokenIndex(-1);
            },
        );
        return () => {
            cancel();
            setSpeaking(false);
        };
    }, [sentences, supported, muted, replay]);

    // Le bouton « Compris » garde le focus : Entrée valide l'étape sans autre geste.
    useEffect(() => {
        confirmRef.current?.focus({ preventScroll: true });
    }, [index]);

    // Coupe la voix si la boîte disparaît.
    useEffect(
        () => () => {
            synth()?.cancel();
        },
        [],
    );

    // Raccourcis clavier. Si le focus est sur un bouton, c'est lui qui réagit (évite le double déclenchement).
    const handlers = useRef({ onNext, onPrev, onClose });
    handlers.current = { onNext, onPrev, onClose };
    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = event.target as { closest?: (selector: string) => Element | null } | null;
        const onButton = !!target?.closest?.(INTERACTIVE);
        if ((event.key === "Enter" || event.key === " ") && !onButton) {
            event.preventDefault();
            handlers.current.onNext();
        } else if (event.key === "ArrowRight" && !onButton) {
            event.preventDefault();
            handlers.current.onNext();
        } else if (event.key === "ArrowLeft" && !onButton) {
            event.preventDefault();
            handlers.current.onPrev();
        } else if (event.key === "Escape") {
            event.preventDefault();
            handlers.current.onClose(false);
        }
    }, []);
    useEffect(() => {
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onKeyDown]);

    return (
        <section
            aria-label="Boîte vocale du commandement"
            className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-[#e0b252] bg-[#14171a]/98 text-[#e8e2d0] shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur"
        >
            <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:gap-6 md:px-8">
                {/* Émetteur */}
                <div className="flex shrink-0 items-center gap-3 md:w-40 md:flex-col md:items-start">
                    <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#e0b252] bg-[#23272b] text-[#e0b252] ${
                            speaking ? "motion-safe:animate-pulse" : ""
                        }`}
                        aria-hidden
                    >
                        <Radio size={22} />
                    </span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#e0b252]">Commandement</p>
                        <p className="text-xs text-[#a39d8a]" aria-live="polite">
                            {!supported ? "Voix indisponible : lis les sous-titres" : muted ? "Voix coupée" : speaking ? "Transmission…" : "Terminé"}
                        </p>
                    </div>
                </div>

                {/* Message */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#a39d8a]">
                            Étape {index + 1} / {steps.length}
                        </p>
                        <ol className="flex gap-1" aria-hidden>
                            {steps.map((s, i) => (
                                <li
                                    key={s.id}
                                    className={`h-1.5 w-5 rounded-full ${i < index ? "bg-[#2f6b3a]" : i === index ? "bg-[#e0b252]" : "bg-[#3a3f44]"}`}
                                />
                            ))}
                        </ol>
                    </div>
                    <h2 className="mt-1 text-lg font-extrabold uppercase tracking-wide text-[#f3ecd9]">{step.title}</h2>
                    {step.where && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#e0b252]">
                            <MapPin size={14} /> {step.where}
                        </p>
                    )}
                    <p className="mt-2 max-h-[28vh] overflow-y-auto text-base leading-relaxed" aria-label="Sous-titres">
                        {sentences.map((sentence, i) => (
                            <span
                                key={`${step.id}-${i}`}
                                className={spokenIndex === -1 || spokenIndex === i ? "text-[#f3ecd9]" : "text-[#8f8a78]"}
                            >
                                {sentence}{" "}
                            </span>
                        ))}
                    </p>
                </div>

                {/* Commandes */}
                <div className="flex shrink-0 flex-wrap items-center gap-2 md:w-60 md:flex-col md:items-stretch">
                    <button
                        ref={confirmRef}
                        type="button"
                        onClick={onNext}
                        className={`flex items-center justify-center gap-2 rounded-md bg-[#e0b252] px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-[#1b1d1f] hover:bg-[#f0c466] ${FOCUS}`}
                    >
                        <Check size={16} /> {isLast ? "Terminer et jouer" : "Compris"}
                        <kbd className="ml-1 rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px] font-bold">Entrée</kbd>
                    </button>
                    <div className="flex items-center gap-1.5 text-sm text-[#a39d8a]">
                        <button
                            type="button"
                            onClick={onPrev}
                            disabled={index === 0}
                            aria-label="Étape précédente"
                            className={`rounded-md p-2 hover:text-white disabled:opacity-30 ${FOCUS}`}
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setReplay((n) => n + 1)}
                            aria-label="Réécouter"
                            title="Réécouter"
                            className={`rounded-md p-2 hover:text-white ${FOCUS}`}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setMuted((m) => !m)}
                            disabled={!supported}
                            aria-label={muted ? "Activer la voix" : "Couper la voix"}
                            aria-pressed={muted}
                            title={muted ? "Activer la voix" : "Couper la voix"}
                            className={`rounded-md p-2 hover:text-white disabled:opacity-30 ${FOCUS}`}
                        >
                            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={isLast}
                            aria-label="Étape suivante"
                            className={`rounded-md p-2 hover:text-white disabled:opacity-30 ${FOCUS}`}
                        >
                            <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className={`ml-auto flex items-center gap-1 rounded-md px-2 py-2 text-xs hover:text-white ${FOCUS}`}
                        >
                            <X size={14} /> Passer
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VoiceBox;
