import React, { useState, useEffect } from 'react';
import { Scenario, SessionState, AgentTurnResponse } from './types';
import { fetchScenarios, createScenario, startSession, sendTurn } from './api';
import { HomeCatalog } from './components/HomeCatalog';
import { ScenarioStudio } from './components/ScenarioStudio';
import { GameStage } from './components/GameStage';
import { Loader2, AlertCircle } from 'lucide-react';
import { GameplayPrototype } from "./components/gameplay/GameplayPrototype";
import { DESK, TONE } from "./components/gameplay/ui";

export function App() {
  const [view, setView] = useState<'catalog' | 'studio' | 'game'>('catalog');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active game session state
  const [session, setSession] = useState<SessionState | null>(null);
  const [latestTurn, setLatestTurn] = useState<AgentTurnResponse | null>(null);
  const [gameLoading, setGameLoading] = useState<boolean>(false);

    const [slowWait, setSlowWait] = useState(false);
  useEffect(() => {
    if (!loadingScenarios && !gameLoading) { setSlowWait(false); return; }
    const t = setTimeout(() => setSlowWait(true), 3000);
    return () => clearTimeout(t);
  }, [loadingScenarios, gameLoading]);

  const isGameplayPrototype =
      new URLSearchParams(window.location.search).get("prototype") === "1";

  useEffect(() => {
    if (!isGameplayPrototype) {
      loadScenariosList();
    }
  }, [isGameplayPrototype]);

  const loadScenariosList = async () => {
    setLoadingScenarios(true);
    setError(null);
    try {
      const data = await fetchScenarios();
      setScenarios(data);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les scénarios depuis le backend.");
    } finally {
      setLoadingScenarios(false);
    }
  };

  const handleStartSimulation = async (scenarioId: string) => {
    setGameLoading(true);
    setError(null);
    try {
      const res = await startSession(scenarioId);
      setSession(res.session);
      setLatestTurn(res.agent_turn);
      setView('game');
    } catch (err: any) {
      setError(err.message || "Erreur lors du démarrage de la session.");
    } finally {
      setGameLoading(false);
    }
  };

  const handleSendTurn = async (message: string) => {
    if (!session) return;
    setGameLoading(true);
    try {
      const res = await sendTurn(session.session_id, message);
      setSession(res.session);
      setLatestTurn(res.agent_turn);
    } catch (err: any) {
      setError(err.message || "Erreur lors du tour de jeu.");
    } finally {
      setGameLoading(false);
    }
  };

  const handleScenarioCreated = (newScenario: Scenario) => {
    setScenarios(current => [...current, newScenario]);
    setView('catalog');
  };
// Prototype gameplay indépendant : aucune connexion au backend.
  if (isGameplayPrototype) {
    return <GameplayPrototype />;
  }

  if (loadingScenarios) {
    return (
      <div className={`min-h-screen ${DESK} flex flex-col items-center justify-center space-y-4`}>
        <Loader2 className="w-10 h-10 animate-spin text-[#e0b252]" />
                <p className="text-[#a39d8a] text-sm font-medium">Chargement d'Agora Explorer...</p>
        {slowWait && (
          <p className="text-[#e0b252] text-xs font-medium text-center max-w-xs">
            Le serveur se réveille, 30 secondes de patience…
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${DESK} font-sans selection:bg-[#e0b252] selection:text-[#14171a]`}>
      {slowWait && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border border-[#e0b252] bg-[#14171a] px-4 py-2.5 text-xs font-semibold text-[#e0b252] shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          Le serveur se réveille, 30 secondes de patience…
        </div>
      )}
      {error && (
        <div className={`border-b px-6 py-2.5 flex items-center justify-between text-xs font-semibold ${TONE.bad.border} ${TONE.bad.bg} ${TONE.bad.text}`}>
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </span>
          <button onClick={() => setError(null)} className="underline hover:opacity-80">Fermer</button>
        </div>
      )}

      {view === 'catalog' && (
        <HomeCatalog
          scenarios={scenarios}
          onSelectScenario={handleStartSimulation}
          onOpenStudio={() => setView('studio')}
        />
      )}

      {view === 'studio' && (
        <ScenarioStudio
          onScenarioCreated={handleScenarioCreated}
          onCancel={() => setView('catalog')}
          onCreateApi={createScenario}
        />
      )}

      {view === 'game' && session && (
        <GameStage
          session={session}
          latestTurn={latestTurn}
          onSendTurn={handleSendTurn}
          onRestart={() => handleStartSimulation(session.scenario_id)}
          onQuit={() => {
            setSession(null);
            setLatestTurn(null);
            setView('catalog');
          }}
          loading={gameLoading}
        />
      )}
    </div>
  );
}

export default App;
