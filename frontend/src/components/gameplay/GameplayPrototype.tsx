import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FC } from "react";
import { offshoreTurbineMission } from "./missions/offshoreTurbineMission";
import { useSimulation } from "./useSimulation";
import { getCurrentTime, getDebrief, getEncounter, getIndicatorViews, getProgress } from "./simulation";
import { TopBar } from "./TopBar";
import { BriefingScreen } from "./BriefingScreen";
import { DebriefScreen } from "./DebriefScreen";
import { MissionPanel } from "./MissionPanel";
import { StatusIndicators } from "./StatusIndicators";
import { DialogueStage } from "./DialogueStage";
import { ChatLog, ReplyPicker } from "./ChatPanel";
import type { ReplyMode } from "./ChatPanel";
import { lastCharBeatUpTo, useScene } from "./useScene";
import { useTypewriter } from "./hooks";
import { GuideProvider, GuideZone, hasSeenGuide, markGuideSeen } from "./guide";
import { VoiceBox } from "./VoiceBox";
import { DESK } from "./ui";
import type { Responder } from "./types";

/**
 * Expérience de jeu principale (pré-alpha, 100 % locale).
 *
 * Boucle « à la Papers, Please » : quelqu'un vient te parler selon le contexte
 * (rencontre), face à toi, dans ton lieu de travail, avec sa bulle → tu choisis
 * l'une des trois réponses prêtes, ou tu écris la tienne → le personnage réagit et
 * les conséquences s'appliquent (jauges, objectifs, « dans ce métier… ») → la
 * personne suivante dépend de ce que tu as fait → bilan.
 *
 * Qui décide de la réaction et des conséquences ? Un « répondant » (`Responder`).
 * Aujourd'hui : `scriptedResponder`, scénario écrit à la main (PAS une IA).
 *
 * Visite guidée : à la première prise de poste, la boîte vocale du commandement
 * présente chaque zone à tour de rôle (les autres sont floutées) et attend que
 * le joueur confirme. Elle se relance depuis la barre du haut.
 *
 * FUTURE INTEGRATION IA :
 * passer à `useSimulation` un `Responder` branché sur l'agent (réaction du
 * personnage, conséquences, jauges) ; la saisie libre s'active alors toute seule.
 *
 * FUTURE INTEGRATION BACKEND :
 * remplacer `offshoreTurbineMission` par le scénario de la session et
 * transmettre les réponses du joueur à cette session.
 */

interface GameplayPrototypeProps {
    onQuit?: () => void;
    /**
     * Qui décide des réactions et des conséquences. Par défaut : le scénario local.
     * FUTURE INTEGRATION IA : passer ici le répondant branché sur l'agent.
     */
    responder?: Responder;
    /** Durée minimale de « l'écriture » du personnage, en ms (rythme de conversation). */
    thinkingMs?: number;
}

