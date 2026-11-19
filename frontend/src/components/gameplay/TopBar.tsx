import { ArrowLeft, Clock, Radio, RotateCcw } from "lucide-react";

interface TopBarProps {
    missionTitle: string;
    /** Heure de la situation en cours (« 06:40 »). */
    timeLabel: string;
    finished: boolean;
    progress: { done: number; total: number };
    onQuit: () => void;
    onRestart: () => void;
    /** Relance la visite guidée vocale (absent = bouton masqué). */
    onGuide?: () => void;
}

/** Barre supérieure : identité, heure, progression, navigation. */
export const TopBar = ({ missionTitle, timeLabel, finished, progress, onQuit, onRestart, onGuide }: TopBarProps) => (
    <header className="border-b border-black/40 bg-[#14171a] px-4 py-3 text-[#e8e2d0] md:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div className="flex items-baseline gap-3">
                <p className="text-base font-bold tracking-wide">
                    AGORA <span className="text-[#e0b252]">EXPLORER</span>
                </p>
                <p className="hidden text-sm text-[#a39d8a] sm:block">{missionTitle}</p>
            </div>

            <div className="flex items-center gap-5 text-sm">
                <span className="flex items-center gap-2 font-mono text-lg font-bold" title="Heure de la simulation">
                    <Clock size={16} className="text-[#e0b252]" /> {timeLabel || "--:--"}
                </span>
                <span className="hidden text-[#a39d8a] md:block">
                    {finished ? "Mission terminée" : `Objectifs ${progress.done}/${progress.total}`}
                </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#a39d8a]">
                {onGuide && (
                    <button
                        type="button"
                        onClick={onGuide}
                        className="flex items-center gap-1.5 font-semibold text-[#e0b252] hover:text-[#f0c466] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b252]"
                    >
                        <Radio size={14} /> Revoir le guide
                    </button>
                )}
                <button
                    type="button"
                    onClick={onRestart}
                    className="flex items-center gap-1.5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b252]"
                >
                    <RotateCcw size={14} /> Recommencer
                </button>
                <button
                    type="button"
                    onClick={onQuit}
                    className="flex items-center gap-1.5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b252]"
                >
                    <ArrowLeft size={15} /> Quitter
                </button>
            </div>
        </div>
    </header>
);

export default TopBar;
