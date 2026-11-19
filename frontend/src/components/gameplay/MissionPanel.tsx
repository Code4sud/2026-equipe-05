import { AlertTriangle, CheckCircle2, ClipboardList, Info, Lock, MapPin } from "lucide-react";
import type { MissionInfoItem } from "./types";
import { SURFACE } from "./ui";

interface MissionPanelProps {
    title: string;
    role: string;
    location: string;
    summary: string;
    objectives: { id: string; label: string; done: boolean }[];
    info: MissionInfoItem[];
    hiddenCount: number;
}

const KIND_ICON = { constraint: Lock, risk: AlertTriangle, info: Info } as const;
const KIND_COLOR = { constraint: "text-amber-300", risk: "text-rose-300", info: "text-cyan-300" } as const;

/** Contexte, objectifs et informations de la mission (révélées progressivement). */
export const MissionPanel = ({ title, role, location, summary, objectives, info, hiddenCount }: MissionPanelProps) => (
    <section className={`${SURFACE} p-5`} aria-label="Mission">
        <div className="mb-4 flex items-center gap-2 text-cyan-400">
            <ClipboardList size={17} />
            <span className="text-[10px] font-bold tracking-[0.16em]">ORDRE DE MISSION</span>
        </div>

        <h1 className="mb-1 text-lg font-bold leading-tight">{title}</h1>
        <p className="mb-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <MapPin size={12} /> {location}
        </p>
        <p className="text-xs leading-relaxed text-slate-400">{summary}</p>
        <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">Ton rôle : {role}</p>

        <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">OBJECTIFS</p>
            <ul className="space-y-2.5">
                {objectives.map((objective) => (
                    <li key={objective.id} className="flex items-start gap-2.5">
                        {objective.done ? (
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                        ) : (
                            <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-600" />
                        )}
                        <span className={`text-xs leading-snug ${objective.done ? "text-slate-500 line-through" : "text-slate-200"}`}>
                            {objective.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">INFORMATIONS</p>
            <ul className="space-y-2.5">
                {info.map((item) => {
                    const Icon = KIND_ICON[item.kind];
                    return (
                        <li key={item.id} className="flex items-start gap-2.5">
                            <Icon size={14} className={`mt-0.5 shrink-0 ${KIND_COLOR[item.kind]}`} />
                            <span className="text-xs leading-snug text-slate-300">{item.text}</span>
                        </li>
                    );
                })}
            </ul>
            {hiddenCount > 0 && (
                <p className="mt-3 text-[10px] italic text-slate-500">
                    {hiddenCount} information{hiddenCount > 1 ? "s" : ""} à découvrir en explorant.
                </p>
            )}
        </div>
    </section>
);

export default MissionPanel;
