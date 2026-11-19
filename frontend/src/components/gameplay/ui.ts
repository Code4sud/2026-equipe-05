import type { ElementType } from "react";
import {
    AlertTriangle,
    Angry,
    BadgeCheck,
    BookOpen,
    Clock,
    FileText,
    Frown,
    Gauge,
    Handshake,
    HardHat,
    Hourglass,
    Lightbulb,
    Meh,
    MessageSquare,
    Monitor,
    Radio,
    Search,
    ShieldCheck,
    Smile,
    Stamp,
    ThumbsDown,
    ThumbsUp,
    Wrench,
} from "lucide-react";
import type { ActionVerb, CommStatus, Expression, Tone } from "./types";

/** Les missions référencent les icônes par clé : leurs données restent sérialisables. */
const ICONS: Record<string, ElementType> = {
    shield: ShieldCheck,
    gauge: Gauge,
    handshake: Handshake,
    clock: Clock,
    monitor: Monitor,
    file: FileText,
    radio: Radio,
    wrench: Wrench,
    alert: AlertTriangle,
};

export const getIcon = (key: string): ElementType => ICONS[key] ?? Gauge;

export const TONE: Record<Tone, { text: string; border: string; bg: string; bar: string }> = {
    good: { text: "text-emerald-300", border: "border-emerald-400/30", bg: "bg-emerald-400/10", bar: "bg-emerald-400" },
    neutral: { text: "text-cyan-300", border: "border-cyan-400/30", bg: "bg-cyan-400/10", bar: "bg-cyan-400" },
    warn: { text: "text-amber-300", border: "border-amber-400/30", bg: "bg-amber-400/10", bar: "bg-amber-400" },
    bad: { text: "text-rose-300", border: "border-rose-400/30", bg: "bg-rose-400/10", bar: "bg-rose-400" },
};

export const VERBS: Record<ActionVerb, { label: string; icon: ElementType }> = {
    examine: { label: "Examiner", icon: Search },
    verify: { label: "Vérifier", icon: BadgeCheck },
    consult: { label: "Consulter", icon: BookOpen },
    communicate: { label: "Communiquer", icon: MessageSquare },
    procedure: { label: "Procédure", icon: Lightbulb },
    intervene: { label: "Intervenir", icon: HardHat },
    wait: { label: "Attendre", icon: Hourglass },
    accept: { label: "Accepter", icon: ThumbsUp },
    refuse: { label: "Refuser", icon: ThumbsDown },
    validate: { label: "Valider", icon: Stamp },
};

export const EXPRESSIONS: Record<Expression, { label: string; icon: ElementType; ring: string }> = {
    neutral: { label: "Neutre", icon: Meh, ring: "ring-slate-500/40" },
    happy: { label: "Rassuré", icon: Smile, ring: "ring-emerald-400/50" },
    concerned: { label: "Inquiet", icon: Frown, ring: "ring-amber-400/50" },
    angry: { label: "Tendu", icon: Angry, ring: "ring-rose-400/60" },
    surprised: { label: "Surpris", icon: AlertTriangle, ring: "ring-amber-400/50" },
    thinking: { label: "Réfléchit", icon: Lightbulb, ring: "ring-cyan-400/50" },
};

export const COMM_STATUS: Record<CommStatus, { label: string; dot: string }> = {
    speaking: { label: "Parle", dot: "bg-cyan-400" },
    listening: { label: "Écoute", dot: "bg-amber-400" },
    idle: { label: "En attente", dot: "bg-slate-600" },
};

/** Surfaces communes, alignées sur le prototype existant. */
export const SURFACE = "rounded-xl border border-white/10 bg-[#111c29]";
export const SURFACE_INNER = "rounded-lg border border-white/5 bg-[#0a121c]";
