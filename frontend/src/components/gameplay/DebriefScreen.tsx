import { Lightbulb, RotateCcw, Trophy } from "lucide-react";
import type { DebriefContent, EndCondition, IndicatorView, JournalEntry } from "./types";
import { StatusIndicators } from "./StatusIndicators";
import { formatClock } from "./simulation";
import { SURFACE, TONE } from "./ui";

interface DebriefScreenProps {
    result: EndCondition;
    content: DebriefContent;
    indicators: IndicatorView[];
    journal: JournalEntry[];
    onRestart: () => void;
    onQuit: () => void;
}

const STATUS_TONE = { success: "good", partial: "warn", failure: "bad" } as const;

/** Dernière étape de la boucle : bilan et compétences mobilisées. */
export const DebriefScreen = ({ result, content, indicators, journal, onRestart, onQuit }: DebriefScreenProps) => {
    const tone = TONE[STATUS_TONE[result.status]];
    return (
        <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
            <section className={`rounded-2xl border p-6 md:p-8 ${tone.border} ${tone.bg}`}>
                <p className={`mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] ${tone.text}`}>
                    <Trophy size={14} /> BILAN DE MISSION
                </p>
                <h1 className="text-2xl font-bold md:text-3xl">{content.headline}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-200">{content.summary}</p>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                    <section className={`${SURFACE} p-6`}>
                        <p className="mb-5 text-[10px] font-bold tracking-[0.16em] text-cyan-400">COMPÉTENCES MOBILISÉES</p>
                        <div className="space-y-5">
                            {content.skills.map((skill) => (
                                <div key={skill.label}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="text-sm font-semibold">{skill.label}</span>
                                        <span className="font-mono text-xs text-slate-400">{skill.score}/100</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(2, skill.score)}%` }} />
                                    </div>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{skill.comment}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={`${SURFACE} p-6`}>
                        <p className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-cyan-400">
                            <Lightbulb size={14} /> CE QUE TU AS DÉCOUVERT SUR CE MÉTIER
                        </p>
                        <ul className="space-y-3">
                            {content.insights.map((insight) => (
                                <li key={insight} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className={`${SURFACE} p-6`}>
                        <p className="mb-4 text-[10px] font-bold tracking-[0.16em] text-slate-400">TES DÉCISIONS, DANS L'ORDRE</p>
                        <ol className="space-y-3">
                            {journal.map((entry) => (
                                <li key={entry.id} className="flex items-start gap-3">
                                    <span className="mt-0.5 font-mono text-[11px] text-slate-500">{formatClock(entry.clock)}</span>
                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[entry.tone].bar}`} />
                                    <span className="min-w-0 text-xs leading-relaxed">
                                        <span className="font-semibold text-slate-200">{entry.label}</span>
                                        <span className="text-slate-400"> — {entry.text}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>

                <aside className="space-y-5">
                    <StatusIndicators indicators={indicators} />
                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={onRestart}
                            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <RotateCcw size={15} /> Rejouer la mission
                        </button>
                        <button
                            type="button"
                            onClick={onQuit}
                            className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition-all hover:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
