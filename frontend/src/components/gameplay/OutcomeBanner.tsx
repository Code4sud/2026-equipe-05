import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ElementType } from "react";
import type { Tone, TurnSummary } from "./types";
import { MUTED, TONE } from "./ui";

const TONE_ICON: Record<Tone, ElementType> = {
    good: CheckCircle2,
    neutral: Info,
    warn: AlertTriangle,
    bad: XCircle,
};

/** Conséquences du dernier tour : effet de l'action, puis événements déclenchés. */
export const OutcomeBanner = ({ turn }: { turn: TurnSummary | null }) => {
    if (!turn) {
        return (
            <div className={`rounded-lg border border-dashed border-[#6b6657] px-4 py-3 text-sm text-[#a39d8a]`}>
                Ce qui se passe après chacune de tes actions s'affichera ici.
            </div>
        );
    }

    return (
        <div className="space-y-2" aria-live="polite" aria-label="Conséquences">
            {turn.notices.map((notice) => {
                const tone = TONE[notice.tone];
                const Icon = TONE_ICON[notice.tone];
                return (
                    <div key={notice.id} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${tone.border} ${tone.bg}`}>
                        <Icon size={18} className={`mt-0.5 shrink-0 ${tone.text}`} />
                        <div className="min-w-0">
                            <p className={`text-xs font-bold uppercase tracking-wider ${tone.text}`}>
                                {notice.source === "event" ? "Événement · " : ""}
                                {notice.title}
                            </p>
                            <p className="mt-0.5 text-sm leading-relaxed text-[#2b2a26]">{notice.text}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OutcomeBanner;
