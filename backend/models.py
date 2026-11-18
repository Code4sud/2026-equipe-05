from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field

class GaugeConfig(BaseModel):
    id: str
    nom: str
    depart: int = Field(..., ge=0, le=100)
    seuil_echec: Optional[int] = None
    seuil_victoire: Optional[int] = None

class PersonaConfig(BaseModel):
    nom_role: str
    ton: str
    premier_message: str

class Scenario(BaseModel):
    scenario_id: str
    titre_metier: str
    secteur: str
    contexte: str
    objectif_etudiant: str
    tours_max: int = 10
    persona: PersonaConfig
    regles_evaluation: str
    jauges: List[GaugeConfig]
    propositions_depart: List[str]

class AgentTurnResponse(BaseModel):
    replique_bulle: str = Field(..., description="La réplique prononcée par l'avatar dans sa bulle de dialogue.")
    humeur_avatar: Literal["neutral", "happy", "angry"] = Field(..., description="Humeur actuelle de l'avatar.")
    deltas_jauges: Dict[str, int] = Field(..., description="Dictionnaires des variations de jauges (ex: {'securite': -10, 'avancement': 15}).")
    explication_pedagogique: str = Field(..., description="Encart explicatif pédagogique de l'impact de la réponse.")
    echec_critique: bool = Field(..., description="True si l'étudiant a tenu des propos déplacés, insultants ou dangereux entraînant un arrêt immédiat.")
    propositions_suivantes: List[str] = Field(..., description="3 suggestions de réponses contextuelles pour le tour suivant.")

class ScenarioCreateRequest(BaseModel):
    scenario_id: Optional[str] = None
    titre_metier: str
    secteur: str
    contexte: str
    objectif_etudiant: str
    tours_max: int = 10
    persona: PersonaConfig
    regles_evaluation: str
    jauges: List[GaugeConfig]
    propositions_depart: List[str]

class TurnRequest(BaseModel):
    message: str

class SessionState(BaseModel):
    session_id: str
    scenario_id: str
    scenario: Scenario
    tour_actuel: int
    jauges_actuelles: Dict[str, int]
    historique: List[Dict[str, str]]
    statut: Literal["EN_COURS", "VICTOIRE", "DEFAITE"]
    message_fin: Optional[str] = None
