import type { DecisionDefinition } from "./types";
import { LABEL, MUTED, SURFACE, TONE, VERBS } from "./ui";

interface DecisionOverlayProps {
    decision: DecisionDefinition;
    speakerName?: string;
    onChoose: (optionId: string) => void;
}

const stampTone = (verb: string) => (verb === "accept" ? TONE.good : verb === "refuse" ? TONE.bad : TONE.neutral);

/**
 * Décision à prendre : une fiche posée au centre du bureau, le reste est assombri.
 * On ne peut rien faire d'autre tant qu'elle n'est pas tranchée.
 *
 * FUTURE INTEGRATION BACKEND : transmettre le choix du joueur à la session.
 */
export const DecisionOverlay = ({ decision, speakerName, onChoose }: DecisionOverlayProps) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
        <div role="dialog" aria-modal="true" aria-label="Décision à prendre" className={`${SURFACE} w-full max-w-xl p-6`}>
            <p className="text-xs font-bold uppercase tracking-wider text-[#a3302a]">
                DÉCISION · {decision.title.toUpperCase()}
            </p>
            {speakerName && <p className={`mt-1 text-sm ${MUTED}`}>{speakerName} attend ta réponse</p>}
            <p className="mt-3 text-lg font-semibold leading-snug">{decision.prompt}</p>

            <div role="group" aria-label="Décision en attente" className="mt-5 space-y-3">
                {decision.options.map((option) => {
                    const verb = VERBS[option.verb];
                    const Icon = verb.icon;
                    const tone = stampTone(option.verb);
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onChoose(option.id)}
                            className="block w-full rounded-md border-2 border-[#2b2a26] bg-[#faf6ea] p-4 text-left transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c5a7a] focus-visible:ring-offset-2"
                        >
                            <span className="flex items-start gap-3">
                                <span
                                    className={`mt-0.5 flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${tone.border} ${tone.bg} ${tone.text}`}
                                >
                                    <Icon size={12} /> {verb.label}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-base font-semibold leading-snug">{option.label}</span>
                                    {option.hint && <span className={`mt-0.5 block text-sm ${MUTED}`}>{option.hint}</span>}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
            <p className={`${LABEL} mt-4 text-center`}>Ta décision a des conséquences</p>
        </div>
    </div>
);

export default DecisionOverlay;
