/**
 * Décor de la scène : le lieu de travail du joueur.
 * Ici, une salle de contrôle donnant sur un parc éolien en mer (dessin SVG).
 *
 * FUTURE INTEGRATION BACKEND / IA : le décor pourra être choisi par le scénario.
 */
export const SceneBackdrop = () => (
    <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f6c98d" />
                <stop offset="1" stopColor="#d9e6ee" />
            </linearGradient>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5f95b4" />
                <stop offset="1" stopColor="#2f5f80" />
            </linearGradient>
        </defs>
        {/* mur */}
        <rect width="800" height="450" fill="#2a3138" />
        {/* grande baie vitrée */}
        <rect x="30" y="34" width="440" height="270" rx="6" fill="#161b20" />
        <rect x="40" y="44" width="420" height="250" fill="url(#sky)" />
        <rect x="40" y="170" width="420" height="124" fill="url(#sea)" />
        {/* éoliennes */}
        {[
            { x: 120, s: 1 },
            { x: 250, s: 0.75 },
            { x: 360, s: 0.55 },
        ].map(({ x, s }) => (
            <g key={x} transform={`translate(${x} 172) scale(${s})`} stroke="#f4f4f1" strokeLinecap="round">
                <path d="M0 0 L0 -92" strokeWidth="5" />
                <g transform="translate(0 -92)" strokeWidth="4">
                    <path d="M0 0 L0 -46" />
                    <path d="M0 0 L40 23" />
                    <path d="M0 0 L-40 23" />
                </g>
            </g>
        ))}
        {/* montants de la baie */}
        <path d="M250 44 L250 294 M40 170 L460 170" stroke="#161b20" strokeWidth="6" opacity="0.55" />
        {/* mur d'écrans */}
        {[0, 1].map((row) =>
            [0, 1].map((col) => (
                <g key={`${row}${col}`} transform={`translate(${500 + col * 140} ${44 + row * 130})`}>
                    <rect width="124" height="112" rx="5" fill="#0d1215" stroke="#41505b" strokeWidth="3" />
                    <path
                        d={row === 0 ? "M10 80 L30 60 L50 70 L70 36 L90 52 L114 24" : "M10 84 L114 84 M10 66 L114 66 M10 48 L80 48 M10 30 L100 30"}
                        stroke={col === 0 ? "#6fd08a" : "#e0b252"}
                        strokeWidth="3"
                        fill="none"
                        opacity="0.85"
                    />
                </g>
            )),
        )}
        {/* bureau */}
        <rect y="368" width="800" height="82" fill="#3a2f26" />
        <rect y="368" width="800" height="8" fill="#52433a" />
    </svg>
);

/** Animations de la scène (apparition de la bulle, léger balancement du personnage), coupées si l'animation est réduite. */
export const SceneStyles = () => (
    <style>{`
        @media (prefers-reduced-motion: no-preference) {
            @keyframes agora-pop { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
            @keyframes agora-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            @keyframes agora-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
            .agora-pop { animation: agora-pop .22s ease-out both; }
            .agora-bob { animation: agora-bob 1.1s ease-in-out infinite; }
            .agora-in { animation: agora-in .35s ease-out both; }
        }
    `}</style>
);
