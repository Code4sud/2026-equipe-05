export interface GaugeConfig {
  id: string;
  nom: string;
  depart: number;
  seuil_echec?: number | null;
  seuil_victoire?: number | null;
}

export interface PersonaConfig {
  nom_role: string;
  ton: string;
  premier_message: string;
}

export interface Scenario {
  scenario_id: string;
  titre_metier: string;
  secteur: string;
  contexte: string;
  objectif_etudiant: string;
  tours_max: number;
  persona: PersonaConfig;
  regles_evaluation: string;
  jauges: GaugeConfig[];
  propositions_depart: string[];
}

export interface AgentTurnResponse {
  replique_bulle: string;
  humeur_avatar: "neutral" | "happy" | "angry";
  deltas_jauges: Record<string, number>;
  explication_pedagogique: string;
  echec_critique: boolean;
  propositions_suivantes: string[];
}

export interface SessionState {
  session_id: string;
  scenario_id: string;
  scenario: Scenario;
  tour_actuel: number;
  jauges_actuelles: Record<string, number>;
  historique: Array<{ role: string; content: string }>;
  statut: "EN_COURS" | "VICTOIRE" | "DEFAITE";
  message_fin?: string | null;
}
