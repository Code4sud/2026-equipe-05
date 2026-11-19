from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field

# --- Existing Models from backend/models.py ---
class GaugeConfig(BaseModel):
    id: str = Field(..., min_length=1)
    nom: str = Field(..., min_length=1)
    depart: int = Field(..., ge=0, le=100)
    seuil_echec: Optional[int] = Field(default=None, ge=0, le=100)
    seuil_victoire: Optional[int] = Field(default=None, ge=0, le=100)

class PersonaConfig(BaseModel):
    nom_role: str = Field(..., min_length=1)
    ton: str = Field(..., min_length=1)
    premier_message: str = Field(..., min_length=1)

class Scenario(BaseModel):
    scenario_id: str = Field(..., min_length=1)
    titre_metier: str = Field(..., min_length=1)
    secteur: str = Field(..., min_length=1)
    contexte: str = Field(..., min_length=1)
    objectif_etudiant: str = Field(..., min_length=1)
    tours_max: int = Field(default=10, ge=1, le=50)
    persona: PersonaConfig
    regles_evaluation: Optional[str] = ""
    jauges: List[GaugeConfig] = Field(..., min_length=1)
    propositions_depart: List[str] = Field(..., min_length=1)
    system_prompt_agent_2: Optional[str] = None

class AgentTurnResponse(BaseModel):
    replique_bulle: str = Field(..., description="La réplique prononcée par l'avatar dans sa bulle de dialogue.")
    humeur_avatar: Literal["neutral", "happy", "angry"] = Field(..., description="Humeur actuelle de l'avatar.")
    deltas_jauges: Dict[str, int] = Field(..., description="Dictionnaires des variations de jauges (ex: {'securite': -10, 'avancement': 15}).")
    explication_pedagogique: str = Field(..., description="Encart explicatif pédagogique de l'impact de la réponse.")
    echec_critique: bool = Field(..., description="True si l'étudiant a tenu des propos déplacés, insultants ou dangereux entraînant un arrêt immédiat.")
    propositions_suivantes: List[str] = Field(..., description="3 suggestions de réponses contextuelles pour le tour suivant.")
    erreur_api: Optional[str] = Field(default=None, description="Message d'erreur détaillé en cas d'échec de communication avec l'API IA.")

class ScenarioCreateRequest(BaseModel):
    scenario_id: Optional[str] = None
    titre_metier: str = Field(..., min_length=1)
    secteur: str = Field(..., min_length=1)
    contexte: str = Field(..., min_length=1)
    objectif_etudiant: str = Field(..., min_length=1)
    tours_max: int = Field(default=10, ge=1, le=50)
    persona: PersonaConfig
    regles_evaluation: Optional[str] = ""
    jauges: List[GaugeConfig] = Field(..., min_length=1)
    propositions_depart: List[str] = Field(..., min_length=1)
    system_prompt_agent_2: Optional[str] = None

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


# --- New Compiler & Scenario Schema Models ---
class GaugeDefinition(BaseModel):
    id: str = Field(..., description="Identifiant technique unique de la jauge (ex: securite, technique, relationnel)")
    nom: str = Field(..., description="Nom affiché de la jauge")
    valeur_depart: int = Field(50, ge=0, le=100, description="Valeur initiale de la jauge entre 0 et 100")
    seuil_echec: Optional[int] = Field(None, ge=0, le=100, description="Seuil critique entraînant l'échec si atteint ou franchi")
    seuil_victoire: Optional[int] = Field(None, ge=0, le=100, description="Seuil requis pour valider le succès")
    description_critere: Optional[str] = Field(None, description="Description des critères d'évolution de la jauge")

class RawScenarioForm(BaseModel):
    titre_metier: str = Field(..., description="Titre du métier ou de la situation professionnelle")
    secteur: str = Field(..., description="Secteur d'activité ou domaine")
    contexte: str = Field(..., description="Contexte initial détaillé de la situation")
    objectif_etudiant: str = Field(..., description="Objectif pédagogique assigné à l'étudiant")
    tours_max: int = Field(6, ge=1, le=20, description="Nombre maximal d'échanges (tours) autorisés")
    persona_nom_role: str = Field(..., description="Nom et rôle du personnage incarné par l'Agent 2")
    persona_ton: str = Field(..., description="Ton et posture de communication de l'Agent 2")
    persona_infos_cachees: Optional[str] = Field(None, description="Informations secrètes connues uniquement de l'Agent 2")
    premier_message: str = Field(..., description="Premier message d'introduction de l'Agent 2")
    jauges: List[GaugeDefinition] = Field(..., description="Liste des jauges de progression de la simulation")
    propositions_depart: List[str] = Field(..., description="Suggestions de départ proposées à l'étudiant")

class CompiledAgent2Config(BaseModel):
    system_prompt_agent_2: str = Field(..., description="Prompt système complet et structuré pour l'Agent 2")
    grille_notation_resume: Dict[str, str] = Field(..., description="Résumé des règles d'évolution pour chaque jauge")
    regles_securite_actives: List[str] = Field(..., description="Liste des fautes éliminatoires et règles de sécurité/tolérance zéro")

class CompiledScenarioResponse(BaseModel):
    scenario_id: str = Field(..., description="Identifiant unique du scénario compilé")
    form: RawScenarioForm = Field(..., description="Données brutes du formulaire d'origine")
    compiled: CompiledAgent2Config = Field(..., description="Configuration compilée pour l'Agent 2")
