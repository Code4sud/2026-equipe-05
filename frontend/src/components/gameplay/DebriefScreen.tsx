import { Lightbulb, RotateCcw, Trophy } from "lucide-react";
import type { DebriefContent, EndResult, IndicatorView, JournalEntry, Tone } from "./types";
import { StatusIndicators } from "./StatusIndicators";
import { BTN_DARK, LABEL, MUTED, SURFACE, TONE } from "./ui";

interface DebriefScreenProps {
    result: EndResult;
    content: DebriefContent;
    indicators: IndicatorView[];
    journal: JournalEntry[];
    onRestart: () => void;
    onQuit: () => void;
}

const STATUS_TONE = { success: "good", partial: "warn", failure: "bad" } as const;
const scoreTone = (score: number): Tone => (score >= 70 ? "good" : score >= 40 ? "warn" : "bad");

/** Dernière étape de la boucle : bilan et compétences mobilisées. */
export const DebriefScreen = ({ result, content, indicators, journal, onRestart, onQuit }: DebriefScreenProps) => {
    const tone = TONE[STATUS_TONE[result.status]];
    return (
        <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
            <section className={`rounded-lg border-2 p-6 md:p-8 ${tone.border} ${tone.bg} text-[#2b2a26]`}>
                <p className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${tone.text}`}>
                    <Trophy size={15} /> BILAN DE MISSION
                </p>
                <h1 className="text-3xl font-bold">{content.headline}</h1>
                <p className="mt-3 max-w-3xl text-base leading-relaxed">{content.summary}</p>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-5">
                    <section className={`${SURFACE} p-6`}>
                        <p className={`${LABEL} mb-5`}>COMPÉTENCES MOBILISÉES</p>
                        <div className="space-y-5">
                            {content.skills.map((skill) => (
                                <div key={skill.label}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="text-base font-semibold">{skill.label}</span>
                                        <span className="font-mono text-sm font-bold">{skill.score}/100</span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-[#ddd2b6]">
                                        <div
                                            className={`h-full rounded-full ${TONE[scoreTone(skill.score)].bar}`}
                                            style={{ width: `${Math.max(2, skill.score)}%` }}
                                        />
                                    </div>
                                    <p className={`mt-2 text-sm leading-relaxed ${MUTED}`}>{skill.comment}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={`${SURFACE} p-6`}>
                        <p className={`${LABEL} mb-4 flex items-center gap-2`}>
                            <Lightbulb size={14} /> CE QUE TU AS DÉCOUVERT SUR CE MÉTIER
                        </p>
                        <ul className="space-y-3">
                            {content.insights.map((insight) => (
                                <li key={insight} className="flex items-start gap-3 text-base leading-relaxed">
                                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2b2a26]" />
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className={`${SURFACE} p-6`}>
                        <p className={`${LABEL} mb-4`}>TES RÉPONSES, DANS L'ORDRE</p>
                        <ol className="space-y-3">
                            {journal.map((entry) => (
                                <li key={entry.id} className="flex items-start gap-3">
                                    <span className={`mt-0.5 font-mono text-sm ${MUTED}`}>{entry.time}</span>
                                    <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${TONE[entry.tone].bar}`} />
                                    <span className="min-w-0 text-sm leading-relaxed">
                                        <span className="font-semibold">{entry.label}</span>
                                        <span className={MUTED}> — {entry.text}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>

                <aside className="space-y-5">
                    <StatusIndicators indicators={indicators} variant="stack" />
                    <div className="flex flex-col gap-3">
                        <button type="button" onClick={onRestart} className={`${BTN_DARK} flex items-center justify-center gap-2 !bg-[#e0b252] !py-3 !text-[#14171a] hover:!bg-[#efc566]`}>
                            <RotateCcw size={16} /> Rejouer la mission
                        </button>
                        <button
                            type="button"
                            onClick={onQuit}
                            className="rounded-md border border-[#6b6657] px-5 py-3 text-sm text-[#e8e2d0] transition-colors hover:border-[#e8e2d0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b252]"
                        >
                            Quitter
                        </button>
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default DebriefScreen;
