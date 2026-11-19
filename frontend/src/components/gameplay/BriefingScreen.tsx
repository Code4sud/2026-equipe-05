import { Play } from "lucide-react";
import type { BriefingContent, Character } from "./types";
import { CharacterGroup } from "./CharacterDisplay";
import { BTN_DARK, LABEL, MUTED, SURFACE } from "./ui";

interface BriefingScreenProps {
    briefing: BriefingContent;
    role: string;
    location: string;
    characters: Character[];
    onStart: () => void;
}

/** Étape 1 de la boucle : prise de poste et découverte de l'environnement. */
export const BriefingScreen = ({ briefing, role, location, characters, onStart }: BriefingScreenProps) => (
    <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-4xl flex-col justify-center gap-6 p-5 md:p-8">
        <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e0b252]">{briefing.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">{briefing.headline}</h1>
            <p className="mt-2 text-sm text-[#a39d8a]">
                {role} · {location}
            </p>
        </div>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <section className={`${SURFACE} space-y-4 p-6`}>
                {briefing.narrative.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed">
                        {paragraph}
                    </p>
                ))}
                <p className={`rounded-md border border-[#ddd2b6] bg-[#faf6ea] p-4 text-sm leading-relaxed ${MUTED}`}>
                    {briefing.roleSummary}
                </p>
            </section>

            <section className={`${SURFACE} p-6`}>
                <p className={`${LABEL} mb-3`}>TA MISSION</p>
                <ul className="space-y-3">
                    {briefing.objectives.map((objective, index) => (
                        <li key={objective} className="flex items-start gap-3 text-base leading-snug">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2b2a26] text-xs font-bold text-[#f3ecd9]">
                                {index + 1}
                            </span>
                            {objective}
                        </li>
                    ))}
                </ul>
            </section>
        </div>

        <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a39d8a]">TES INTERLOCUTEURS</p>
            <CharacterGroup characters={characters} />
        </div>

        <div>
            <button type="button" onClick={onStart} className={`${BTN_DARK} flex items-center gap-2 !bg-[#e0b252] !px-6 !py-3.5 text-base !text-[#14171a] hover:!bg-[#efc566]`}>
                <Play size={18} /> Prendre mon poste
            </button>
        </div>
    </main>
);

export default BriefingScreen;
