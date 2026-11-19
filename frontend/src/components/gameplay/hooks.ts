import { useEffect, useState } from "react";

export const prefersReducedMotion = () =>
    typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Affiche un texte caractère par caractère ; instantané si désactivé ou si l'animation est réduite. */
export function useTypewriter(text: string, enabled: boolean, msPerChar = 16) {
    const instant = !enabled || prefersReducedMotion();
    // Le compteur est lié au texte : quand le texte change, on repart de zéro dès ce rendu (pas de flash).
    const [progress, setProgress] = useState({ text, count: instant ? text.length : 0 });
    const count = progress.text === text ? progress.count : 0;

    useEffect(() => {
        if (instant) return;
        setProgress({ text, count: 0 });
        const timer = window.setInterval(() => {
            setProgress((current) => {
                if (current.text !== text || current.count >= text.length) {
                    window.clearInterval(timer);
                    return current;
                }
                return { text, count: current.count + 1 };
            });
        }, msPerChar);
        return () => window.clearInterval(timer);
    }, [text, instant, msPerChar]);

    const done = instant || count >= text.length;
    return {
        shown: instant ? text : text.slice(0, count),
        done,
        skip: () => setProgress({ text, count: text.length }),
    };
}
