import { useState } from "react";
import type { Character, Expression } from "./types";

/**
 * Sprite de l'interlocuteur, en pied et de face.
 *
 * - `avatarUrl` présent : l'image du personnage (FUTURE INTEGRATION IA : sprites générés).
 * - sinon, ou si l'image ne charge pas : buste neutre dessiné en SVG, volontairement
 *   sans genre ni apparence précise ; seule l'expression du visage change.
 */

const hueFrom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 360;
    return hash;
};

const FACES: Record<Expression, { browL: string; browR: string; mouth: string; mouthFill?: boolean }> = {
    neutral: { browL: "M70 70 L94 70", browR: "M106 70 L130 70", mouth: "M88 116 L112 116" },
    happy: { browL: "M70 68 Q82 62 94 68", browR: "M106 68 Q118 62 130 68", mouth: "M84 112 Q100 128 116 112" },
    concerned: { browL: "M70 74 L94 64", browR: "M106 64 L130 74", mouth: "M88 120 Q100 112 112 120" },
    angry: { browL: "M70 62 L94 72", browR: "M106 72 L130 62", mouth: "M86 122 Q100 110 114 122" },
    surprised: { browL: "M70 62 Q82 54 94 62", browR: "M106 62 Q118 54 130 62", mouth: "M100 112 m-7 0 a7 9 0 1 0 14 0 a7 9 0 1 0 -14 0", mouthFill: true },
    thinking: { browL: "M70 70 L94 70", browR: "M106 62 Q118 56 130 64", mouth: "M92 118 L110 114" },
};

const NeutralSprite = ({ character, expression }: { character: Character; expression: Expression }) => {
    const hue = hueFrom(character.id);
    const face = FACES[expression] ?? FACES.neutral;
    return (
        <svg viewBox="0 0 200 260" role="img" aria-label={`Portrait indisponible : ${character.name}`} className="h-full w-auto drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]">
            {/* corps */}
            <path d="M12 260 Q12 168 66 156 L134 156 Q188 168 188 260 Z" fill={`hsl(${hue} 22% 34%)`} />
            <path d="M82 156 L100 186 L118 156 Z" fill={`hsl(${hue} 20% 82%)`} />
            {/* cou et tête */}
            <rect x="86" y="132" width="28" height="30" rx="8" fill={`hsl(${hue} 18% 62%)`} />
            <circle cx="100" cy="88" r="48" fill={`hsl(${hue} 20% 70%)`} />
            {/* visage */}
            <circle cx="82" cy="90" r="5" fill="#2b2a26" />
            <circle cx="118" cy="90" r="5" fill="#2b2a26" />
            <path d={face.browL} stroke="#2b2a26" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d={face.browR} stroke="#2b2a26" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d={face.mouth} stroke="#2b2a26" strokeWidth="5" strokeLinecap="round" fill={face.mouthFill ? "#2b2a26" : "none"} />
        </svg>
    );
};

export const Sprite = ({ character, expression }: { character: Character; expression: Expression }) => {
    const [failed, setFailed] = useState(false);
    if (character.avatarUrl && !failed) {
        return (
            <img
                src={character.avatarUrl}
                alt={`${character.name}, ${character.role}`}
                className="h-full w-auto object-contain drop-shadow-[0_6px_6px_rgba(0,0,0,0.35)]"
                onError={() => setFailed(true)}
            />
        );
    }
    return <NeutralSprite character={character} expression={expression} />;
};
