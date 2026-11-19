
import React, { useState } from "react";
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    FileText,
    Gauge,
    Monitor,
    Radio,
    ShieldCheck,
    Wind,
    Wrench,
} from "lucide-react";

type Tool = "computer" | "documents" | "radio" | "mission";

export const GameplayPrototype: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>("computer");
    const [safety, setSafety] = useState(70);
    const [diagnostic, setDiagnostic] = useState(20);
    const [completedActions, setCompletedActions] = useState<string[]>([]);
    const [messages, setMessages] = useState([
        "Marc : On a une alerte critique sur E-4. Le vent souffle à 25 nœuds. Avant toute intervention, je veux savoir comment tu comptes procéder.",
    ]);

    const actions = [
        {
            id: "weather",
            title: "Consulter les conditions météo",
            description: "Vérifier les conditions avant toute intervention.",
            safety: 10,
            diagnostic: 5,
            feedback: "Les conditions météo ont été vérifiées. L'intervention doit rester conditionnée à leur évolution.",
        },
        {
            id: "lockout",
            title: "Préparer la consignation",
            description: "Préparer la mise en sécurité avant toute intervention.",
            safety: 15,
            diagnostic: 10,
            feedback: "La procédure de consignation est préparée. Marc valide cette première étape.",
        },
        {
            id: "remote",
            title: "Demander l'arrêt à distance",
            description: "Demander la mise à l'arrêt de l'éolienne.",
            safety: 10,
            diagnostic: 15,
            feedback: "La demande d'arrêt à distance a été simulée. L'équipe doit confirmer la mise en sécurité.",
        },
    ];

    const performAction = (action: typeof actions[number]) => {
        if (completedActions.includes(action.id)) return;

        // GAMEPLAY : action locale du joueur.
        // FUTURE INTEGRATION IA : transmettre l'action à l'agent
        // pour générer une réaction contextualisée de Marc.
        // FUTURE INTEGRATION BACKEND : enregistrer l'action
        // dans la session et actualiser les jauges réelles.

        setCompletedActions((previous) => [...previous, action.id]);
        setSafety((value) => Math.min(100, value + action.safety));
        setDiagnostic((value) => Math.min(100, value + action.diagnostic));
        setMessages((previous) => [...previous, `Toi : ${action.title}.`, `Marc : ${action.feedback}`]);
    };

    const navigation: {
        id: Tool;
        label: string;
        description: string;
        icon: React.ElementType;
    }[] = [
        { id: "computer", label: "Ordinateur", description: "Système E-4", icon: Monitor },
        { id: "documents", label: "Documents", description: "Procédures", icon: FileText },
        { id: "radio", label: "Radio", description: "Communication", icon: Radio },
        { id: "mission", label: "Mission", description: "Objectifs", icon: ClipboardList },
    ];

    return (
        <div className="min-h-screen bg-[#080d14] text-slate-100">
            <header className="h-16 border-b border-white/10 bg-[#0d1520] px-5 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                        <Wind className="text-cyan-400 w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold tracking-wide text-sm">AGORA <span className="text-cyan-400">EXPLORER</span></p>
                        <p className="text-[10px] text-slate-500 tracking-[0.2em]">ROLEPLAY STUDIO · PRÉ-ALPHA 0.1</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-5 text-xs text-slate-400">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> SIMULATION LOCALE</span>
                    <span>MISSION 01 / 01</span>
                </div>

                <button
                    onClick={() => window.history.back()}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-2"
                >
                    <ArrowLeft size={15} /> Quitter
                </button>
            </header>

            <main className="max-w-[1500px] mx-auto p-4 md:p-7 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_310px] gap-5">

                {/* COLONNE GAUCHE : MISSION ET INDICATEURS */}
                <aside className="space-y-5">
                    <section className="rounded-xl border border-white/10 bg-[#111c29] p-5">
                        <div className="flex items-center gap-2 text-cyan-400 mb-4">
                            <ClipboardList size={17} />
                            <span className="text-[10px] font-bold tracking-[0.16em]">ORDRE DE MISSION</span>
                        </div>
                        <h1 className="text-lg font-bold mb-2">Intervention E-4</h1>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Une anomalie critique a été détectée sur le multiplicateur d'une éolienne offshore.
                            Tu dois préparer une intervention en respectant les procédures de sécurité.
                        </p>
                        <div className="mt-5 pt-4 border-t border-white/10">
                            <p className="text-[10px] text-slate-500 uppercase mb-2">Priorité</p>
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400">
                <AlertTriangle size={14} /> Critique
              </span>
                        </div>
                    </section>

                    <section className="rounded-xl border border-white/10 bg-[#111c29] p-5 space-y-5">
                        <div className="flex items-center gap-2 text-slate-300">
                            <Activity size={16} />
                            <span className="text-[10px] font-bold tracking-[0.16em]">ÉTAT DE LA MISSION</span>
                        </div>

                        {[
                            { label: "Sécurité", value: safety, icon: ShieldCheck },
                            { label: "Diagnostic", value: diagnostic, icon: Gauge },
                        ].map((gauge) => (
                            <div key={gauge.label}>
                                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    <gauge.icon size={14} /> {gauge.label}
                  </span>
                                    <span className="text-xs font-mono font-bold">{gauge.value}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                                        style={{ width: `${gauge.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                        <div className="flex gap-2 items-center text-amber-400 mb-2">
                            <AlertTriangle size={15} />
                            <span className="text-[10px] font-bold tracking-wider">CONDITIONS EXTÉRIEURES</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Vent</span>
                            <strong>25 nœuds</strong>
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                            <span className="text-slate-400">Site</span>
                            <strong>Offshore E-4</strong>
                        </div>
                    </section>
                </aside>

                {/* CENTRE : ESPACE DE TRAVAIL */}
                <section className="min-w-0 space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-cyan-400 tracking-[0.2em] font-bold">POSTE DE CONTRÔLE</p>
                            <h2 className="text-xl font-bold mt-1">Centre d'intervention</h2>
                        </div>
                        <span className="text-[10px] text-slate-500 border border-white/10 rounded-md px-3 py-2">ZONE 01 · CONTRÔLE</span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#142334] to-[#0d1520] p-5 md:p-7 min-h-[300px]">
                        <div className="flex items-center justify-between mb-7">
                            <span className="text-[10px] tracking-[0.2em] text-slate-500 font-bold">ÉQUIPEMENTS DISPONIBLES</span>
                            <span className="text-[10px] text-emerald-400">4 SYSTÈMES ACTIFS</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const selected = activeTool === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTool(item.id)}
                                        className={`min-h-32 rounded-xl border p-4 flex flex-col items-start justify-between text-left transition-all ${
                                            selected
                                                ? "bg-cyan-400/10 border-cyan-400/50 shadow-lg shadow-cyan-950/30"
                                                : "bg-[#0a121c]/70 border-white/10 hover:border-white/30"
                                        }`}
                                    >
                                        <Icon className={selected ? "text-cyan-400" : "text-slate-400"} size={24} />
                                        <div>
                                            <p className="text-sm font-semibold">{item.label}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">{item.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 border-t border-white/10 pt-4 flex items-center gap-2 text-[10px] text-slate-500">
                            <Wrench size={13} /> Sélectionne un équipement pour interagir avec lui.
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#111c29] p-5 md:p-6 min-h-[250px]">
                        {activeTool === "computer" && (
                            <>
                                <div className="flex items-center gap-2 text-cyan-400 mb-5">
                                    <Monitor size={18} />
                                    <h3 className="text-sm font-bold">SYSTÈME DE SUPERVISION E-4</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        ["Multiplicateur", "Anomalie détectée", "text-rose-400"],
                                        ["Vitesse rotor", "12,4 tr/min", "text-white"],
                                        ["Température", "82 °C", "text-amber-400"],
                                    ].map(([label, value, color]) => (
                                        <div key={label} className="bg-[#0a121c] rounded-lg p-4 border border-white/5">
                                            <p className="text-[10px] text-slate-500 mb-2">{label}</p>
                                            <p className={`text-sm font-semibold ${color}`}>{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 mt-5 leading-relaxed">
                                    Une alerte technique nécessite une vérification avant toute décision d'intervention.
                                    Ces données sont fictives et servent uniquement à la simulation.
                                </p>
                            </>
                        )}

                        {activeTool === "documents" && (
                            <>
                                <div className="flex items-center gap-2 text-cyan-400 mb-5">
                                    <FileText size={18} />
                                    <h3 className="text-sm font-bold">DOCUMENTATION TECHNIQUE</h3>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        ["PROC-SEC-04", "Procédure de mise en sécurité"],
                                        ["MAINT-E4-02", "Fiche technique du multiplicateur"],
                                        ["HSE-2026-01", "Consignes générales de sécurité"],
                                    ].map(([reference, title]) => (
                                        <div key={reference} className="p-4 rounded-lg bg-[#0a121c] border border-white/5 flex justify-between items-center gap-3">
                                            <div>
                                                <p className="text-[10px] text-cyan-400">{reference}</p>
                                                <p className="text-xs font-medium mt-1">{title}</p>
                                            </div>
                                            <CheckCircle2 size={16} className="text-slate-500 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTool === "radio" && (
                            <>
                                <div className="flex items-center gap-2 text-cyan-400 mb-5">
                                    <Radio size={18} />
                                    <h3 className="text-sm font-bold">COMMUNICATION · CANAL 04</h3>
                                </div>
                                <div className="space-y-3 max-h-52 overflow-y-auto">
                                    {messages.map((message, index) => (
                                        <div key={index} className="rounded-lg bg-[#0a121c] border border-white/5 p-3 text-xs text-slate-300">
                                            {message}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setMessages((previous) => [...previous, "Marc : Je reste en attente de tes premières vérifications. Tiens-moi informé avant toute intervention."])}
                                    className="mt-4 text-xs bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 rounded-lg px-4 py-3 hover:bg-cyan-500/20"
                                >
                                    Répondre à Marc
                                </button>
                            </>
                        )}

                        {activeTool === "mission" && (
                            <>
                                <div className="flex items-center gap-2 text-cyan-400 mb-5">
                                    <ClipboardList size={18} />
                                    <h3 className="text-sm font-bold">OBJECTIFS DE L'INTERVENTION</h3>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        ["Consulter les conditions météo", "weather"],
                                        ["Préparer la consignation", "lockout"],
                                        ["Demander l'arrêt à distance", "remote"],
                                    ].map(([label, id]) => (
                                        <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a121c] border border-white/5">
                                            {completedActions.includes(id) ? (
                                                <CheckCircle2 className="text-emerald-400" size={17} />
                                            ) : (
                                                <div className="w-[17px] h-[17px] rounded-full border border-slate-600" />
                                            )}
                                            <span className={`text-xs ${completedActions.includes(id) ? "text-slate-500 line-through" : "text-slate-200"}`}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* DROITE : ACTIONS DU JOUEUR */}
                <aside className="space-y-5">
                    <section className="rounded-xl border border-white/10 bg-[#111c29] p-5">
                        <div className="flex items-center gap-2 text-cyan-400 mb-4">
                            <Wrench size={17} />
                            <span className="text-[10px] font-bold tracking-[0.16em]">ACTIONS DISPONIBLES</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-5">
                            Choisis comment tu souhaites commencer ton intervention.
                        </p>

                        <div className="space-y-3">
                            {actions.map((action) => {
                                const done = completedActions.includes(action.id);
                                return (
                                    <button
                                        key={action.id}
                                        disabled={done}
                                        onClick={() => performAction(action)}
                                        className="w-full text-left rounded-lg border border-white/10 bg-[#0a121c] p-4 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all disabled:opacity-50 disabled:cursor-default"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-xs font-semibold leading-relaxed">{action.title}</p>
                                            {done && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed mt-2">{action.description}</p>
                                        <p className="text-[9px] text-cyan-400 mt-3">{done ? "ACTION EFFECTUÉE" : "SÉLECTIONNER →"}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                        <p className="text-[10px] text-cyan-400 font-bold tracking-wider mb-2">RAPPEL</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Une décision peut avoir des conséquences sur la sécurité et la progression de ta mission.
                            Prends le temps d'examiner les informations disponibles.
                        </p>
                    </section>
                </aside>
            </main>
        </div>
    );
};

export default GameplayPrototype;
