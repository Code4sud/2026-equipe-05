import { Clock, MapPin, Target } from "lucide-react";
import type { Character, Expression } from "./types";
import { Sprite } from "./Sprite";
import { SceneBackdrop, SceneStyles } from "./SceneBackdrop";

/**
 * Scène de dialogue : un seul interlocuteur en face de toi, dans ton lieu de
 * travail, avec sa bulle. La bulle apparaît quand il parle, disparaît quand tu
 * réponds (c'est alors ta bulle, puis trois points pendant qu'il réfléchit).
 */

interface DialogueStageProps {
    character: Character;
    expression: Expression;
    time: string;
    place?: string;
    title: string;
    objectiveLabel?: string;
    /** Texte déjà affiché dans la bulle du personnage (`null` : pas de bulle). */
    shown: string | null;
    /** Texte complet (lu par les lecteurs d'écran, sans l'effet machine à écrire). */
    fullText: string | null;
    /** Trois points : le personnage réfléchit à ta réponse. */
    thinking: boolean;
    /** Ta réponse, affichée dans ta bulle. */
    playerText: string | null;
    /** Le texte est entièrement affiché. */
    done: boolean;
    /** Il reste des répliques à lire. */
    more: boolean;
    onAdvance: () => void;
    className?: string;
}

export const DialogueStage = ({
    character,
    expression,
    time,
    place,
    title,
    objectiveLabel,
    shown,
    fullText,
    thinking,
    playerText,
    done,
    more,
    onAdvance,
    className
}: DialogueStageProps) => (
    <section
        aria-label="Interlocuteur"
        className={className ?? "relative h-[270px] sm:h-[300px] lg:h-[320px] overflow-hidden rounded-lg border border-black/50 bg-[#2a3138] text-[#2b2a26] shadow-[0_2px_0_rgba(0,0,0,0.3)]"}
    >
        <SceneStyles />
        <SceneBackdrop />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" aria-hidden />

        {/* Où, quand, pourquoi */}
        <div className="absolute inset-x-3 top-2.5 z-10 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-bold">
            <span className="flex items-center gap-1.5 rounded-full bg-[#14171a]/85 px-2.5 py-0.5 font-mono text-[#e0b252]">
                <Clock size={12} /> {time}
            </span>
            {place && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#14171a]/85 px-2.5 py-0.5 text-[#e8e2d0]">
                    <MapPin size={12} /> {place}
                </span>
            )}
            {objectiveLabel && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#e0b252] px-2.5 py-0.5 text-[#14171a] max-w-[320px] truncate">
                    <Target size={12} className="shrink-0" /> Objectif : {objectiveLabel}
                </span>
            )}
        </div>

        {/* Sprite, de face et parfaitement proportionné */}
        <div key={character.id} className="agora-in absolute bottom-0 right-[2%] z-10 h-[72%] sm:right-[8%] sm:h-[86%]">
            <div className={thinking || (shown !== null && !done) ? "agora-bob h-full" : "h-full"}>
                <Sprite character={character} expression={expression} />
            </div>
        </div>

        {/* Plaque d'identité */}
        <div className="absolute bottom-2.5 right-2.5 z-20 rounded-md border border-[#d6cbb0] bg-[#f3ecd9] px-2.5 py-1 text-right shadow sm:right-[calc(8%+4px)]">
            <p className="text-xs sm:text-sm font-bold leading-tight">{character.name}</p>
            <p className="text-[10px] sm:text-xs text-[#6b6657]">{character.role}</p>
        </div>

        {/* Zone cliquable : avancer dans le dialogue */}
        <button
            type="button"
            onClick={onAdvance}
            aria-label="Réplique suivante"
            tabIndex={-1}
            className="absolute inset-0 z-20 cursor-pointer bg-transparent focus:outline-none"
        />

        {/* Bulle du personnage */}
        {shown !== null && (
            <div key={fullText} className="agora-pop pointer-events-none absolute left-3 right-3 top-11 z-30 sm:left-4 sm:top-12 sm:right-auto sm:max-w-[62%]">
                <div className="relative rounded-2xl border-2 border-[#2b2a26] bg-[#fbf7ea] px-3.5 py-2.5 text-sm sm:text-base leading-relaxed shadow-[0_4px_0_rgba(0,0,0,0.35)]" aria-hidden>
                    {shown}
                    {!done && <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-[#2b2a26] align-middle motion-reduce:animate-none" />}
                    {done && more && (
                        <span className="mt-1.5 block text-right text-[10px] font-bold uppercase tracking-wider text-[#8b8570]">Suite ▶ · Entrée</span>
                    )}
                    <span className="absolute -bottom-[10px] right-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-[#2b2a26] bg-[#fbf7ea]" />
                </div>
            </div>
        )}
        <p className="sr-only" aria-live="polite">
            {fullText ? `${character.name} : ${fullText}` : ""}
        </p>

        {/* Trois points : il réfléchit */}
        {thinking && (
            <div className="agora-pop pointer-events-none absolute left-4 top-12 z-30" aria-label={`${character.name} réfléchit`}>
                <div className="relative flex gap-1.5 rounded-2xl border-2 border-[#2b2a26] bg-[#fbf7ea] px-4 py-3 shadow-[0_4px_0_rgba(0,0,0,0.35)]">
                    {[0, 1, 2].map((dot) => (
                        <span key={dot} className="h-2 w-2 rounded-full bg-[#6b6657] motion-safe:animate-bounce" style={{ animationDelay: `${dot * 120}ms` }} />
                    ))}
                </div>
            </div>
        )}

        {/* Ta bulle */}
        {playerText && (
            <div key={playerText} className="agora-pop pointer-events-none absolute bottom-3 left-3 right-3 z-30 sm:left-4 sm:right-auto sm:max-w-[55%]">
                <div className="relative rounded-2xl border-2 border-[#e0b252] bg-[#2b2a26] px-4 py-2 text-xs sm:text-sm leading-snug text-[#f3ecd9] shadow-[0_4px_0_rgba(0,0,0,0.35)]">
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e0b252]">Toi</p>
                    {playerText}
                </div>
            </div>
        )}
    </section>
);

export default DialogueStage;
