import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Visite guidée : état partagé entre la boîte vocale et les zones de l'écran.
 *
 * - `active`   : la visite est en cours (les zones non ciblées sont floutées) ;
 * - `targetId` : zone mise en lumière ; `null` = tout flouté, `"all"` = tout net.
 */
export interface GuideState {
    active: boolean;
    targetId: string | null;
}

export const GUIDE_ALL = "all";

const GuideContext = createContext<GuideState>({ active: false, targetId: null });

export const GuideProvider = GuideContext.Provider;
export const useGuide = () => useContext(GuideContext);

interface GuideZoneProps {
    id: string;
    /** Nom affiché sur l'étiquette « ICI » quand la zone est ciblée. */
    label: string;
    children: ReactNode;
    className?: string;
}

const prefersReducedMotion = () =>
    typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Enveloppe une rubrique de l'écran.
 *
 * Pendant la visite : la rubrique ciblée reste nette et reçoit un cadre doré avec
 * une étiquette « ICI » ; les autres sont floutées, assombries et rendues
 * inertes (ni clic, ni focus clavier) pour que la voix ne soit pas court-circuitée.
 * Hors visite, l'enveloppe est transparente.
 */
export const GuideZone = ({ id, label, children, className = "" }: GuideZoneProps) => {
    const { active, targetId } = useGuide();
    const ref = useRef<HTMLDivElement>(null);

    const revealed = !active || targetId === GUIDE_ALL;
    const focused = active && targetId === id;
    const dimmed = !revealed && !focused;

    useEffect(() => {
        const node = ref.current;
        if (focused && node && typeof node.scrollIntoView === "function") {
            node.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
        }
    }, [focused]);

    // `inert` n'est pas encore typé partout : React 18 transmet l'attribut tel quel.
    const inertProps = (dimmed ? { inert: "" } : {}) as Record<string, unknown>;

    return (
        <div
            ref={ref}
            data-guide-zone={id}
            data-guide-state={focused ? "focus" : dimmed ? "dim" : "open"}
            className={`relative scroll-mb-72 scroll-mt-24 rounded-xl transition-all duration-300 ${
                focused ? "z-10 ring-4 ring-[#e0b252] ring-offset-4 ring-offset-[#23272b]" : ""
            } ${dimmed ? "pointer-events-none select-none opacity-35 blur-[5px]" : ""} ${className}`}
            {...inertProps}
        >
            {focused && (
                <span className="absolute -top-3.5 left-4 z-20 rounded-full bg-[#e0b252] px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-[#1b1d1f] shadow">
                    ▶ Ici : {label}
                </span>
            )}
            {children}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Mémoire locale : le guide s'ouvre tout seul la première fois         */
/* ------------------------------------------------------------------ */

const SEEN_KEY = "agora-explorer:guide-seen";

/** Lecture protégée : le stockage peut être indisponible (navigation privée…). */
export const hasSeenGuide = (missionId: string): boolean => {
    try {
        return window.localStorage.getItem(`${SEEN_KEY}:${missionId}`) === "1";
    } catch {
        return false;
    }
};

export const markGuideSeen = (missionId: string) => {
    try {
        window.localStorage.setItem(`${SEEN_KEY}:${missionId}`, "1");
    } catch {
        /* sans importance : le guide se rouvrira simplement */
    }
};
