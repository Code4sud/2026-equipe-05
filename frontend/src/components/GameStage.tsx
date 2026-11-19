import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { FC } from "react";
import { AlertTriangle, Trophy, Shield, Award, Sparkles, HardHat, MessageSquare } from "lucide-react";
import { SessionState, AgentTurnResponse } from "../types";
import { TopBar } from "./gameplay/TopBar";
import { BriefingScreen } from "./gameplay/BriefingScreen";
import { DebriefScreen } from "./gameplay/DebriefScreen";
import { MissionPanel } from "./gameplay/MissionPanel";
import { StatusIndicators } from "./gameplay/StatusIndicators";
import { DialogueStage } from "./gameplay/DialogueStage";
import { ChatLog, ReplyPicker } from "./gameplay/ChatPanel";
import type { ReplyMode } from "./gameplay/ChatPanel";
import { GuideProvider, GuideZone } from "./gameplay/guide";
import { useTypewriter } from "./gameplay/hooks";
import { DESK, SURFACE, LABEL } from "./gameplay/ui";
import type {
  Character,
  IndicatorView,
  ChatEntry,
  Expression,
  Tone,
  JournalEntry,
  DebriefContent,
  DebriefSkill,
  EndResult,
  BriefingContent,
} from "./gameplay/types";

interface GameStageProps {
  session: SessionState;
  latestTurn: AgentTurnResponse | null;
  onSendTurn: (message: string) => Promise<void>;
  onQuit: () => void;
  loading: boolean;
  onRestart?: () => void;
}

