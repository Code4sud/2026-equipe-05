import { ClipboardList, Play } from "lucide-react";
import type { BriefingContent, Character } from "./types";
import { CharacterGroup } from "./CharacterDisplay";
import { SURFACE } from "./ui";

interface BriefingScreenProps {
    briefing: BriefingContent;
    role: string;
    location: string;
    characters: Character[];
    onStart: () => void;
}

/** Étape 1 de la boucle : prise de poste et découverte de l'environnement. */
export const BriefingScreen = ({ briefing, role, location, characters, onStart }: BriefingScreenProps) => (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center gap-6 p-5 md:p-8">
        <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-400">{briefing.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight md:text-3xl">{briefing.headline}</h1>
            <p className="mt-2 text-xs text-slate-500">
                {role} · {location}
            </p>
        </div>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <section className={`${SURFACE} space-y-4 p-6`}>
                {briefing.narrative.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-slate-300">
                        {paragraph}
                    </p>
                ))}
                <p className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs leading-relaxed text-slate-300">
                    {briefing.roleSummary}
                </p>
            </section>

            <section className={`${SURFACE} p-6`}>
                <div className="mb-4 flex items-center gap-2 text-cyan-400">
                    <ClipboardList size={16} />
                    <span className="text-[10px] font-bold tracking-[0.16em]">TA MISSION</span>
                </div>
                <ul className="space-y-2.5">
                    {briefing.objectives.map((objective) => (
                        <li key={objective} className="flex items-start gap-2.5 text-xs leading-snug text-slate-200">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                            {objective}
                        </li>
                    ))}
                </ul>
            </section>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
            {briefing.howToPlay.map((tip) => (
                <div key={tip.title} className="rounded-xl border border-white/10 bg-[#0d1520] p-4">
                    <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-cyan-400">{tip.title.toUpperCase()}</p>
                    <p className="text-xs leading-relaxed text-slate-400">{tip.text}</p>
                </div>
            ))}
        </div>

        <div>
            <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-slate-500">TES INTERLOCUTEURS</p>
            <CharacterGroup characters={characters} />
        </div>

        <div>
            <button
                type="button"
                onClick={onStart}
                className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-all hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                <Play size={16} /> Prendre mon poste
            </button>
        </div>
    </main>
);

export default BriefingScreen;
