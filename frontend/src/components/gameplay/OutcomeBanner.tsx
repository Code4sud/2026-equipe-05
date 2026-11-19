import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ElementType } from "react";
import type { Tone, TurnSummary } from "./types";
import { TONE } from "./ui";

const TONE_ICON: Record<Tone, ElementType> = {
    good: CheckCircle2,
    neutral: Info,
    warn: AlertTriangle,
    bad: XCircle,
};

interface OutcomeBannerProps {
    turn: TurnSummary | null;
}

/** Conséquences du dernier tour : effet de l'action, puis événements déclenchés. */
export const OutcomeBanner = ({ turn }: OutcomeBannerProps) => {
    if (!turn) {
        return (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-slate-500">
                Les conséquences de tes actions s'afficheront ici.
            </div>
        );
    }

    return (
        <div className="space-y-2" aria-live="polite" aria-label="Conséquences">
            {turn.notices.map((notice) => {
                const tone = TONE[notice.tone];
                const Icon = TONE_ICON[notice.tone];
                return (
                    <div key={notice.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${tone.border} ${tone.bg}`}>
                        <Icon size={16} className={`mt-0.5 shrink-0 ${tone.text}`} />
                        <div className="min-w-0">
                            <p className={`text-[10px] font-bold tracking-wider ${tone.text}`}>
                                {notice.source === "event" ? "ÉVÉNEMENT · " : ""}
                                {notice.title.toUpperCase()}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-200">{notice.text}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OutcomeBanner;
