import { useState } from "react";
import type { Character } from "./types";
import { COMM_STATUS, EXPRESSIONS, LABEL, MUTED, SURFACE, SURFACE_INNER } from "./ui";
import { useTypewriter } from "./hooks";

/**
 * Affichage générique des interlocuteurs.
 *
 * Aucun de ces composants ne connaît de métier, de scénario ni d'apparence : ils
 * affichent simplement le contrat `Character` (id, name, role, avatarUrl,
 * expression, dialogue, status).
 *
 * FUTURE INTEGRATION IA :
 * recevoir ici les personnages générés (identité, avatar, expression, dialogue).
 * Quand `avatarUrl` est absent ou ne charge pas, un portrait neutre s'affiche.
 */

const hueFrom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 360;
    return hash;
};

/** Portrait de remplacement : silhouette volontairement neutre et non thématique. */
const NeutralAvatar = ({ seed }: { seed: string }) => {
    const hue = hueFrom(seed);
    return (
        <svg viewBox="0 0 100 100" role="img" aria-label="Portrait indisponible" className="h-full w-full">
            <rect width="100" height="100" fill={`hsl(${hue} 18% 78%)`} />
            <circle cx="50" cy="38" r="17" fill={`hsl(${hue} 14% 46%)`} />
            <path d="M16 100 Q16 63 50 63 Q84 63 84 100 Z" fill={`hsl(${hue} 14% 38%)`} />
        </svg>
    );
};

/** Portrait rond avec anneau d'expression ; bascule sur le portrait neutre si l'image échoue. */
const Portrait = ({ character, size }: { character: Character; size: string }) => {
    const [failed, setFailed] = useState(false);
    const expression = EXPRESSIONS[character.expression] ?? EXPRESSIONS.neutral;
    const showImage = !!character.avatarUrl && !failed;
    return (
        <div className={`relative shrink-0 overflow-hidden rounded-full ring-[3px] ${expression.ring} ${size}`}>
            {showImage ? (
                <img
                    src={character.avatarUrl ?? undefined}
                    alt={`Portrait de ${character.name}`}
                    className="h-full w-full object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <NeutralAvatar seed={character.id} />
            )}
        </div>
    );
};

const StatusLine = ({ character }: { character: Character }) => {
    const expression = EXPRESSIONS[character.expression] ?? EXPRESSIONS.neutral;
    const status = COMM_STATUS[character.status] ?? COMM_STATUS.idle;
    const ExpressionIcon = expression.icon;
    return (
        <div className={`flex items-center gap-3 text-xs ${MUTED}`}>
            <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                {status.label}
            </span>
            <span className="flex items-center gap-1" title={`Expression : ${expression.label}`}>
                <ExpressionIcon size={13} /> {expression.label}
            </span>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Carte simple (briefing)                                             */
/* ------------------------------------------------------------------ */

export const CharacterDisplay = ({ character }: { character: Character }) => (
    <article aria-label={`${character.name}, ${character.role}`} className={`${SURFACE} flex items-center gap-4 p-4`}>
        <Portrait character={character} size="h-16 w-16" />
        <div className="min-w-0">
            <p className="truncate text-base font-bold">{character.name}</p>
            <p className={`truncate text-sm ${MUTED}`}>{character.role}</p>
            <div className="mt-1">
                <StatusLine character={character} />
            </div>
        </div>
    </article>
);

/** Affiche un ou plusieurs interlocuteurs côte à côte. */
export const CharacterGroup = ({ characters }: { characters: Character[] }) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {characters.map((character) => (
            <CharacterDisplay key={character.id} character={character} />
        ))}
    </div>
);

/* ------------------------------------------------------------------ */
/* Scène d'appel (jeu) : celui qui parle au premier plan               */
/* ------------------------------------------------------------------ */

const pickSpeaker = (characters: Character[]): Character | undefined =>
    characters.find((c) => c.status === "speaking") ?? [...characters].reverse().find((c) => c.dialogue) ?? characters[0];

export const CallStage = ({ characters }: { characters: Character[] }) => {
    const speaker = pickSpeaker(characters);
    const speaking = speaker?.status === "speaking";
    const { shown, done, skip } = useTypewriter(speaker?.dialogue ?? "", speaking);
    if (!speaker) return null;

    return (
        <section className={`${SURFACE} p-5`} aria-label="Interlocuteurs">
            <p className={`${LABEL} mb-3`}>EN LIGNE</p>

            <div className="flex items-start gap-4">
                <Portrait character={speaker} size="h-20 w-20" />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                        <p className="text-lg font-bold">{speaker.name}</p>
                        <p className={`text-sm ${MUTED}`}>{speaker.role}</p>
                    </div>
                    <StatusLine character={speaker} />

                    <button
                        type="button"
                        onClick={skip}
                        disabled={done}
                        aria-label="Afficher la réplique en entier"
                        className={`${SURFACE_INNER} mt-3 block min-h-[4.5rem] w-full p-3.5 text-left text-base leading-relaxed disabled:cursor-default`}
                    >
                        {speaker.dialogue ? (
                            <>
                                « {shown}
                                {done ? " »" : <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-[#2b2a26] align-middle motion-reduce:animate-none" />}
                            </>
                        ) : (
                            <span className={`italic ${MUTED}`}>Pas encore de contact.</span>
                        )}
                    </button>
                </div>
            </div>

            <ul className="mt-4 flex flex-wrap gap-2 border-t border-[#ddd2b6] pt-3" aria-label="Contacts">
                {characters.map((character) => {
                    const active = character.id === speaker.id;
                    return (
                        <li
                            key={character.id}
                            className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm ${
                                active ? "border-[#2b2a26] bg-[#faf6ea] font-semibold" : "border-[#ddd2b6] text-[#6b6657]"
                            }`}
                        >
                            <Portrait character={character} size="h-7 w-7" />
                            {character.name}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default CharacterDisplay;
