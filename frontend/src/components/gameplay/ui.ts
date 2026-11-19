import type { ElementType } from "react";
import {
    AlertTriangle,
    Angry,
    Frown,
    Gauge,
    Handshake,
    Lightbulb,
    Meh,
    ShieldCheck,
    Smile,
} from "lucide-react";
import type { CommStatus, Expression, Tone } from "./types";

/**
 * Thème « bureau + papier » : fond de bureau sombre, documents clairs.
 * Tout ce qui est à lire est sur du papier (fort contraste) ; ce qui est un écran
 * (supervision) reste sombre. Les couleurs ne portent jamais seules le sens :
 * chaque état a aussi un texte ou une icône.
 */

/** Les missions référencent les icônes par clé : leurs données restent sérialisables. */
const ICONS: Record<string, ElementType> = {
    shield: ShieldCheck,
    gauge: Gauge,
    handshake: Handshake,
    alert: AlertTriangle,
};

export const getIcon = (key: string): ElementType => ICONS[key] ?? Gauge;

/** Tons pour éléments posés sur du papier. */
export const TONE: Record<Tone, { text: string; border: string; bg: string; bar: string }> = {
    good: { text: "text-[#2f6b3a]", border: "border-[#a8c9a0]", bg: "bg-[#e3efdc]", bar: "bg-[#3f8a4f]" },
    neutral: { text: "text-[#2c5a7a]", border: "border-[#a9c4d6]", bg: "bg-[#e1ebf2]", bar: "bg-[#3b79a3]" },
    warn: { text: "text-[#8a5a00]", border: "border-[#e0c488]", bg: "bg-[#f6e8c4]", bar: "bg-[#c78a1c]" },
    bad: { text: "text-[#a3302a]", border: "border-[#e0a8a2]", bg: "bg-[#f4dad6]", bar: "bg-[#b3332b]" },
};

export const EXPRESSIONS: Record<Expression, { label: string; icon: ElementType; ring: string }> = {
    neutral: { label: "Neutre", icon: Meh, ring: "ring-[#b7ad92]" },
    happy: { label: "Rassuré", icon: Smile, ring: "ring-[#3f8a4f]" },
    concerned: { label: "Inquiet", icon: Frown, ring: "ring-[#c78a1c]" },
    angry: { label: "Tendu", icon: Angry, ring: "ring-[#b3332b]" },
    surprised: { label: "Surpris", icon: AlertTriangle, ring: "ring-[#c78a1c]" },
    thinking: { label: "Réfléchit", icon: Lightbulb, ring: "ring-[#3b79a3]" },
};

export const COMM_STATUS: Record<CommStatus, { label: string; dot: string }> = {
    speaking: { label: "Parle", dot: "bg-[#2f6b3a]" },
    listening: { label: "Écoute", dot: "bg-[#c78a1c]" },
    idle: { label: "En attente", dot: "bg-[#b7ad92]" },
};

/* ------------------------------------------------------------------ */
/* Surfaces et boutons communs                                         */
/* ------------------------------------------------------------------ */

export const DESK = "bg-[#23272b] text-[#e8e2d0]";
export const SURFACE =
    "rounded-lg border border-[#d6cbb0] bg-[#f3ecd9] text-[#2b2a26] shadow-[0_2px_0_rgba(0,0,0,0.3)]";
export const SURFACE_INNER = "rounded-md border border-[#ddd2b6] bg-[#faf6ea]";
export const LABEL = "text-xs font-bold uppercase tracking-wider text-[#6b6657]";
export const MUTED = "text-[#6b6657]";
export const FOCUS =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c5a7a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ecd9]";
export const BTN_DARK = `rounded-md bg-[#2b2a26] px-3.5 py-2 text-sm font-semibold text-[#f3ecd9] transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#d9d0b8] disabled:text-[#8b8570] ${FOCUS}`;
