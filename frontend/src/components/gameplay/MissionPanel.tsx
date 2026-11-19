import { AlertTriangle, CheckCircle2, Circle, Info, Lock, MapPin } from "lucide-react";
import type { MissionInfoItem } from "./types";
import { LABEL, MUTED, SURFACE } from "./ui";

interface MissionPanelProps {
    title: string;
    location: string;
    objectives: { id: string; label: string; done: boolean }[];
    info: MissionInfoItem[];
    hiddenCount: number;
}

const KIND_ICON = { constraint: Lock, risk: AlertTriangle, info: Info } as const;
const KIND_COLOR = { constraint: "text-[#8a5a00]", risk: "text-[#a3302a]", info: "text-[#2c5a7a]" } as const;

/** Ordre de mission : objectifs et informations (révélées au fil de l'exploration). */
export const MissionPanel = ({ title, location, objectives, info, hiddenCount }: MissionPanelProps) => (
    <section className={`${SURFACE} p-5`} aria-label="Mission">
        <p className={LABEL}>ORDRE DE MISSION</p>
        <h1 className="mt-2 text-lg font-bold leading-tight">{title}</h1>
        <p className={`mt-1 flex items-center gap-1.5 text-sm ${MUTED}`}>
            <MapPin size={14} /> {location}
        </p>

        <ul className="mt-4 space-y-2.5">
            {objectives.map((objective) => (
                <li key={objective.id} className="flex items-start gap-2.5">
                    {objective.done ? (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2f6b3a]" aria-label="Fait" />
                    ) : (
                        <Circle size={18} className="mt-0.5 shrink-0 text-[#b7ad92]" aria-label="À faire" />
                    )}
                    <span className={`text-sm leading-snug ${objective.done ? "text-[#8b8570] line-through" : "font-medium"}`}>
                        {objective.label}
                    </span>
                </li>
            ))}
        </ul>

        <div className="mt-5 border-t border-[#ddd2b6] pt-4">
            <p className={`${LABEL} mb-2.5`}>À SAVOIR</p>
            <ul className="space-y-2.5">
                {info.map((item) => {
                    const Icon = KIND_ICON[item.kind];
                    return (
                        <li key={item.id} className="flex items-start gap-2.5">
                            <Icon size={15} className={`mt-0.5 shrink-0 ${KIND_COLOR[item.kind]}`} />
                            <span className="text-sm leading-snug">{item.text}</span>
                        </li>
                    );
                })}
            </ul>
            {hiddenCount > 0 && (
                <p className={`mt-3 text-sm italic ${MUTED}`}>
                    {hiddenCount} information{hiddenCount > 1 ? "s" : ""} à découvrir en explorant.
                </p>
            )}
        </div>
    </section>
);

export default MissionPanel;
