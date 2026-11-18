import { Scenario, SessionState, AgentTurnResponse } from './types';

const API_BASE = '/api';

export async function fetchScenarios(): Promise<Scenario[]> {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error("Erreur lors de la récupération des scénarios.");
  return res.json();
}

export async function createScenario(payload: Omit<Scenario, 'scenario_id'>): Promise<Scenario> {
  const res = await fetch(`${API_BASE}/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Erreur lors de la création du scénario.");
  return res.json();
}

export async function startSession(scenarioId: string): Promise<{ session: SessionState; agent_turn: AgentTurnResponse }> {
  const res = await fetch(`${API_BASE}/sessions/start/${scenarioId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error("Erreur lors du démarrage de la session.");
  return res.json();
}

export async function sendTurn(sessionId: string, message: string): Promise<{ session: SessionState; agent_turn: AgentTurnResponse }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erreur réseau" }));
    throw new Error(err.detail || "Erreur lors de l'envoi du message.");
  }
  return res.json();
}
