import { CheckCircle2, Lock } from "lucide-react";
import type { ActionDefinition, Availability, Character, Readout, ToolDefinition } from "./types";
import { BTN_DARK, LABEL, MUTED, SCREEN_TONE, SURFACE, SURFACE_INNER, VERBS, getIcon } from "./ui";

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

/** Espace de travail : onglets de dossier ; chaque outil porte ses propres actions. */
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
        const verb = VERBS[action.verb];
        const buttonLabel = action.cost > 0 ? `${verb.label} · ${action.cost} min` : verb.label;

        return (
            <div key={action.id} className={`${SURFACE_INNER} p-4`}>
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-base font-semibold leading-snug">{action.label}</p>
                        {!done && <p className={`mt-1 text-sm leading-relaxed ${MUTED}`}>{action.description}</p>}
                    </div>
                    {done ? (
                        <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#2f6b3a]">
                            <CheckCircle2 size={18} aria-label="Fait" /> Fait
                        </span>
                    ) : (
                        <button type="button" disabled={!available} onClick={() => onPerform(action.id)} className={`${BTN_DARK} shrink-0`}>
                            <span className="flex items-center gap-1.5">
                                {!available && <Lock size={13} />}
                                {buttonLabel}
                            </span>
                        </button>
                    )}
                </div>

                {!done && !available && state?.availability.reason && (
                    <p className="mt-2.5 flex items-start gap-1.5 text-sm text-[#8a5a00]">
                        <Lock size={14} className="mt-0.5 shrink-0" /> {state.availability.reason}
                    </p>
                )}

                {done && finding && (
                    <div className="mt-3 rounded border-l-4 border-[#3f8a4f] bg-[#e3efdc] p-3">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#2f6b3a]">{finding.title}</p>
                        {finding.text.split("\n").map((line, index) => (
                            <p key={index} className="text-sm leading-relaxed">
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
            <div className="space-y-6">
                {contactIds.map((id) => {
                    const contact = characters[id];
                    return (
                        <div key={id}>
                            <p className="mb-2.5 text-sm font-bold">
                                {contact ? contact.name : id} <span className={`font-normal ${MUTED}`}>· {contact?.role}</span>
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
        <section aria-label="Espace de travail" className="min-w-0">
            <div role="tablist" aria-label="Outils" className="flex gap-1.5 pl-2">
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
                            className={`flex items-center gap-2 rounded-t-lg border border-b-0 px-4 py-2.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b252] ${
                                selected
                                    ? "border-[#d6cbb0] bg-[#f3ecd9] font-bold text-[#2b2a26]"
                                    : "border-black/30 bg-[#3a3f44] text-[#cfc9b6] hover:bg-[#454b51]"
                            }`}
                        >
                            <Icon size={16} />
                            <span>
                                {candidate.label}
                                <span className={`ml-2 hidden text-xs font-normal sm:inline ${selected ? MUTED : "text-[#a39d8a]"}`}>
                                    {candidate.subtitle}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className={`${SURFACE} rounded-tl-none p-5`} role="tabpanel">
                {tool.kind === "dashboard" && (
                    <div className="mb-5 rounded-md border-2 border-black bg-[#14181c] p-4 text-[#d6dde3]">
                        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-[#7c8892]">{tool.subtitle} · temps réel</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3">
                            {readouts.map((readout) => (
                                <div key={readout.id}>
                                    <p className="text-xs text-[#7c8892]">{readout.label}</p>
                                    <p className={`font-mono text-base font-bold ${SCREEN_TONE[readout.tone]}`}>{readout.value}</p>
                                    {readout.hint && <p className="mt-0.5 text-xs text-[#9aa5ae]">{readout.hint}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className={`${LABEL} mb-3`}>{tool.description}</p>

                {tool.kind === "radio" ? renderRadio() : <div className="space-y-3">{toolActions.map(renderAction)}</div>}
            </div>
        </section>
    );
};

export default ToolPanel;
