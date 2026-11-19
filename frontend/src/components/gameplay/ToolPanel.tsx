import { CheckCircle2, Clock, Lock } from "lucide-react";
import type { ActionDefinition, Availability, Character, Readout, ToolDefinition } from "./types";
import { SURFACE, SURFACE_INNER, TONE, VERBS, getIcon } from "./ui";

interface ToolPanelProps {
    tools: ToolDefinition[];
    activeToolId: string;
    onSelectTool: (toolId: string) => void;
    actions: ActionDefinition[];
    characters: Record<string, Character>;
    readouts: Readout[];
    findings: Record<string, { title: string; text: string }>;
    status: Record<string, { done: boolean; availability: Availability }>;
    onPerform: (actionId: string) => void;
}

/** Espace de travail : onglets d'outils, chacun porté par ses propres actions. */
export const ToolPanel = ({
    tools,
    activeToolId,
    onSelectTool,
    actions,
    characters,
    readouts,
    findings,
    status,
    onPerform,
}: ToolPanelProps) => {
    const tool = tools.find((candidate) => candidate.id === activeToolId) ?? tools[0];
    const toolActions = actions.filter((action) => action.toolId === tool.id);

    const renderAction = (action: ActionDefinition) => {
        const state = status[action.id];
        const done = !!state?.done;
        const available = !!state?.availability.ok;
        const finding = findings[action.id];
        const Verb = VERBS[action.verb];
        const VerbIcon = Verb.icon;

        return (
            <div key={action.id} className={`${SURFACE_INNER} p-4`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-cyan-400">
                            <VerbIcon size={12} /> {Verb.label.toUpperCase()}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-snug">{action.label}</p>
                        {!done && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{action.description}</p>}
                    </div>
                    {done ? (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-label="Fait" />
                    ) : (
                        <button
                            type="button"
                            disabled={!available}
                            onClick={() => onPerform(action.id)}
                            className="shrink-0 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold text-cyan-200 transition-all hover:bg-cyan-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-slate-600"
                        >
                            <span className="flex items-center gap-1.5">
                                {available ? <Clock size={11} /> : <Lock size={11} />}
                                {action.cost > 0 ? `${action.cost} min` : "Ouvrir"}
                            </span>
                        </button>
                    )}
                </div>

                {!done && !available && state?.availability.reason && (
                    <p className="mt-2 flex items-start gap-1.5 text-[10px] text-amber-300/80">
                        <Lock size={11} className="mt-0.5 shrink-0" /> {state.availability.reason}
                    </p>
                )}

                {done && finding && (
                    <div className="mt-3 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3">
                        <p className="mb-1.5 text-[10px] font-bold tracking-wider text-emerald-300">{finding.title.toUpperCase()}</p>
                        {finding.text.split("\n").map((line, index) => (
                            <p key={index} className="text-xs leading-relaxed text-slate-300">
                                {line}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderRadio = () => {
        const contactIds = Array.from(new Set(toolActions.map((action) => action.characterId).filter(Boolean))) as string[];
        return (
            <div className="space-y-5">
                {contactIds.map((id) => {
                    const contact = characters[id];
                    return (
                        <div key={id}>
                            <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-400">
                                {contact ? `${contact.name.toUpperCase()} · ${contact.role.toUpperCase()}` : id.toUpperCase()}
                            </p>
                            <div className="space-y-3">
                                {toolActions.filter((action) => action.characterId === id).map(renderAction)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <section className={`${SURFACE} min-w-0`} aria-label="Espace de travail">
            <div role="tablist" aria-label="Outils" className="grid grid-cols-3 gap-2 border-b border-white/10 p-3">
                {tools.map((candidate) => {
                    const Icon = getIcon(candidate.icon);
                    const selected = candidate.id === tool.id;
                    return (
                        <button
                            key={candidate.id}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => onSelectTool(candidate.id)}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                                selected
                                    ? "border-cyan-400/50 bg-cyan-400/10"
                                    : "border-white/10 bg-[#0a121c]/70 hover:border-white/30"
                            }`}
                        >
                            <Icon size={20} className={selected ? "text-cyan-400" : "text-slate-400"} />
                            <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold">{candidate.label}</span>
                                <span className="block truncate text-[10px] text-slate-500">{candidate.subtitle}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="p-5" role="tabpanel">
                <p className="mb-4 text-xs leading-relaxed text-slate-400">{tool.description}</p>

                {tool.kind === "dashboard" && (
                    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                        {readouts.map((readout) => (
                            <div key={readout.id} className={`${SURFACE_INNER} p-3`}>
                                <p className="mb-1.5 text-[10px] text-slate-500">{readout.label}</p>
                                <p className={`text-sm font-semibold ${TONE[readout.tone].text}`}>{readout.value}</p>
                                {readout.hint && <p className="mt-1 text-[10px] text-slate-500">{readout.hint}</p>}
                            </div>
                        ))}
                    </div>
                )}

                {tool.kind === "radio" ? <div>{renderRadio()}</div> : <div className="space-y-3">{toolActions.map(renderAction)}</div>}
            </div>
        </section>
    );
};

export default ToolPanel;
