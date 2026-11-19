import { useMemo } from "react";
import type { FC } from "react";
import { offshoreTurbineMission } from "./missions/offshoreTurbineMission";
import { useSimulation } from "./useSimulation";
import { buildContext, getActionStatus, getDebrief, getIndicatorViews, getMissionInfo, getProgress } from "./simulation";
import { TopBar } from "./TopBar";
import { BriefingScreen } from "./BriefingScreen";
import { DebriefScreen } from "./DebriefScreen";
import { MissionPanel } from "./MissionPanel";
import { StatusIndicators } from "./StatusIndicators";
import { CharacterGroup } from "./CharacterDisplay";
import { OutcomeBanner } from "./OutcomeBanner";
import { ToolPanel } from "./ToolPanel";
import { ActionPanel } from "./ActionPanel";
import { DialoguePanel } from "./DialoguePanel";

/**
 * Expérience de jeu principale (pré-alpha, 100 % locale).
 *
 * Boucle : prise de poste → mission → observation → interactions → décision
 * → conséquences → progression → bilan. Toute la simulation est calculée dans
 * React à partir d'une `MissionDefinition` ; rien ne dépend du backend.
 *
 * FUTURE INTEGRATION BACKEND :
 * remplacer `offshoreTurbineMission` par le scénario de la session et
 * transmettre actions et décisions du joueur à cette session.
 *
 * FUTURE INTEGRATION IA :
 * alimenter `state.characters` et `state.dialogue` avec les personnages et
 * répliques générés par les agents.
 */

interface GameplayPrototypeProps {
    onQuit?: () => void;
}

export const GameplayPrototype: FC<GameplayPrototypeProps> = ({ onQuit }) => {
    const mission = offshoreTurbineMission;
    const { state, start, perform, decide, selectTool, openDebrief, restart } = useSimulation(mission);

    const handleQuit = onQuit ?? (() => window.history.back());

    const characters = useMemo(() => mission.characters.map((c) => state.characters[c.id]), [mission, state.characters]);
    const progress = useMemo(() => getProgress(state, mission), [state, mission]);

    const status = useMemo(() => {
        const entries: Record<string, ReturnType<typeof getActionStatus>> = {};
        mission.actions.forEach((action) => {
            entries[action.id] = getActionStatus(state, mission, action);
        });
        return entries;
    }, [state, mission]);

    const pendingDecision = state.pendingDecisionId
        ? (mission.decisions.find((decision) => decision.id === state.pendingDecisionId) ?? null)
        : null;

    const header = (
        <TopBar
            missionTitle={mission.title}
            clock={state.clock}
            finished={!!state.result}
            progress={progress}
            onQuit={handleQuit}
            onRestart={restart}
        />
    );

    if (state.phase === "briefing") {
        return (
            <div className="min-h-screen bg-[#080d14] text-slate-100">
                {header}
                <BriefingScreen
                    briefing={mission.briefing}
                    role={mission.role}
                    location={mission.location}
                    characters={characters}
                    onStart={start}
                />
            </div>
        );
    }

    if (state.phase === "debrief") {
        const debrief = getDebrief(state, mission);
        if (debrief) {
            return (
                <div className="min-h-screen bg-[#080d14] text-slate-100">
                    {header}
                    <DebriefScreen
                        result={debrief.result}
                        content={debrief.content}
                        indicators={debrief.indicators}
                        journal={debrief.journal}
                        onRestart={restart}
                        onQuit={handleQuit}
                    />
                </div>
            );
        }
    }

    const ctx = buildContext(state, mission);
    const info = getMissionInfo(state, mission);
    const workspaceTools = mission.tools.filter((tool) => tool.placement === "workspace");
    const commandActions = mission.actions.filter((action) =>
        mission.tools.some((tool) => tool.id === action.toolId && tool.placement === "actions"),
    );

    return (
        <div className="min-h-screen bg-[#080d14] text-slate-100">
            {header}

            <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 p-4 md:p-7 lg:grid-cols-[280px_minmax(0,1fr)_330px]">
                {/* GAUCHE : mission et indicateurs */}
                <aside className="space-y-5">
                    <MissionPanel
                        title={mission.title}
                        role={mission.role}
                        location={mission.location}
                        summary={mission.summary}
                        objectives={progress.objectives}
                        info={info.visible}
                        hiddenCount={info.hiddenCount}
                    />
                    <StatusIndicators indicators={getIndicatorViews(state, mission)} />
                </aside>

                {/* CENTRE : interlocuteurs, conséquences, espace de travail */}
                <div className="min-w-0 space-y-5">
                    <CharacterGroup characters={characters} />
                    <OutcomeBanner turn={state.lastTurn} />
                    <ToolPanel
                        tools={workspaceTools}
                        activeToolId={state.activeToolId}
                        onSelectTool={selectTool}
                        actions={mission.actions}
                        characters={state.characters}
                        readouts={mission.readouts(ctx)}
                        findings={state.findings}
                        status={status}
                        onPerform={perform}
                    />
                </div>

                {/* DROITE : actions et communications */}
                <aside className="space-y-5">
                    <ActionPanel
                        actions={commandActions}
                        status={status}
                        readiness={mission.readiness(ctx)}
                        result={state.result}
                        onPerform={perform}
                        onOpenDebrief={openDebrief}
                    />
                    <DialoguePanel
                        lines={state.dialogue}
                        characters={state.characters}
                        pendingDecision={pendingDecision}
                        onChoose={decide}
                    />
                </aside>
            </main>
        </div>
    );
};

export default GameplayPrototype;
