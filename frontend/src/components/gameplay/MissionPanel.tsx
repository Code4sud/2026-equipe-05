import { CheckCircle2, Circle, MapPin } from "lucide-react";
import { LABEL, MUTED, SURFACE } from "./ui";

interface MissionPanelProps {
    title: string;
    role: string;
    location: string;
    objectives: { id: string; label: string; done: boolean }[];
}

/** Ta mission : le rôle et les objectifs, qui se cochent au fil des rencontres. */
export const MissionPanel = ({ title, role, location, objectives }: MissionPanelProps) => (
    <section className={`${SURFACE} p-5`} aria-label="Mission">
        <p className={LABEL}>TA MISSION</p>
        <h1 className="mt-2 text-lg font-bold leading-tight">{title}</h1>
        <p className={`mt-1 text-sm leading-snug ${MUTED}`}>{role}</p>
        <p className={`mt-1 flex items-center gap-1.5 text-sm ${MUTED}`}>
            <MapPin size={14} /> {location}
        </p>

        <ul className="mt-4 space-y-3">
            {objectives.map((objective) => (
                <li key={objective.id} className="flex items-start gap-2.5">
                    {objective.done ? (
                        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#2f6b3a]" aria-label="Fait" />
                    ) : (
                        <Circle size={20} className="mt-0.5 shrink-0 text-[#b7ad92]" aria-label="À faire" />
                    )}
                    <span className={`text-base leading-snug ${objective.done ? "text-[#8b8570] line-through" : "font-medium"}`}>
                        {objective.label}
                    </span>
                </li>
            ))}
        </ul>
    </section>
);

export default MissionPanel;
