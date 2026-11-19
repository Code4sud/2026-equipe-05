import { useState } from "react";
import type { Character } from "./types";
import { COMM_STATUS, EXPRESSIONS, MUTED, SURFACE } from "./ui";

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
export const Portrait = ({ character, size }: { character: Character; size: string }) => {
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

export const StatusLine = ({ character }: { character: Character }) => {
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {characters.map((character) => (
            <CharacterDisplay key={character.id} character={character} />
        ))}
    </div>
);

export default CharacterDisplay;
