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
    <section className={`${SURFACE} p-3.5`} aria-label="Mission">
        <p className={LABEL}>TA MISSION</p>
        <h1 className="mt-1 text-base font-bold leading-tight text-[#2b2a26]">{title}</h1>
        <p className={`mt-0.5 text-xs leading-snug ${MUTED}`}>
            {role} · {location}
        </p>

        <ul className="mt-2.5 space-y-2">
            {objectives.map((objective) => (
                <li key={objective.id} className="flex items-start gap-2 text-xs sm:text-sm">
                    {objective.done ? (
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2f6b3a]" aria-label="Fait" />
                    ) : (
                        <Circle size={16} className="mt-0.5 shrink-0 text-[#b7ad92]" aria-label="À faire" />
                    )}
                    <span className={`leading-snug ${objective.done ? "text-[#8b8570] line-through" : "font-medium text-[#2b2a26]"}`}>
                        {objective.label}
                    </span>
                </li>
            ))}
        </ul>
    </section>
);

export default MissionPanel;
