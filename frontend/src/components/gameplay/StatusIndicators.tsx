import type { IndicatorView } from "./types";
import { LABEL, MUTED, SURFACE, TONE, getIcon } from "./ui";

interface StatusIndicatorsProps {
    indicators: IndicatorView[];
    /** `strip` : bandeau horizontal pendant le jeu. `stack` : liste détaillée (bilan). */
    variant?: "strip" | "stack";
}

const Delta = ({ indicator }: { indicator: IndicatorView }) =>
    indicator.deltaLabel && indicator.deltaTone ? (
        <span
            className={`rounded px-1.5 py-0.5 font-mono text-xs font-bold ${TONE[indicator.deltaTone].bg} ${TONE[indicator.deltaTone].text}`}
        >
            {indicator.deltaLabel}
        </span>
    ) : null;

const Bar = ({ indicator }: { indicator: IndicatorView }) => (
    <div
        className="h-2.5 overflow-hidden rounded-full bg-[#ddd2b6]"
        role="progressbar"
        aria-label={indicator.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indicator.percent}
    >
        <div
            className={`h-full rounded-full transition-all duration-500 ${TONE[indicator.level].bar}`}
            style={{ width: `${Math.max(2, indicator.percent)}%` }}
        />
    </div>
);

/** Jauges de la mission. Le sens de chaque jauge est dans l'infobulle (et détaillé au bilan). */
export const StatusIndicators = ({ indicators, variant = "strip" }: StatusIndicatorsProps) => {
    if (variant === "stack") {
        return (
            <section className={`${SURFACE} space-y-5 p-5`} aria-label="État de la mission">
                <p className={LABEL}>ÉTAT FINAL</p>
                {indicators.map((indicator) => {
                    const Icon = getIcon(indicator.icon);
                    return (
                        <div key={indicator.id}>
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    <Icon size={15} className={TONE[indicator.level].text} /> {indicator.label}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Delta indicator={indicator} />
                                    <span className="font-mono text-sm font-bold">{indicator.display}</span>
                                </span>
                            </div>
                            <Bar indicator={indicator} />
                            <p className={`mt-1.5 text-xs leading-snug ${MUTED}`}>{indicator.meaning}</p>
                        </div>
                    );
                })}
            </section>
        );
    }

    return (
        <section
            className={`${SURFACE} grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-2 sm:px-5 sm:py-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`}
            aria-label="État de la mission"
        >
            {indicators.map((indicator) => {
                const Icon = getIcon(indicator.icon);
                return (
                    <div key={indicator.id} title={indicator.meaning}>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                                <Icon size={15} className={TONE[indicator.level].text} /> {indicator.label}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Delta indicator={indicator} />
                                <span className="font-mono text-sm font-bold">{indicator.display}</span>
                            </span>
                        </div>
                        <Bar indicator={indicator} />
                    </div>
                );
            })}
        </section>
    );
};

export default StatusIndicators;
