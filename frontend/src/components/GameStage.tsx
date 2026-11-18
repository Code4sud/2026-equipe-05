import React, { useState } from 'react';
import { SessionState, AgentTurnResponse } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { Send, ArrowLeft, Trophy, AlertTriangle, Shield, Award, RotateCcw, Sparkles, HelpCircle } from 'lucide-react';

interface GameStageProps {
  session: SessionState;
  latestTurn: AgentTurnResponse | null;
  onSendTurn: (message: string) => Promise<void>;
  onQuit: () => void;
  loading: boolean;
}

export const GameStage: React.FC<GameStageProps> = ({ session, latestTurn, onSendTurn, onQuit, loading }) => {
  const [inputMessage, setInputMessage] = useState<string>("");
  const [lastDeltas, setLastDeltas] = useState<Record<string, number>>({});

  const handleChoiceClick = async (choiceText: string) => {
    if (loading || session.statut !== "EN_COURS") return;
    if (latestTurn?.deltas_jauges) {
      setLastDeltas(latestTurn.deltas_jauges);
    }
    await onSendTurn(choiceText);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading || session.statut !== "EN_COURS") return;
    const msg = inputMessage;
    setInputMessage("");
    if (latestTurn?.deltas_jauges) {
      setLastDeltas(latestTurn.deltas_jauges);
    }
    await onSendTurn(msg);
  };

  const isGameOver = session.statut !== "EN_COURS";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navigation / Status bar */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center bg-slate-900/80 border border-slate-800 px-6 py-4 rounded-2xl backdrop-blur-md shadow-xl z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onQuit}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Quitter
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {session.scenario.titre_metier}
            </h1>
            <p className="text-[11px] text-slate-400">Tour {session.tour_actuel} / {session.scenario.tours_max}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">
            {session.scenario.secteur}
          </span>
        </div>
      </header>

      {/* Main Game Grid */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 my-6 z-10 flex-1 items-center">
        
        {/* Left Column: Mission & Gauges */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mission Card */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-md">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Objectif Mission
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {session.scenario.objectif_etudiant}
            </p>
            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <strong className="text-slate-200 block mb-1">Contexte :</strong>
              {session.scenario.contexte}
            </div>
          </div>

          {/* Gauges Status Card */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Indicateurs Clés (Jauges)
            </h3>

            {session.scenario.jauges.map(gauge => {
              const val = session.jauges_actuelles[gauge.id] ?? 50;
              const delta = latestTurn?.deltas_jauges?.[gauge.id];

              let barColor = "bg-indigo-500";
              if (gauge.seuil_victoire !== undefined && gauge.seuil_victoire !== null && val >= gauge.seuil_victoire) {
                barColor = "bg-emerald-500";
              } else if (gauge.seuil_echec !== undefined && gauge.seuil_echec !== null && val <= gauge.seuil_echec + 10) {
                barColor = "bg-rose-500";
              }

              return (
                <div key={gauge.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      {gauge.seuil_victoire ? <Award className="w-3.5 h-3.5 text-emerald-400" /> : <Shield className="w-3.5 h-3.5 text-indigo-400" />}
                      {gauge.nom}
                    </span>
                    <div className="flex items-center gap-2">
                      {delta !== undefined && delta !== 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${delta > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                      <span className="font-mono font-bold text-white">{val}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.max(0, Math.min(100, val))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right Main Visual Novel Stage */}
        <div className="lg:col-span-3 flex flex-col justify-center items-center space-y-6 relative">
          
          {/* Pedagogical Explanation Box (if available) */}
<div>
          {latestTurn?.explication_pedagogique && (
            <div className="max-w-xl w-full bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl shadow-xl backdrop-blur-md flex items-start gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">
                  Analyse Pédagogique
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {latestTurn.explication_pedagogique}
                </p>
              </div>
            </div>
          )}
</div>

          {/* Character Avatar & Dialogue Bubble */}
          <div className="w-full max-w-2xl flex flex-col md:flex-row items-center gap-6 bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md relative">
            
            {/* Avatar */}
            <div className="flex-shrink-0">
              <CharacterAvatar
                humeur={latestTurn?.humeur_avatar || "neutral"}
                roleName={session.scenario.persona.nom_role}
              />
            </div>

            {/* Dialogue Bubble */}
            <div className="flex-1 bg-slate-950 border border-slate-800 p-6 rounded-2xl relative shadow-inner">
              <div className="absolute -left-3 top-8 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-slate-950 border-b-[8px] border-b-transparent hidden md:block"></div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {session.scenario.persona.nom_role}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Tour {session.tour_actuel}
                </span>
              </div>

              <p className="text-sm md:text-base text-slate-100 leading-relaxed font-medium">
                {loading ? (
                  <span className="flex items-center gap-2 text-slate-400 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin text-indigo-400" /> Réflexion de l'expert en cours...
                  </span>
                ) : (
                  `« ${latestTurn?.replique_bulle || session.scenario.persona.premier_message} »`
                )}
              </p>
            </div>
          </div>

          {/* Game Over / Victory Modal Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-30 flex items-center justify-center p-6 rounded-3xl animate-fadeIn">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${session.statut === "VICTOIRE" ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-rose-500/20 border border-rose-500/40 text-rose-400'}`}>
                  {session.statut === "VICTOIRE" ? <Trophy className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                </div>

                <div>
                  <h2 className={`text-2xl font-extrabold mb-2 ${session.statut === "VICTOIRE" ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {session.statut === "VICTOIRE" ? "MISSION ACCOMPLIE !" : "MISSION ÉCHOUÉE"}
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {session.message_fin || "La simulation est arrivée à son terme."}
                  </p>
                </div>

                <button
                  onClick={onQuit}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  <RotateCcw className="w-4 h-4" /> Retour au catalogue
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Area: Clickable Choices + Free Text Input */}
      <footer className="max-w-4xl w-full mx-auto z-10 space-y-4">
        {!isGameOver && (
          <>
            {/* Clickable Suggestions */}
            {latestTurn?.propositions_suivantes && latestTurn.propositions_suivantes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {latestTurn.propositions_suivantes.map((choice, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => handleChoiceClick(choice)}
                    className="p-3 bg-slate-900/90 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left text-xs text-slate-200 hover:text-white transition-all shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                  >
                    <span className="text-indigo-400 font-bold mr-1.5">[{idx + 1}]</span>
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {/* Custom Free Input Form */}
            <form onSubmit={handleCustomSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  disabled={loading}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder="Ou écrivez votre propre réponse libre..."
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-500 focus:outline-none shadow-xl transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </footer>
    </div>
  );
};
