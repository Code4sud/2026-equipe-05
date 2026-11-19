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
import { CallStage, CharacterGroup } from "./CharacterDisplay";
import { OutcomeBanner } from "./OutcomeBanner";
import { ToolPanel } from "./ToolPanel";
import { ActionPanel } from "./ActionPanel";
import { DialoguePanel } from "./DialoguePanel";
import { DecisionOverlay } from "./DecisionOverlay";
import { DESK } from "./ui";

/**
 * Expérience de jeu principale (pré-alpha, 100 % locale).
 *
 * Boucle : prise de poste → mission → observation → interactions → décision
 * → conséquences → progression → bilan. Toute la simulation est calculée dans
 * React à partir d'une `MissionDefinition` ; rien ne dépend du backend.
 *
 * Lecture de l'écran : à gauche, ce qui se passe (qui parle, ce que tu viens de
 * provoquer, ton poste de travail) ; à droite, ce que tu dois faire (mission,
 * conditions à réunir, commandes). Une décision s'ouvre en fiche au centre.
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
            <div className={`min-h-screen ${DESK}`}>
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
                <div className={`min-h-screen ${DESK}`}>
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
        <div className={`min-h-screen ${DESK}`}>
            {header}

            <div className="mx-auto max-w-[1280px] space-y-5 p-4 md:p-6">
                <StatusIndicators indicators={getIndicatorViews(state, mission)} />

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
                    {/* GAUCHE : ce qui se passe */}
                    <div className="min-w-0 space-y-5">
                        <CallStage characters={characters} />
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

                    {/* DROITE : ce que tu dois faire */}
                    <aside className="space-y-5">
                        <MissionPanel
                            title={mission.title}
                            location={mission.location}
                            objectives={progress.objectives}
                            info={info.visible}
                            hiddenCount={info.hiddenCount}
                        />
                        <ActionPanel
                            actions={commandActions}
                            status={status}
                            readiness={mission.readiness(ctx)}
                            result={state.result}
                            onPerform={perform}
                            onOpenDebrief={openDebrief}
                        />
                        <DialoguePanel lines={state.dialogue} characters={state.characters} />
                    </aside>
                </div>
            </div>

            {pendingDecision && (
                <DecisionOverlay
                    decision={pendingDecision}
                    speakerName={pendingDecision.characterId ? state.characters[pendingDecision.characterId]?.name : undefined}
                    onChoose={decide}
                />
            )}
        </div>
    );
};

export default GameplayPrototype;