export const GameStage: FC<GameStageProps> = ({
  session,
  latestTurn,
  onSendTurn,
  onQuit,
  loading,
  onRestart,
}) => {
  // Phase: briefing (intro) -> playing (turns) -> debrief (bilan)
  const [phase, setPhase] = useState<"briefing" | "playing" | "debrief">(() => {
    if (session.statut !== "EN_COURS") return "debrief";
    if (session.tour_actuel === 1 && session.historique.length <= 1) return "briefing";
    return "playing";
  });

  // Consequence display state between turns
  const [showingConsequence, setShowConsequence] = useState<boolean>(false);
  const [lastPlayerReply, setLastPlayerReply] = useState<string | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  // When session status changes to VICTOIRE/DEFAITE, automatically allow debrief transition
  const isGameOver = session.statut !== "EN_COURS";

  // Map humeur_avatar to Expression
  const avatarExpression: Expression = useMemo(() => {
    if (loading) return "thinking";
    const mood = latestTurn?.humeur_avatar;
    if (mood === "happy") return "happy";
    if (mood === "angry") return "angry";
    return "neutral";
  }, [loading, latestTurn?.humeur_avatar]);

  // Character model
  const character: Character = useMemo(() => {
    return {
      id: "persona",
      name: session.scenario.persona.nom_role,
      role: session.scenario.titre_metier,
      expression: avatarExpression,
      dialogue: latestTurn?.replique_bulle || session.scenario.persona.premier_message,
      status: loading ? "listening" : "speaking",
    };
  }, [session.scenario, avatarExpression, latestTurn?.replique_bulle, loading]);

  // Indicators views computed from session jauges and current state
  const indicators: IndicatorView[] = useMemo(() => {
    return session.scenario.jauges.map((g) => {
      const val = session.jauges_actuelles[g.id] ?? g.depart;
      const delta = latestTurn?.deltas_jauges?.[g.id] ?? 0;

      let level: Tone = "neutral";
      if (g.seuil_victoire !== undefined && g.seuil_victoire !== null && val >= g.seuil_victoire) {
        level = "good";
      } else if (g.seuil_echec !== undefined && g.seuil_echec !== null && val <= g.seuil_echec + 10) {
        level = "bad";
      } else if (val >= 60) {
        level = "good";
      } else if (val >= 35) {
        level = "warn";
      } else {
        level = "bad";
      }

      let iconKey = "gauge";
      const lower = (g.nom + " " + g.id).toLowerCase();
      if (lower.includes("secur") || lower.includes("epi") || lower.includes("protect")) iconKey = "shield";
      else if (lower.includes("temp") || lower.includes("time") || lower.includes("chron")) iconKey = "alert";
      else if (lower.includes("relat") || lower.includes("comm") || lower.includes("nego")) iconKey = "handshake";

      return {
        id: g.id,
        label: g.nom,
        meaning: `Jauge de ${g.nom} (départ: ${g.depart}%, seuil échec: ${g.seuil_echec ?? "aucun"}, victoire: ${g.seuil_victoire ?? "aucun"})`,
        icon: iconKey,
        value: val,
        percent: Math.max(0, Math.min(100, val)),
        display: `${val}%`,
        level,
        deltaLabel: delta !== 0 ? `${delta > 0 ? "+" : "−"}${Math.abs(delta)}` : undefined,
        deltaTone: delta > 0 ? "good" : delta < 0 ? "bad" : undefined,
      };
    });
  }, [session.scenario.jauges, session.jauges_actuelles, latestTurn?.deltas_jauges]);

  // Speech bubble text with typewriter animation
  const speechText = latestTurn?.replique_bulle || session.scenario.persona.premier_message;
  const typing = useTypewriter(speechText, true);

  // Chat entries built from backend session.historique
  const chatEntries: ChatEntry[] = useMemo(() => {
    let id = 1;
    const entries: ChatEntry[] = [
      {
        id: id++,
        kind: "scene",
        time: `Tour 1`,
        text: session.scenario.titre_metier,
      },
    ];

    session.historique.forEach((h, index) => {
      const isAvatar = h.role === "avatar" || h.role === "assistant";
      entries.push({
        id: id++,
        kind: "say",
        speakerId: isAvatar ? "persona" : "player",
        text: h.content,
        expression: isAvatar ? "neutral" : undefined,
      });

      // Insert consequence if latest turn matches
      if (isAvatar && index > 0 && latestTurn?.explication_pedagogique) {
        const deltaList = Object.entries(latestTurn.deltas_jauges || {})
          .filter(([, d]) => d !== 0)
          .map(([gid, d]) => {
            const jauge = session.scenario.jauges.find((j) => j.id === gid);
            return { label: jauge?.nom || gid, delta: d };
          });
        entries.push({
          id: id++,
          kind: "consequence",
          tone: latestTurn.echec_critique ? "bad" : "neutral",
          title: latestTurn.echec_critique ? "Échec critique" : "Analyse pédagogique",
          text: latestTurn.explication_pedagogique,
          deltas: deltaList,
        });
      }
    });

    return entries;
  }, [session.historique, session.scenario, latestTurn]);

  // Reply choices
  const replies = useMemo(() => {
    const list =
      latestTurn?.propositions_suivantes && latestTurn.propositions_suivantes.some((p) => p.trim())
        ? latestTurn.propositions_suivantes.filter((p) => p.trim())
        : session.scenario.propositions_depart || [];

    return list.map((item, index) => ({
      id: `opt-${index}`,
      label: item,
    }));
  }, [latestTurn?.propositions_suivantes, session.scenario.propositions_depart]);

  // Reply mode for ReplyPicker
  let mode: ReplyMode;
  if (loading) {
    mode = "thinking";
  } else if (showingConsequence && latestTurn?.explication_pedagogique) {
    mode = "consequence";
  } else if (!typing.done) {
    mode = "continue";
  } else {
    mode = "replies";
  }

  // Handle Player Choosing or Submitting Free Text
  const handleChooseReply = useCallback(
    async (optionId: string, label: string) => {
      if (loading || isGameOver) return;
      setLastPlayerReply(label);
      setShowConsequence(true);
      await onSendTurn(label);
      setJournal((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          time: `Tour ${session.tour_actuel}`,
          label: session.scenario.persona.nom_role,
          text: label,
          tone: "neutral",
        },
      ]);
    },
    [loading, isGameOver, onSendTurn, session.tour_actuel, session.scenario.persona.nom_role]
  );

  const handleFreeReply = useCallback(
    async (text: string) => {
      if (!text.trim() || loading || isGameOver) return;
      setLastPlayerReply(text);
      setShowConsequence(true);
      await onSendTurn(text);
      setJournal((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          time: `Tour ${session.tour_actuel}`,
          label: session.scenario.persona.nom_role,
          text: text,
          tone: "neutral",
        },
      ]);
    },
    [loading, isGameOver, onSendTurn, session.tour_actuel, session.scenario.persona.nom_role]
  );

  // Advance from consequence card to next turn or to debrief
  const handleNextTurn = useCallback(() => {
    if (isGameOver) {
      setPhase("debrief");
      return;
    }
    setShowConsequence(false);
  }, [isGameOver]);

  // Briefing Content
  const briefingContent: BriefingContent = useMemo(() => {
    return {
      eyebrow: session.scenario.secteur,
      headline: session.scenario.titre_metier,
      narrative: [
        session.scenario.contexte,
        `Ton interlocuteur principal sera ${session.scenario.persona.nom_role} (ton : ${session.scenario.persona.ton}).`,
      ],
      roleSummary: `Vous disposez d'un maximum de ${session.scenario.tours_max} tours d'échanges pour atteindre les objectifs professionnels tout en maintenant les jauges au-dessus des seuils d'échec.`,
      objectives: [session.scenario.objectif_etudiant],
    };
  }, [session.scenario]);

  // Debrief Content
  const debriefContent: DebriefContent = useMemo(() => {
    const isWin = session.statut === "VICTOIRE";
    const headline = isWin ? "Mission accomplie !" : "Fin de simulation";
    const summary =
      session.message_fin ||
      (isWin
        ? "Félicitations ! Vous avez atteint les objectifs de la simulation professionnelle avec succès."
        : "La simulation s'est terminée sans valider l'ensemble des critères professionnels requis.");

    const skills: DebriefSkill[] = session.scenario.jauges.map((g) => {
      const val = session.jauges_actuelles[g.id] ?? g.depart;
      let comment = `Niveau final : ${val}%.`;
      if (g.seuil_victoire && val >= g.seuil_victoire) {
        comment += ` Seuil de victoire (${g.seuil_victoire}%) atteint !`;
      } else if (g.seuil_echec && val <= g.seuil_echec) {
        comment += ` Seuil critique d'échec (${g.seuil_echec}%) franchi.`;
      }
      return {
        label: g.nom,
        score: val,
        comment,
      };
    });

    const insights = [
      `Secteur : ${session.scenario.secteur}`,
      `Règle clé : ${session.scenario.regles_evaluation || "Rigueur professionnelle et respect des consignes"}`,
      `Interlocuteur : ${session.scenario.persona.nom_role}`,
    ];

    return {
      headline,
      summary,
      skills,
      insights,
    };
  }, [session]);

  const endResult: EndResult = useMemo(() => {
    return {
      status: session.statut === "VICTOIRE" ? "success" : "failure",
      reason: session.message_fin || (session.statut === "VICTOIRE" ? "Objectif validé" : "Échec des critères"),
    };
  }, [session.statut, session.message_fin]);

  // Progress object
  const progress = useMemo(() => {
    const isWin = session.statut === "VICTOIRE";
    return {
      done: isWin ? 1 : 0,
      total: 1,
      objectives: [
        {
          id: "obj-1",
          label: session.scenario.objectif_etudiant,
          done: isWin,
        },
      ],
    };
  }, [session.statut, session.scenario.objectif_etudiant]);

  // Consequence payload
  const consequenceData = useMemo(() => {
    if (!latestTurn?.explication_pedagogique) return null;
    const deltas = Object.entries(latestTurn.deltas_jauges || {})
      .filter(([, d]) => d !== 0)
      .map(([gid, d]) => {
        const jauge = session.scenario.jauges.find((j) => j.id === gid);
        return { label: jauge?.nom || gid, delta: d };
      });

    const hasPositive = Object.values(latestTurn.deltas_jauges || {}).some((d) => d > 0);
    const hasNegative = Object.values(latestTurn.deltas_jauges || {}).some((d) => d < 0);
    const tone: Tone = latestTurn.echec_critique ? "bad" : hasPositive ? "good" : hasNegative ? "warn" : "neutral";

    return {
      tone,
      title: latestTurn.echec_critique ? "Échec critique" : "Analyse pédagogique",
      text: latestTurn.explication_pedagogique,
      deltas,
      metier: session.scenario.secteur,
    };
  }, [latestTurn, session.scenario]);

  const header = (
    <TopBar
      missionTitle={session.scenario.titre_metier}
      timeLabel={`Tour ${session.tour_actuel}/${session.scenario.tours_max}`}
      finished={session.statut !== "EN_COURS"}
      progress={progress}
      onQuit={onQuit}
      onRestart={onRestart ?? onQuit}
    />
  );

  // 1. Briefing Phase
  if (phase === "briefing") {
    return (
      <div className={`min-h-screen ${DESK}`}>
        {header}
        <BriefingScreen
          briefing={briefingContent}
          role={session.scenario.persona.nom_role}
          location={session.scenario.contexte}
          characters={[character]}
          onStart={() => setPhase("playing")}
        />
      </div>
    );
  }

  // 2. Debrief Phase
  if (phase === "debrief") {
    return (
      <div className={`min-h-screen ${DESK}`}>
        {header}
        <DebriefScreen
          result={endResult}
          content={debriefContent}
          indicators={indicators}
          journal={journal}
          onRestart={onRestart ?? onQuit}
          onQuit={onQuit}
        />
      </div>
    );
  }

  // 3. Playing Phase
  return (
    <GuideProvider value={{ active: false, targetId: null }}>
      <div className={`min-h-screen ${DESK}`}>
        {header}

        {/* Conteneur optimisé : marges réduites, pleine largeur et hauteur contrôlée sans scroll obligatoire */}
        <div className="mx-auto max-w-[1600px] w-full px-2 sm:px-4 md:px-6 py-2 sm:py-3 space-y-2.5">
          {/* Status Indicators / Jauges en bandeau fin pleine largeur */}
          <GuideZone id="status" label="tes jauges">
            <StatusIndicators indicators={indicators} />
          </GuideZone>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* Colonne GAUCHE : Scène de dialogue & réponses */}
            <div className="min-w-0 space-y-2.5">
              <GuideZone id="stage" label="ton interlocuteur">
                <DialogueStage
                  character={character}
                  expression={avatarExpression}
                  time={`Tour ${session.tour_actuel}`}
                  place={session.scenario.secteur}
                  title={session.scenario.titre_metier}
                  objectiveLabel={session.scenario.objectif_etudiant}
                  shown={typing.shown}
                  fullText={speechText}
                  thinking={loading}
                  playerText={showingConsequence ? lastPlayerReply : null}
                  done={typing.done}
                  more={false}
                  onAdvance={typing.skip}
                />
              </GuideZone>

              {/* Erreur API Groq éventuelle */}
              {latestTurn?.erreur_api && (
                <div className="rounded-lg border-2 border-rose-500/50 bg-rose-950/80 p-3 text-xs text-rose-200 shadow-lg">
                  <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>Erreur détaillée de communication avec l'API IA :</span>
                  </div>
                  <pre className="font-mono text-[11px] text-rose-100 whitespace-pre-wrap bg-slate-950/80 p-2 rounded border border-rose-900/60 max-h-32 overflow-y-auto">
                    {latestTurn.erreur_api}
                  </pre>
                </div>
              )}

              {/* Sélecteur de réponse ou conséquences */}
              <GuideZone id="replies" label="tes réponses">
                <ReplyPicker
                  mode={mode}
                  speakerName={session.scenario.persona.nom_role}
                  replies={replies}
                  supportsFreeText={true}
                  freeTextHint="Réponse libre analysée en direct par l'agent IA."
                  error={null}
                  hasNext={!isGameOver}
                  consequence={consequenceData}
                  onChoose={handleChooseReply}
                  onFree={handleFreeReply}
                  onContinue={typing.skip}
                  onNext={handleNextTurn}
                />
              </GuideZone>
            </div>

            {/* Colonne DROITE : Historique au-dessus de la Mission */}
            <aside className="space-y-2.5">
              {/* Historique de conversation déplacé à droite */}
              <GuideZone id="chatlog" label="historique des échanges">
                <section className={`${SURFACE} p-3.5 flex flex-col`} aria-label="Historique de la conversation">
                  <div className="flex items-center justify-between border-b border-[#ddd2b6] pb-2 mb-2">
                    <p className={`${LABEL} flex items-center gap-1.5`}>
                      <MessageSquare size={13} className="text-[#2c5a7a]" />
                      HISTORIQUE DU DIALOGUE
                    </p>
                    <span className="font-mono text-[11px] text-[#6b6657]">
                      {session.historique.length} messages
                    </span>
                  </div>
                  <div className="max-h-[230px] lg:max-h-[270px] xl:max-h-[300px] overflow-y-auto pr-1">
                    <ChatLog entries={chatEntries} characters={{ persona: character }} />
                  </div>
                </section>
              </GuideZone>

              {/* Mission & Objectifs placé en dessous de l'historique */}
              <GuideZone id="mission" label="ta mission">
                <MissionPanel
                  title={session.scenario.titre_metier}
                  role={session.scenario.persona.nom_role}
                  location={session.scenario.secteur}
                  objectives={progress.objectives}
                />
              </GuideZone>
            </aside>
          </div>
        </div>
      </div>
    </GuideProvider>
  );
};

export default GameStage;