export const GameplayPrototype: FC<GameplayPrototypeProps> = ({ onQuit, responder, thinkingMs }) => {
    const mission = offshoreTurbineMission;
    const { state, supportsFreeText, start, reply, next, restart } = useSimulation(mission, { responder, thinkingMs });

    const handleQuit = onQuit ?? (() => window.history.back());

    // Visite guidée : `guideIndex === null` = fermée.
    const guideSteps = mission.guide ?? [];
    const [guideIndex, setGuideIndex] = useState<number | null>(null);
    const guideActive = guideIndex !== null && guideSteps.length > 0;

    // S'ouvre toute seule à la première prise de poste, une fois la mission lancée.
    const previousPhase = useRef(state.phase);
    useEffect(() => {
        if (previousPhase.current !== "playing" && state.phase === "playing" && guideSteps.length > 0) {
            if (!hasSeenGuide(mission.id)) setGuideIndex(0);
        }
        previousPhase.current = state.phase;
    }, [state.phase, guideSteps.length, mission.id]);

    const closeGuide = useCallback(() => {
        markGuideSeen(mission.id);
        setGuideIndex(null);
    }, [mission.id]);
    const nextGuide = useCallback(() => {
        setGuideIndex((current) => {
            if (current === null) return current;
            if (current >= guideSteps.length - 1) {
                markGuideSeen(mission.id);
                return null;
            }
            return current + 1;
        });
    }, [guideSteps.length, mission.id]);
    const prevGuide = useCallback(() => setGuideIndex((current) => (current === null ? null : Math.max(0, current - 1))), []);

    const guideState = useMemo(
        () => ({ active: guideActive, targetId: guideIndex !== null ? (guideSteps[guideIndex]?.targetId ?? null) : null }),
        [guideActive, guideIndex, guideSteps],
    );

    const progress = useMemo(() => getProgress(state, mission), [state, mission]);
    const characters = useMemo(() => mission.characters.map((c) => state.characters[c.id]), [mission, state.characters]);
    const encounter = getEncounter(mission, state.encounterId);
    const speaker = encounter ? state.characters[encounter.characterId] : undefined;

    // Scène : répliques affichées une à une
    const scene = useScene(state.chat, state.step, state.encounterId);
    const beat = scene.beat;
    const charBeat = beat?.kind === "char" ? beat : beat?.kind === "consequence" ? lastCharBeatUpTo(scene.beats, scene.cursor) : null;
    const speechText = charBeat?.text ?? null;
    const typing = useTypewriter(speechText ?? "", beat?.kind === "char");
    const lineDone = speechText === null || typing.done;
    const thinking = state.step === "thinking";

    const advanceLine = useCallback(() => {
        if (!typing.done) typing.skip();
        else scene.advance();
    }, [typing, scene]);

    let mode: ReplyMode;
    if (thinking) mode = "thinking";
    else if (state.step === "asking" && guideActive) mode = "replies"; // la visite guidée montre la zone de réponse
    else if (!scene.atLast || !lineDone) mode = "continue";
    else mode = state.step === "asking" ? "replies" : "consequence";

    const chooseReply = useCallback((optionId: string, label: string) => void reply({ kind: "choice", optionId, label }), [reply]);
    const freeReply = useCallback((text: string) => void reply({ kind: "free", text }), [reply]);

    // Entrée / Espace / flèche droite : réplique suivante, ou personne suivante (hors visite guidée)
    const keys = useRef({ mode, advanceLine, next });
    keys.current = { mode, advanceLine, next };
    useEffect(() => {
        if (state.phase !== "playing" || guideActive) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
            if (!["Enter", " ", "ArrowRight"].includes(event.key)) return;
            const target = event.target as { closest?: (selector: string) => Element | null } | null;
            if (target?.closest?.("button, a, input, textarea, select, summary, [role='tab']")) return;
            if (keys.current.mode === "continue") {
                event.preventDefault();
                keys.current.advanceLine();
            } else if (keys.current.mode === "consequence") {
                event.preventDefault();
                keys.current.next();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [state.phase, guideActive]);

    const header = (
        <TopBar
            missionTitle={mission.title}
            timeLabel={getCurrentTime(state, mission)}
            finished={state.phase === "debrief"}
            progress={progress}
            onQuit={handleQuit}
            onRestart={restart}
            onGuide={state.phase === "playing" && guideSteps.length > 0 ? () => setGuideIndex(0) : undefined}
        />
    );

    if (state.phase === "briefing") {
        return (
            <div className={`min-h-screen ${DESK}`}>
                {header}
                <BriefingScreen briefing={mission.briefing} role={mission.role} location={mission.location} characters={characters} onStart={start} />
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

    const objectiveLabel = progress.objectives.find((objective) => objective.id === encounter?.objectiveId)?.label;
    const consequenceBeat = beat?.kind === "consequence" ? beat : null;
    const stageExpression = charBeat?.expression ?? (thinking ? "thinking" : (speaker?.expression ?? "neutral"));

    return (
        <GuideProvider value={guideState}>
            <div className={`min-h-screen ${DESK} ${guideActive ? "pb-80 md:pb-56" : ""}`}>
                {header}

                <div className="mx-auto max-w-[1100px] space-y-5 p-4 md:p-6">
                    <GuideZone id="status" label="tes jauges">
                        <StatusIndicators indicators={getIndicatorViews(state, mission)} />
                    </GuideZone>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                        {/* GAUCHE : la scène et tes réponses */}
                        <div className="min-w-0 space-y-5">
                            {speaker && encounter && (
                                <GuideZone id="stage" label="ton interlocuteur">
                                    <DialogueStage
                                        character={speaker}
                                        expression={stageExpression}
                                        time={encounter.time}
                                        place={encounter.place}
                                        title={encounter.title}
                                        objectiveLabel={objectiveLabel}
                                        shown={speechText === null ? null : typing.shown}
                                        fullText={speechText}
                                        thinking={thinking}
                                        playerText={beat?.kind === "player" ? beat.text : null}
                                        done={lineDone}
                                        more={!scene.atLast}
                                        onAdvance={advanceLine}
                                    />
                                </GuideZone>
                            )}

                            <GuideZone id="replies" label="tes réponses">
                                <ReplyPicker
                                    mode={mode}
                                    speakerName={speaker?.name ?? "Ton interlocuteur"}
                                    replies={encounter?.replies.map(({ id, label }) => ({ id, label })) ?? []}
                                    supportsFreeText={supportsFreeText}
                                    freeTextHint="Pré-alpha : le scénario local rapproche ta phrase de l'une des réponses ci-dessus (ce n'est pas encore une IA)."
                                    error={state.error}
                                    hasNext={!state.result && state.nextEncounterId !== null}
                                    consequence={
                                        consequenceBeat
                                            ? {
                                                  tone: consequenceBeat.entry.tone,
                                                  title: consequenceBeat.entry.title,
                                                  text: consequenceBeat.entry.text,
                                                  deltas: consequenceBeat.entry.deltas,
                                                  objectives: consequenceBeat.objectives,
                                                  metier: encounter?.metier,
                                              }
                                            : null
                                    }
                                    onChoose={chooseReply}
                                    onFree={freeReply}
                                    onContinue={advanceLine}
                                    onNext={next}
                                />
                            </GuideZone>

                            <details className="rounded-lg border border-[#41505b] bg-[#1b1f23] text-[#e8e2d0]">
                                <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-[#a39d8a] hover:text-white">
                                    Relire la conversation
                                </summary>
                                <div className="p-3">
                                    <ChatLog entries={state.chat} characters={state.characters} />
                                </div>
                            </details>
                            <p className="text-xs text-[#8f8a78]">Pré-alpha : les réactions des personnages sont écrites à la main (pas encore d'agent IA).</p>
                        </div>

                        {/* DROITE : la mission */}
                        <aside>
                            <GuideZone id="mission" label="ta mission">
                                <MissionPanel title={mission.title} role={mission.role} location={mission.location} objectives={progress.objectives} />
                            </GuideZone>
                        </aside>
                    </div>
                </div>

                {guideActive && guideIndex !== null && (
                    <VoiceBox steps={guideSteps} index={guideIndex} onNext={nextGuide} onPrev={prevGuide} onClose={closeGuide} />
                )}
            </div>
        </GuideProvider>
    );
};

export default GameplayPrototype;
