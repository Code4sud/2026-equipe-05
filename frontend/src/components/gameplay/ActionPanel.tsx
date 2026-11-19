import { CheckCircle2, CircleDashed, Clock, HelpCircle, Lock, Trophy, Wrench, XCircle } from "lucide-react";
import type { ActionDefinition, Availability, EndCondition, ReadinessItem } from "./types";
import { SURFACE, SURFACE_INNER, VERBS } from "./ui";

interface ActionPanelProps {
    actions: ActionDefinition[];
    status: Record<string, { done: boolean; availability: Availability }>;
    readiness: ReadinessItem[];
    result: EndCondition | null;
    onPerform: (actionId: string) => void;
    onOpenDebrief: () => void;
}

const READINESS_ICON = {
    ok: { icon: CheckCircle2, color: "text-emerald-400" },
    ko: { icon: XCircle, color: "text-rose-400" },
    unknown: { icon: HelpCircle, color: "text-slate-500" },
} as const;

/** Zone d'action : check-list d'intervention, commandes et décisions. */
export const ActionPanel = ({ actions, status, readiness, result, onPerform, onOpenDebrief }: ActionPanelProps) => (
    <div className="space-y-5">
        <section className={`${SURFACE} p-5`} aria-label="Conditions d'intervention">
            <div className="mb-4 flex items-center gap-2 text-slate-300">
                <CircleDashed size={16} />
                <span className="text-[10px] font-bold tracking-[0.16em]">CONDITIONS D'INTERVENTION</span>
            </div>
            <ul className="space-y-2.5">
                {readiness.map((item) => {
                    const { icon: Icon, color } = READINESS_ICON[item.status];
                    return (
                        <li key={item.id} className="flex items-start gap-2.5">
                            <Icon size={15} className={`mt-0.5 shrink-0 ${color}`} />
                            <span className="min-w-0">
                                <span className="block text-xs leading-snug text-slate-200">{item.label}</span>
                                {item.detail && <span className="block text-[10px] text-slate-500">{item.detail}</span>}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>

        <section className={`${SURFACE} p-5`} aria-label="Actions disponibles">
            <div className="mb-4 flex items-center gap-2 text-cyan-400">
                <Wrench size={17} />
                <span className="text-[10px] font-bold tracking-[0.16em]">ACTIONS DISPONIBLES</span>
            </div>

            {result && (
                <div className="mb-4 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-4">
                    <p className="mb-1 flex items-center gap-2 text-xs font-bold text-cyan-200">
                        <Trophy size={14} /> Mission terminée
                    </p>
                    <p className="mb-3 text-[11px] leading-relaxed text-slate-300">{result.reason}</p>
                    <button
                        type="button"
                        onClick={onOpenDebrief}
                        className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        Voir le bilan
                    </button>
                </div>
            )}

            <div className="space-y-3">
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
                            className={`${SURFACE_INNER} w-full p-4 text-left transition-all hover:border-cyan-400/40 hover:bg-cyan-400/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/5 disabled:hover:bg-[#0a121c]`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-cyan-400">
                                    <Icon size={12} /> {Verb.label.toUpperCase()}
                                </span>
                                {done ? (
                                    <CheckCircle2 size={15} className="shrink-0 text-emerald-400" aria-label="Fait" />
                                ) : (
                                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-500">
                                        {available ? <Clock size={10} /> : <Lock size={10} />}
                                        {action.cost > 0 ? `${action.cost} min` : "Décision"}
                                    </span>
                                )}
                            </div>
                            <span className="mt-1.5 block text-xs font-semibold leading-snug">{action.label}</span>
                            <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{action.description}</span>
                            {!done && !available && state?.availability.reason && (
                                <span className="mt-2 block text-[10px] leading-snug text-amber-300/80">{state.availability.reason}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </section>
    </div>
);

export default ActionPanel;
