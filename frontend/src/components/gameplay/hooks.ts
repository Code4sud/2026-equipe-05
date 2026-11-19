import { useEffect, useState } from "react";

const prefersReducedMotion = () =>
    typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Affiche un texte caractère par caractère ; instantané si l'animation est réduite. */
export function useTypewriter(text: string, enabled: boolean, msPerChar = 14) {
    const [count, setCount] = useState(enabled ? 0 : text.length);

    useEffect(() => {
        if (!enabled || prefersReducedMotion()) {
            setCount(text.length);
            return;
        }
        setCount(0);
        const timer = window.setInterval(() => {
            setCount((current) => {
                if (current >= text.length) {
                    window.clearInterval(timer);
                    return current;
                }
                return current + 1;
            });
        }, msPerChar);
        return () => window.clearInterval(timer);
    }, [text, enabled, msPerChar]);

    return {
        shown: enabled ? text.slice(0, count) : text,
        done: !enabled || count >= text.length,
        skip: () => setCount(text.length),
    };
}
