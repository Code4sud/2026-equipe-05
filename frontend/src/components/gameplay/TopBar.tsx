import { ArrowLeft, Clock, RotateCcw, Wind } from "lucide-react";
import { formatClock } from "./simulation";

interface TopBarProps {
    missionTitle: string;
    clock: number;
    finished: boolean;
    progress: { done: number; total: number };
    onQuit: () => void;
    onRestart: () => void;
}

/** Barre supérieure : identité, état de la simulation, progression, navigation. */
export const TopBar = ({ missionTitle, clock, finished, progress, onQuit, onRestart }: TopBarProps) => {
    const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);
    return (
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-white/10 bg-[#0d1520] px-5 py-2 md:px-8">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-500/10">
                    <Wind className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                    <p className="text-sm font-bold tracking-wide">
                        AGORA <span className="text-cyan-400">EXPLORER</span>
                    </p>
                    <p className="text-[10px] tracking-[0.2em] text-slate-500">ROLEPLAY STUDIO · PRÉ-ALPHA 0.2</p>
                </div>
            </div>

            <div className="flex items-center gap-5 text-xs text-slate-400">
                <span className="hidden items-center gap-2 lg:flex">
                    <span
                        className={`h-2 w-2 rounded-full ${finished ? "bg-slate-500" : "animate-pulse bg-emerald-400 motion-reduce:animate-none"}`}
                    />
                    {finished ? "SIMULATION TERMINÉE" : "SIMULATION LOCALE"}
                </span>
                <span className="hidden max-w-[220px] truncate xl:block">{missionTitle}</span>
                <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-slate-100">
                    <Clock size={14} className="text-cyan-400" /> {formatClock(clock)}
                </span>
                <span className="flex items-center gap-2" title="Objectifs accomplis">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                        <span className="block h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${percent}%` }} />
                    </span>
                    <span className="font-mono text-[11px]">
                        {progress.done}/{progress.total}
                    </span>
                </span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={onRestart}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                    <RotateCcw size={14} /> Recommencer
                </button>
                <button
                    type="button"
                    onClick={onQuit}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                    <ArrowLeft size={15} /> Quitter
                </button>
            </div>
        </header>
    );
};

export default TopBar;
