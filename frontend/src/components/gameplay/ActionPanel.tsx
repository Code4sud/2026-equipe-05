import { CheckCircle2, Circle, Clock, Lock, Trophy, XCircle } from "lucide-react";
import type { ActionDefinition, Availability, EndCondition, ReadinessItem } from "./types";
import { BTN_DARK, LABEL, MUTED, SURFACE, SURFACE_INNER, TONE, VERBS } from "./ui";

interface ActionPanelProps {
    actions: ActionDefinition[];
    status: Record<string, { done: boolean; availability: Availability }>;
    readiness: ReadinessItem[];
    result: EndCondition | null;
    onPerform: (actionId: string) => void;
    onOpenDebrief: () => void;
}

const READINESS_ICON = {
    ok: { icon: CheckCircle2, color: "text-[#2f6b3a]", label: "Validé" },
    ko: { icon: XCircle, color: "text-[#a3302a]", label: "Pas encore" },
    unknown: { icon: Circle, color: "text-[#b7ad92]", label: "Inconnu" },
} as const;

/** Fiche d'intervention (ce qu'il faut réunir) et commandes disponibles. */
export const ActionPanel = ({ actions, status, readiness, result, onPerform, onOpenDebrief }: ActionPanelProps) => (
    <div className="space-y-5">
        <section className={`${SURFACE} p-5`} aria-label="Conditions d'intervention">
            <p className={`${LABEL} mb-3`}>CONDITIONS D'INTERVENTION</p>
            <ul className="space-y-2.5">
                {readiness.map((item) => {
                    const { icon: Icon, color, label } = READINESS_ICON[item.status];
                    return (
                        <li key={item.id} className="flex items-start gap-2.5">
                            <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} aria-label={label} />
                            <span className="min-w-0">
                                <span className="block text-sm leading-snug">{item.label}</span>
                                {item.detail && <span className={`block text-xs ${MUTED}`}>{item.detail}</span>}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>

        <section className={`${SURFACE} p-5`} aria-label="Commandes">
            <p className={`${LABEL} mb-3`}>TES COMMANDES</p>

            {result && (
                <div className={`mb-4 rounded-md border p-4 ${TONE.neutral.border} ${TONE.neutral.bg}`}>
                    <p className={`mb-1 flex items-center gap-2 text-sm font-bold ${TONE.neutral.text}`}>
                        <Trophy size={16} /> Mission terminée
                    </p>
                    <p className="mb-3 text-sm leading-relaxed">{result.reason}</p>
                    <button type="button" onClick={onOpenDebrief} className={`${BTN_DARK} w-full`}>
                        Voir le bilan
                    </button>
                </div>
            )}

            <div className="space-y-2.5">
                {actions.map((action) => {
                    const state = status[action.id];
                    const done = !!state?.done;
                    const available = !!state?.availability.ok;
                    const Verb = VERBS[action.verb];
                    const Icon = Verb.icon;
                    return (
                        <button
                            key={action.id}
                            type="button"
                            disabled={!available}
                            onClick={() => onPerform(action.id)}
                            className={`${SURFACE_INNER} block w-full p-3.5 text-left transition-colors hover:border-[#2b2a26] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c5a7a] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-[#ddd2b6] disabled:hover:bg-[#faf6ea]`}
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6b6657]">
                                    <Icon size={13} /> {Verb.label}
                                </span>
                                {done ? (
                                    <CheckCircle2 size={16} className="shrink-0 text-[#2f6b3a]" aria-label="Fait" />
                                ) : (
                                    <span className={`flex shrink-0 items-center gap-1 text-xs ${MUTED}`}>
                                        {available ? <Clock size={12} /> : <Lock size={12} />}
                                        {action.cost > 0 ? `${action.cost} min` : "Décision"}
                                    </span>
                                )}
                            </span>
                            <span className="mt-1 block text-sm font-semibold leading-snug">{action.label}</span>
                            {!done && !available && state?.availability.reason && (
                                <span className="mt-1.5 block text-xs leading-snug text-[#8a5a00]">{state.availability.reason}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    </div>
);

export default ActionPanel;
