import { Play, Target, FileText } from "lucide-react";
import type { BriefingContent, Character } from "./types";
import { CharacterGroup } from "./CharacterDisplay";
import { BTN_DARK, LABEL, MUTED, SURFACE, SURFACE_INNER } from "./ui";

interface BriefingScreenProps {
    briefing: BriefingContent;
    role: string;
    location: string;
    characters: Character[];
    onStart: () => void;
}

/** Étape 1 de la boucle : prise de poste et découverte de l'environnement. */
export const BriefingScreen = ({ briefing, role, location, characters, onStart }: BriefingScreenProps) => (
    <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-5xl flex-col justify-center gap-6 p-5 md:p-8">
        <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e0b252]">{briefing.eyebrow}</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight text-[#e8e2d0]">{briefing.headline}</h1>
            <p className="mt-2 text-sm text-[#a39d8a]">
                {role} · {location}
            </p>
        </div>

        {/* Organisation verticale des deux bulles de texte pour une lecture spacieuse et aérée */}
        <div className="space-y-5">
            {/* 1. Grand encart explicatif de la mission et du contexte */}
            <section className={`${SURFACE} space-y-4 p-6 md:p-8`}>
                <div className="flex items-center gap-2 border-b border-[#ddd2b6] pb-3">
                    <FileText size={18} className="text-[#2c5a7a]" />
                    <p className={LABEL}>PRÉSENTATION DU CONTEXTE PROFESSIONNEL</p>
                </div>
                {briefing.narrative.map((paragraph) => (
                    <p key={paragraph} className="text-base md:text-lg leading-relaxed text-[#2b2a26]">
                        {paragraph}
                    </p>
                ))}
                {briefing.roleSummary && (
                    <div className={`${SURFACE_INNER} p-4 text-sm md:text-base leading-relaxed text-[#4a463b]`}>
                        <span className="font-bold text-[#2b2a26]">Ton rôle : </span>
                        {briefing.roleSummary}
                    </div>
                )}
            </section>

            {/* 2. Liste des missions / objectifs placée juste en-dessous */}
            <section className={`${SURFACE} p-6 md:p-8`}>
                <div className="flex items-center gap-2 border-b border-[#ddd2b6] pb-3 mb-4">
                    <Target size={18} className="text-[#2c5a7a]" />
                    <p className={LABEL}>OBJECTIFS À ATTEINDRE</p>
                </div>
                <ul className="space-y-3.5">
                    {briefing.objectives.map((objective, index) => (
                        <li key={objective} className="flex items-start gap-3 text-base md:text-lg leading-snug text-[#2b2a26]">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2b2a26] text-xs font-bold text-[#f3ecd9] mt-0.5">
                                {index + 1}
                            </span>
                            <span className="pt-0.5">{objective}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>

        {/* Interlocuteurs */}
        <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#a39d8a]">TES INTERLOCUTEURS</p>
            <CharacterGroup characters={characters} />
        </div>

        {/* Action : prise de poste */}
        <div>
            <button
                type="button"
                onClick={onStart}
                className={`${BTN_DARK} flex items-center gap-2 !bg-[#e0b252] !px-8 !py-4 text-base md:text-lg font-bold !text-[#14171a] shadow-[0_2px_0_rgba(0,0,0,0.3)] hover:!bg-[#efc566]`}
            >
                <Play size={20} /> Prendre mon poste
            </button>
        </div>
    </main>
);

export default BriefingScreen;
