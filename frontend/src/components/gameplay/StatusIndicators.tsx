import { Activity } from "lucide-react";
import type { IndicatorView } from "./types";
import { SURFACE, TONE, getIcon } from "./ui";

interface StatusIndicatorsProps {
    indicators: IndicatorView[];
}

/** Jauges de la mission. Chaque indicateur affiche ce qu'il mesure. */
export const StatusIndicators = ({ indicators }: StatusIndicatorsProps) => (
    <section className={`${SURFACE} space-y-5 p-5`} aria-label="État de la mission">
        <div className="flex items-center gap-2 text-slate-300">
            <Activity size={16} />
            <span className="text-[10px] font-bold tracking-[0.16em]">ÉTAT DE LA MISSION</span>
        </div>

        {indicators.map((indicator) => {
            const Icon = getIcon(indicator.icon);
            const tone = TONE[indicator.level];
            return (
                <div key={indicator.id} title={indicator.meaning}>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs text-slate-300">
                            <Icon size={14} className={tone.text} /> {indicator.label}
                        </span>
                        <span className="flex items-center gap-2">
                            {indicator.deltaLabel && indicator.deltaTone && (
                                <span
                                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${TONE[indicator.deltaTone].bg} ${TONE[indicator.deltaTone].text}`}
                                >
                                    {indicator.deltaLabel}
                                </span>
                            )}
                            <span className="font-mono text-xs font-bold">{indicator.display}</span>
                        </span>
                    </div>
                    <div
                        className="h-2 overflow-hidden rounded-full bg-slate-800"
                        role="progressbar"
                        aria-label={indicator.label}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={indicator.percent}
                    >
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                            style={{ width: `${Math.max(2, indicator.percent)}%` }}
                        />
                    </div>
                    <p className="mt-1.5 text-[10px] leading-snug text-slate-500">{indicator.meaning}</p>
                </div>
            );
        })}
    </section>
);

export default StatusIndicators;
