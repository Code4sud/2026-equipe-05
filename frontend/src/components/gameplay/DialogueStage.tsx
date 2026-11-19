import { Clock, MapPin, Target } from "lucide-react";
import type { Character, Expression } from "./types";
import { Sprite } from "./Sprite";
import { SceneBackdrop, SceneStyles } from "./SceneBackdrop";

/**
 * Scène de dialogue : un seul interlocuteur en face de toi, dans ton lieu de
 * travail, avec sa bulle. La bulle apparaît quand il parle, disparaît quand tu
 * réponds (c'est alors ta bulle, puis trois points pendant qu'il réfléchit).
 *
 * FUTURE INTEGRATION IA : `character` (identité, sprite, expression) et le texte
 * des bulles viendront des agents ; ce composant ne fait qu'afficher.
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
}

export const DialogueStage = ({ character, expression, time, place, title, objectiveLabel, shown, fullText, thinking, playerText, done, more, onAdvance }: DialogueStageProps) => (
    <section aria-label="Interlocuteur" className="relative h-[470px] overflow-hidden rounded-lg border border-black/50 bg-[#2a3138] text-[#2b2a26] shadow-[0_2px_0_rgba(0,0,0,0.3)] sm:h-[470px]">
        <SceneStyles />
        <SceneBackdrop />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" aria-hidden />

        {/* Où, quand, pourquoi */}
        <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="flex items-center gap-1.5 rounded-full bg-[#14171a]/85 px-3 py-1 font-mono text-[#e0b252]">
                <Clock size={13} /> {time}
            </span>
            {place && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#14171a]/85 px-3 py-1 text-[#e8e2d0]">
                    <MapPin size={13} /> {place}
                </span>
            )}
            {objectiveLabel && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#e0b252] px-3 py-1 text-[#14171a]">
                    <Target size={13} /> Objectif : {objectiveLabel}
                </span>
            )}
        </div>

        {/* Sprite, de face */}
        <div key={character.id} className="agora-in absolute bottom-0 right-[2%] z-10 h-[50%] sm:right-[14%] sm:h-[74%]">
            <div className={thinking || (shown !== null && !done) ? "agora-bob h-full" : "h-full"}>
                <Sprite character={character} expression={expression} />
            </div>
        </div>

        {/* Plaque d'identité */}
        <div className="absolute bottom-3 right-3 z-20 rounded-md border border-[#d6cbb0] bg-[#f3ecd9] px-3 py-1.5 text-right shadow sm:right-[calc(14%+6px)]">
            <p className="text-sm font-bold leading-tight">{character.name}</p>
            <p className="text-xs text-[#6b6657]">{character.role}</p>
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
            <div key={fullText} className="agora-pop pointer-events-none absolute left-3 right-3 top-24 z-30 sm:top-14 sm:right-auto sm:max-w-[60%]">
                <div className="relative rounded-2xl border-2 border-[#2b2a26] bg-[#fbf7ea] px-4 py-3 text-base leading-relaxed sm:px-5 sm:py-4 sm:text-lg shadow-[0_4px_0_rgba(0,0,0,0.35)]" aria-hidden>
                    {shown}
                    {!done && <span className="ml-0.5 inline-block h-5 w-1 animate-pulse bg-[#2b2a26] align-middle motion-reduce:animate-none" />}
                    {done && more && (
                        <span className="mt-2 block text-right text-xs font-bold uppercase tracking-wider text-[#8b8570]">Suite ▶ · Entrée</span>
                    )}
                    <span className="absolute -bottom-[11px] right-10 h-5 w-5 rotate-45 border-b-2 border-r-2 border-[#2b2a26] bg-[#fbf7ea] sm:right-8" />
                </div>
            </div>
        )}
        <p className="sr-only" aria-live="polite">
            {fullText ? `${character.name} : ${fullText}` : ""}
        </p>

        {/* Trois points : il réfléchit */}
        {thinking && (
            <div className="agora-pop pointer-events-none absolute left-3 top-24 z-30 sm:top-14" aria-label={`${character.name} réfléchit`}>
                <div className="relative flex gap-1.5 rounded-2xl border-2 border-[#2b2a26] bg-[#fbf7ea] px-5 py-4 shadow-[0_4px_0_rgba(0,0,0,0.35)]">
                    {[0, 1, 2].map((dot) => (
                        <span key={dot} className="h-2.5 w-2.5 rounded-full bg-[#6b6657] motion-safe:animate-bounce" style={{ animationDelay: `${dot * 120}ms` }} />
                    ))}
                </div>
            </div>
        )}

        {/* Ta bulle */}
        {playerText && (
            <div key={playerText} className="agora-pop pointer-events-none absolute bottom-16 left-3 right-3 z-30 sm:right-auto sm:max-w-[52%]">
                <div className="relative rounded-2xl border-2 border-[#e0b252] bg-[#2b2a26] px-5 py-3.5 text-base leading-relaxed text-[#f3ecd9] shadow-[0_4px_0_rgba(0,0,0,0.35)]">
                    <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-[#e0b252]">Toi</p>
                    {playerText}
                </div>
            </div>
        )}
    </section>
);
