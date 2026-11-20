import { Scenario, SessionState, AgentTurnResponse } from './types';

const RAW_API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
const API_BASE = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API}/api`) : '/api';

export type ScenarioCreatePayload = Omit<Scenario, 'scenario_id'> & { scenario_id?: string };

export interface ScenarioValidationResult {
  valid: boolean;
  scenario?: ScenarioCreatePayload;
  errors?: Array<{ field: string; message: string; type: string }>;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error("Délai d'attente dépassé (timeout réseau ou IA). Veuillez réessayer.");
    }
    throw error;
  }
}

export async function fetchScenarios(): Promise<Scenario[]> {
  const res = await fetchWithTimeout(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error("Erreur lors de la récupération des scénarios.");
  return res.json();
}

export async function createScenario(payload: ScenarioCreatePayload): Promise<Scenario> {
  const res = await fetchWithTimeout(`${API_BASE}/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, 45000); // 45s timeout pour laisser le temps à l'Agent 1 de compiler
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erreur lors de la création du scénario." }));
    throw new Error(err.detail || "Erreur lors de la création du scénario.");
  }
  return res.json();
}

export async function validateScenarioJson(payload: unknown): Promise<ScenarioValidationResult> {
  const res = await fetchWithTimeout(`${API_BASE}/scenarios/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 10000);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erreur réseau pendant la validation.' }));
    throw new Error(err.detail || 'Impossible de valider le scénario.');
  }
  return res.json();
}

export async function startSession(scenarioId: string): Promise<{ session: SessionState; agent_turn: AgentTurnResponse }> {
  const res = await fetchWithTimeout(`${API_BASE}/sessions/start/${scenarioId}`, {
    method: 'POST'
  }, 30000);
  if (!res.ok) throw new Error("Erreur lors du démarrage de la session.");
  return res.json();
}

export async function sendTurn(sessionId: string, message: string): Promise<{ session: SessionState; agent_turn: AgentTurnResponse }> {
  const res = await fetchWithTimeout(`${API_BASE}/sessions/${sessionId}/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  }, 35000);
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Erreur réseau" }));
    throw new Error(err.detail || "Erreur lors de l'envoi du message.");
  }
  return res.json();
}
