import { useState } from "react";
import type { Character } from "./types";
import { COMM_STATUS, EXPRESSIONS } from "./ui";
import { useTypewriter } from "./hooks";

/**
 * Affichage générique d'un interlocuteur.
 *
 * Ce composant ne connaît ni métier, ni scénario, ni apparence : il affiche
 * simplement le contrat `Character` (id, name, role, avatarUrl, expression,
 * dialogue, status).
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
            <rect width="100" height="100" fill={`hsl(${hue} 22% 17%)`} />
            <circle cx="50" cy="38" r="17" fill={`hsl(${hue} 14% 46%)`} />
            <path d="M16 100 Q16 63 50 63 Q84 63 84 100 Z" fill={`hsl(${hue} 14% 38%)`} />
        </svg>
    );
};

interface CharacterDisplayProps {
    character: Character;
}

export const CharacterDisplay = ({ character }: CharacterDisplayProps) => {
    const [imageFailed, setImageFailed] = useState(false);
    const speaking = character.status === "speaking";
    const { shown, done, skip } = useTypewriter(character.dialogue, speaking);

    const expression = EXPRESSIONS[character.expression] ?? EXPRESSIONS.neutral;
    const status = COMM_STATUS[character.status] ?? COMM_STATUS.idle;
    const ExpressionIcon = expression.icon;
    const showImage = !!character.avatarUrl && !imageFailed;

    return (
        <article
            aria-label={`${character.name}, ${character.role}`}
            className={`flex min-w-0 flex-col rounded-xl border p-3 transition-colors ${
                speaking ? "border-cyan-400/50 bg-cyan-400/5" : "border-white/10 bg-[#0d1520]"
            }`}
        >
            <div className="flex items-center gap-3">
                <div className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ${expression.ring}`}>
                    {showImage ? (
                        <img
                            src={character.avatarUrl ?? undefined}
                            alt={`Portrait de ${character.name}`}
                            className="h-full w-full object-cover"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <NeutralAvatar seed={character.id} />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{character.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{character.role}</p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${status.dot} ${speaking ? "animate-pulse motion-reduce:animate-none" : ""}`}
                            />
                            {status.label}
                        </span>
                        <span className="flex items-center gap-1" title={`Expression : ${expression.label}`}>
                            <ExpressionIcon size={12} /> {expression.label}
                        </span>
                    </div>
                </div>
            </div>

            <div
                className={`mt-3 min-h-[3.25rem] rounded-lg border p-2.5 text-xs leading-relaxed ${
                    speaking
                        ? "border-cyan-400/20 bg-[#0a121c] text-slate-100"
                        : "border-white/5 bg-[#0a121c]/60 text-slate-500"
                }`}
            >
                {character.dialogue ? (
                    speaking ? (
                        <button
                            type="button"
                            onClick={skip}
                            disabled={done}
                            className="block w-full text-left disabled:cursor-default"
                            aria-label="Afficher la réplique en entier"
                        >
                            {shown}
                            {!done && <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-cyan-400 align-middle" />}
                        </button>
                    ) : (
                        <p className="line-clamp-2">{character.dialogue}</p>
                    )
                ) : (
                    <p className="italic">Pas encore de contact.</p>
                )}
            </div>
        </article>
    );
};

interface CharacterGroupProps {
    characters: Character[];
}

/** Affiche un ou plusieurs interlocuteurs côte à côte. */
export const CharacterGroup = ({ characters }: CharacterGroupProps) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {characters.map((character) => (
            <CharacterDisplay key={character.id} character={character} />
        ))}
    </div>
);

export default CharacterDisplay;
